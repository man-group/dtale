import json
import math
import os
import re
import traceback
import urllib
from logging import getLogger

import dash_core_components as dcc
import dash_html_components as html
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from plotly.io import write_html
from six import PY3, StringIO, string_types

import dtale.dash_application.components as dash_components
import dtale.global_state as global_state
from dtale.charts.utils import (YAXIS_CHARTS, ZAXIS_CHARTS, build_agg_data,
                                build_base_chart)
from dtale.charts.utils import build_formatters as chart_formatters
from dtale.charts.utils import (build_group_inputs_filter, check_all_nan,
                                check_exceptions, retrieve_chart_data,
                                valid_chart, weekday_tick_handler)
from dtale.dash_application.layout import (AGGS, ANIMATE_BY_CHARTS,
                                           ANIMATION_CHARTS, build_error,
                                           test_plotly_version,
                                           update_label_for_freq)
from dtale.dash_application.topojson_injections import INJECTIONS
from dtale.utils import (build_code_export, classify_type, dict_merge,
                         divide_chunks, export_to_csv_buffer, find_dtype,
                         find_dtype_formatter, fix_url_path, flatten_lists,
                         get_dtypes, make_list, run_query)

logger = getLogger(__name__)


def get_url_parser():
    """
     Returns URL parser based on whether Python 2 or 3 is being used.
    """
    if PY3:
        return urllib.parse.parse_qsl
    else:
        try:
            return urllib.parse_qsl
        except BaseException:
            from urlparse import parse_qsl
            return parse_qsl


def chart_url_params(search):
    """
    Builds chart parameters by parsing the query string from main URL

    :param search: URL querystring
    :param search: str
    :return: dictionary of parsed querystring key/values
    :rtype: dict
    """
    if not search:
        return {}
    if isinstance(search, string_types):
        params = dict(get_url_parser()(search.lstrip('?')))
    else:
        params = search
    for gp in ['y', 'group', 'map_group', 'group_val', 'yaxis']:
        if gp in params:
            params[gp] = json.loads(params[gp])
    params['cpg'] = 'true' == params.get('cpg')
    if params.get('chart_type') in ANIMATION_CHARTS:
        params['animate'] = 'true' == params.get('animate')
    if 'window' in params:
        params['window'] = int(params['window'])
    if 'group_filter' in params:
        params['query'] = ' and '.join([params[p] for p in ['query', 'group_filter'] if params.get(p) is not None])
        del params['group_filter']
        params['cpg'] = False
    return params


def url_encode_func():
    return urllib.parse.urlencode if PY3 else urllib.urlencode


def chart_url_querystring(params, data=None, group_filter=None):
    base_props = ['chart_type', 'query', 'x', 'z', 'agg', 'window', 'rolling_comp']
    chart_type = params.get('chart_type')
    if chart_type == 'bar':
        base_props += ['barmode', 'barsort']
    elif chart_type == 'maps':
        map_type = params.get('map_type')
        if map_type == 'scattergeo':
            base_props += ['map_type', 'lat', 'lon', 'map_val', 'scope', 'proj']
        elif map_type == 'mapbox':
            base_props += ['map_type', 'lat', 'lon', 'map_val', 'mapbox_style']
        else:
            base_props += ['map_type', 'loc_mode', 'loc', 'map_val']
        base_props += ['map_group']

    if chart_type in ['maps', 'heatmap']:
        base_props += ['colorscale']

    final_params = {k: params[k] for k in base_props if params.get(k) is not None}
    final_params['cpg'] = 'true' if params.get('cpg') is True else 'false'
    if chart_type in ANIMATION_CHARTS:
        final_params['animate'] = 'true' if params.get('animate') is True else 'false'
    if chart_type in ANIMATE_BY_CHARTS and params.get('animate_by') is not None:
        final_params['animate_by'] = params.get('animate_by')
    for gp in ['y', 'group', 'map_group', 'group_val']:
        list_param = [val for val in params.get(gp) or [] if val is not None]
        if len(list_param):
            final_params[gp] = json.dumps(list_param)

    if final_params['chart_type'] in YAXIS_CHARTS:
        params_yaxis = {}
        for y, range in (params.get('yaxis') or {}).items():
            if y not in ((data or {}).get('min') or {}):
                continue
            if not (range['min'], range['max']) == (data['min'][y], data['max'][y]):
                params_yaxis[y] = range
        if len(params_yaxis):
            final_params['yaxis'] = json.dumps(params_yaxis)

    if group_filter is not None:
        group_val, y_val = (group_filter.get(p) for p in ['group', 'y'])
        if group_val:
            final_params['group_filter'] = group_val
        if y_val:
            final_params['y'] = json.dumps([y_val])
    return url_encode_func()(final_params)


def graph_wrapper(**kwargs):
    curr_style = kwargs.pop('style', None) or {}
    return dcc.Graph(
        style=dict_merge({'height': '100%'}, curr_style),
        **kwargs
    )


def build_axes(data_id, x, axis_inputs, mins, maxs, z=None, agg=None):
    """
    Returns helper function for building axis configurations against a specific y-axis.

    :param data_id: identifier of data to build axis configurations against
    :type data_id: str
    :param x: column to be used as x-axis of chart
    :type x: str
    :param axis_inputs: current settings for y-axis limits
    :type axis_inputs: dict
    :param mins: minimums for all columns involved in chart
    :type mins: dict
    :param maxs: maximums for all columns invloved in chart
    :param maxs: dict
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being applied to.
    :type agg: str, optional
    :return: handler function to be applied against each y-axis used in chart
    :rtype: func
    """
    data = global_state.get_data(data_id)
    dtypes = get_dtypes(data)
    axis_type, axis_data = (axis_inputs.get(p) for p in ['type', 'data'])

    def _add_agg_label(title):
        if z is None and agg is not None:
            return '{} ({})'.format(title, AGGS[agg])
        return title

    def _build_axes(y):
        axes = {'xaxis': dict(title=update_label_for_freq(x))}
        has_multiaxis = False
        positions = []
        if axis_type == 'multi':  # take the default behavior for plotly
            for i, y2 in enumerate(y, 0):
                right = i % 2 == 1
                axis_ct = int(i / 2)
                value = dict(title=_add_agg_label(update_label_for_freq(y2)))
                if i == 0:
                    key = 'yaxis'
                else:
                    has_multiaxis = True
                    key = 'yaxis{}'.format(i + 1)
                    value = dict_merge(value, dict(overlaying='y', side='right' if right else 'left'))
                    value['anchor'] = 'free' if axis_ct > 0 else 'x'
                    if axis_ct > 0:
                        pos = axis_ct / 20.0
                        value['position'] = (1 - pos) if right else pos
                        positions.append(value['position'])
                if y2 in axis_data and not (axis_data[y2]['min'], axis_data[y2]['max']) == (mins[y2], maxs[y2]):
                    value['range'] = [axis_data[y2]['min'], axis_data[y2]['max']]
                if classify_type(dtypes.get(y2)) == 'I':
                    value['tickformat'] = '.0f'
                axes[key] = value
        elif axis_type == 'single':
            yaxis_cfg = dict(title=_add_agg_label(update_label_for_freq(y)))
            all_range = axis_data.get('all') or {}
            all_range = [all_range.get(p) for p in ['min', 'max'] if all_range.get(p) is not None]
            if len(all_range) and all_range != (min(mins.values()), max(maxs.values())):
                yaxis_cfg['range'] = [all_range[0], all_range[1]]
            if classify_type(dtypes.get(y[0])) == 'I':
                yaxis_cfg['tickformat'] = '.0f'
            axes['yaxis'] = yaxis_cfg
        else:
            yaxis_cfg = dict(title=_add_agg_label(update_label_for_freq(y)))
            if classify_type(dtypes.get(y[0])) == 'I':
                yaxis_cfg['tickformat'] = '.0f'
            axes['yaxis'] = yaxis_cfg

        if len(positions):
            if len(positions) == 1:
                domain = [positions[0] + 0.05, 1]
            elif len(positions) == 2:
                domain = sorted(positions)
                domain = [domain[0] + 0.05, domain[1] - 0.05]
            else:
                lower, upper = divide_chunks(sorted(positions), 2)
                domain = [lower[-1] + 0.05, upper[0] - 0.05]
            axes['xaxis']['domain'] = domain
        if classify_type(dtypes.get(x)) == 'I':
            axes['xaxis']['tickformat'] = '.0f'
        if z is not None:
            axes['zaxis'] = dict(title=z if agg is None else '{} ({})'.format(z, AGGS[agg]))
            if classify_type(dtypes.get(z)) == 'I':
                axes['zaxis']['tickformat'] = '.0f'
        return axes, has_multiaxis
    return _build_axes


def build_spaced_ticks(ticktext, mode='auto'):
    """
    plotly/dash doesn't have particularly good tick position handling so in order to handle this on our end we'll take
    the list of tick labels and depending on how large that list is we'll build a configuration which will show a
    smaller group of ticks evenly spaced.

    :param ticktext: list of tick labels
    :type ticktext: list
    :return: tick configuration
    :rtype: dict
    """
    size = len(ticktext)
    factor = int(math.ceil(size / 28.0))
    tick_cutoff = 30
    if mode == 'array':
        tickvals = list(range(size))
        if size <= tick_cutoff:
            return {'tickmode': 'array', 'tickvals': tickvals, 'ticktext': ticktext}
        spaced_ticks, spaced_text = [tickvals[0]], [ticktext[0]]
        for i in range(factor, size - 1, factor):
            spaced_ticks.append(tickvals[i])
            spaced_text.append(ticktext[i])
        spaced_ticks.append(tickvals[-1])
        spaced_text.append(ticktext[-1])
        return {'tickmode': 'array', 'tickvals': spaced_ticks, 'ticktext': spaced_text}
    if size <= tick_cutoff:
        return {'tickmode': 'auto', 'nticks': size}
    nticks = len(range(factor, size - 1, factor)) + 2
    return {'tickmode': 'auto', 'nticks': nticks}


def chart_wrapper(data_id, data, url_params=None):
    """
    Wrapper function which will wrap each plotly/dash chart with a link to view the chart in a separate popup

    :param data_id: identifier of data to build axis configurations against
    :type data_id: str
    :param data: data generated by :meth:`dtale.charts.utils.build_chart`
    :param url_params: parameters to be encoded within popup link
    :return: dash components wrapped in div with popup link
    :rtype: :dash:`dash_html_components.Div <dash-html-components/div>`
    """
    if url_params is None:
        return lambda chart: chart

    def _chart_wrapper(chart, group_filter=None):
        querystring = chart_url_querystring(url_params, data=data, group_filter=group_filter)
        app_root = url_params.get('app_root') or ''

        def build_url(path, query):
            return fix_url_path('{}/{}/{}?{}'.format(app_root, path, data_id, query))
        popup_link = html.A(
            [html.I(className='far fa-window-restore mr-4'), html.Span('Popup Chart')],
            href=build_url('/charts', querystring),
            target='_blank',
            className='mr-5'
        )
        copy_link = html.Div(
            [html.A(
                [html.I(className='ico-link mr-4'), html.Span('Copy Link')],
                href=build_url('/charts', querystring),
                target='_blank',
                className='mr-5 copy-link-btn'
            ), html.Div('Copied to clipboard', className="hoverable__content copy-tt-bottom")
            ],
            className='hoverable-click'
        )
        code_snippet = html.A(
            [html.I(className='ico-code mr-4'), html.Span('Code Export')],
            href='#',
            className='code-snippet-btn mr-5',
        )
        export_html_link = html.A(
            [html.I(className='fas fa-file-code mr-4'), html.Span('Export Chart')],
            href=build_url('/dtale/chart-export', querystring),
            className='export-chart-btn mr-5'
        )
        export_csv_link = html.A(
            [html.I(className='fas fa-file-csv mr-4'), html.Span('Export CSV')],
            href=build_url('/dtale/chart-csv-export', querystring),
            className='export-chart-btn'
        )
        links = html.Div(
            [popup_link, copy_link, code_snippet, export_html_link, export_csv_link],
            style={'position': 'absolute', 'zIndex': 5}
        )
        return html.Div([links, chart], style={'position': 'relative', 'height': '100%'})
    return _chart_wrapper


def build_title(x, y, group=None, z=None, agg=None):
    """
    Helper function to build chart titles based on the inputs for x, y, z, group & aggregation.
        - (x='a', y='b') => 'b by a'
        - (x='a', y=['b','c']) => 'b, c by a'
        - (x='a', y='b', z='c') => 'b by a weighted by c'
        - (x='a', y='b', group='d') => 'd - b by a'
        - (x='a', y='b', agg='corr') => 'b by a (Correlation)'
        - (x='a', y='b', z='c', agg='sum') => 'b by a weighted by c (Sum)'

    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param group: column(s) to use for grouping
    :type group: list of str or str, optional
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being applied to.
    :type agg: str, optional
    :return: chart title
    :rtype: str
    """
    y_title = ', '.join([update_label_for_freq(y2) for y2 in make_list(y)])
    x_title = update_label_for_freq(x)
    title = '{} by {}'.format(y_title, x_title)
    if z:
        title = '{} weighted by {}'.format(title, z)
    if agg:
        agg_title = AGGS[agg]
        title = '{} ({})'.format(title, agg_title)
    if group:
        title = '{} - {}'.format(group, title)
    return {'title': {'text': title}}


def build_series_name(y, chart_per_group=False):
    """
    Builds a helper function to build a name for a series in a chart.
        - (y='a,b,c', chart_per_group=False, sub_y='a', group='d') => 'd/a'
        - (y='a,b,c', chart_per_group=True, sub_y='a', group='d') => 'a'
        - (y='a,b,c', chart_per_group=False, sub_y='a', group='all') => 'a'

    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param chart_per_group: `True` if charts are split by groups, `False` if all are contained within one chart
    :type chart_per_group: bool
    :return: helper function for building series names based off y-axis & group values
    :rtype: func
    """
    multi_y = len(y or []) > 1

    def _handler(sub_y, group=None):
        name_segs = []
        if group != 'all' and not chart_per_group:
            name_segs.append(group)
        if multi_y:
            name_segs.append(sub_y)
        if len(name_segs):
            return dict(name='/'.join(name_segs))
        return dict()
    return _handler


def build_layout(cfg):
    """
    Wrapper function for :plotly:`plotly.graph_objects.Layout <plotly.graph_objects.Layout>`

    :param cfg: layout configuration
    :type cfg: dict
    :return: layout object
    :rtype: :plotly:`plotly.graph_objects.Layout <plotly.graph_objects.Layout>`
    """
    return go.Layout(**dict_merge(dict(legend=dict(orientation='h')), cfg))


def cpg_chunker(charts, columns=2):
    """
    Helper function to break a list of charts up into rows of two.  If there is only one chart it will only return
    one row with the chart occupying the full width.

    :param charts: chart objects
    :type charts: list of :dash:`dash_core_components.Groph <dash-core-components/graph>`
    :param columns: how many columns each row of charts should have (default: 2)
    :type columns: int
    :return: list of rows by `columns` if more than one chart is input otherwise simply return the chart
    """
    if len(charts) == 1:
        return charts

    def _formatter(chart):
        chart.style.pop('height', None)
        return html.Div(chart, className='col-md-6')

    return [
        html.Div([_formatter(c) for c in chunk], className='row')
        for chunk in divide_chunks(charts, columns)
    ]


def scatter_builder(data, x, y, axes_builder, wrapper, group=None, z=None, agg=None, animate_by=None):
    """
    Builder function for :plotly:`plotly.graph_objects.Scatter <plotly.graph_objects.Scatter>`

    :param data: raw data to be represented within scatter chart
    :type data: dict
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param axes_builder: function for building axis configurations
    :type axes_builder: func
    :param wrapper: wrapper function returned by :meth:`dtale.charts.utils.chart_wrapper`
    :type wrapper: func
    :param z: column to use for the Z-Axis
    :type z: str
    :param group: column(s) to use for grouping
    :type group: list of str or str
    :param agg: points to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :type agg: str
    :return: scatter chart
    :rtype: :plotly:`plotly.graph_objects.Scatter <plotly.graph_objects.Scatter>`
    """

    def layout(axes):
        if z is not None:
            return {'margin': {'l': 0, 'r': 0, 'b': 0},
                    'scene': dict_merge(axes, dict(aspectmode='data'))}
        return axes

    def marker(series):
        if z is not None:
            return {'size': 8, 'color': series[z], 'colorscale': 'Blackbody', 'opacity': 0.8,
                    'showscale': True, 'colorbar': {'thickness': 15, 'len': 0.5, 'x': 0.8, 'y': 0.6}}
        return {'size': 15, 'line': {'width': 0.5, 'color': 'white'}}

    scatter_func = go.Scatter3d if z is not None else go.Scattergl

    def _build_final_scatter(y_val):
        figure_cfg = {
            'data': [
                scatter_func(**dict_merge(
                    dict(x=d['x'], y=d[y_val], mode='markers', opacity=0.7, name=series_key, marker=marker(d)),
                    dict(z=d[z]) if z is not None else dict())
                )
                for series_key, d in data['data'].items() if y_val in d and (group is None or group == series_key)
            ], 'layout': build_layout(
                dict_merge(build_title(x, y_val, group, z=z, agg=agg), layout(axes_builder([y_val])[0]))
            )
        }
        if animate_by is not None:
            def build_frame(frame):
                for series_key, series in frame.items():
                    if y_val in series and (group is None or group == series_key):
                        yield scatter_func(**dict(
                            x=series['x'], y=series[y_val], mode='markers', opacity=0.7,
                            name=series_key, marker=marker(series)
                        ))

            update_cfg_w_frames(figure_cfg, *build_frames(data, build_frame))

        return wrapper(graph_wrapper(
            id='scatter-{}-{}'.format(group or 'all', y_val),
            figure=figure_cfg
        ), group_filter=dict_merge(dict(y=y_val), {} if group is None else dict(group=group)))
    return [_build_final_scatter(y2) for y2 in y]


def surface_builder(data, x, y, z, axes_builder, wrapper, agg=None):
    """
    Builder function for :plotly:`plotly.graph_objects.Surface <plotly.graph_objects.Surface>`

    :param data: raw data to be represented within surface chart
    :type data: dict
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param z: column to use for the Z-Axis
    :type z: str
    :param axes_builder: function for building axis configurations
    :type axes_builder: func
    :param wrapper: wrapper function returned by :meth:`dtale.charts.utils.chart_wrapper`
    :type wrapper: func
    :param group: column(s) to use for grouping
    :type group: list of str or str
    :param agg: points to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :type agg: str
    :return: surface chart
    :rtype: :plotly:`plotly.graph_objects.Surface <plotly.graph_objects.Surface>`
    """
    scene = dict(aspectmode='data', camera={'eye': {'x': 2, 'y': 1, 'z': 1.25}})

    df = pd.DataFrame({k: v for k, v in data['data']['all'].items() if k in ['x', y[0], z]})
    df = df.set_index(['x', y[0]]).unstack(0)[z]
    x_vals = df.columns
    y_vals = df.index.values
    z_data = df.values

    axes, _ = axes_builder([y[0]])
    layout = {'autosize': True, 'margin': {'l': 0, 'r': 0, 'b': 0}, 'scene': dict_merge(axes, scene)}
    return [
        wrapper(graph_wrapper(
            id='surface-{}'.format(y2),
            figure={'data': [
                go.Surface(x=x_vals, y=y_vals, z=z_data, opacity=0.8, name='all', colorscale='YlGnBu',
                           colorbar={'title': layout['scene']['zaxis']['title'], 'thickness': 15, 'len': 0.5,
                                     'x': 0.8, 'y': 0.6})
            ], 'layout': build_layout(dict_merge(build_title(x, y2, z=z, agg=agg), layout))}
        ), group_filter=dict(y=y2))
        for y2 in y
    ]


def build_grouped_bars_with_multi_yaxis(series_cfgs, y):
    """
    This generator is a hack for the lack of support plotly has for sorting
    :plotly:`plotly.graph_objects.Bar <plotly.graph_objects.Bar>` charts by an axis other than 'y'.  This
    also helps with issues around displaying multiple y-axis.

    :param series_cfgs: configurations for all the series within a bar chart
    :type series_cfgs: list of dict
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :return: updated series configurations
    :type: generator
    """
    for i, y2 in enumerate(y, 1):
        for series in series_cfgs:
            curr_y = series.get('yaxis')
            yaxis = 'y{}'.format(i)
            if (i == 1 and curr_y is None) or (yaxis == curr_y):
                yield series
            else:
                yield dict_merge(
                    {k: v for k, v in series.items() if k in ['x', 'name', 'type']},
                    dict(hoverinfo='none', showlegend=False, y=[0]),
                    dict(yaxis=yaxis) if i > 1 else {}
                )


def update_cfg_w_frames(cfg, frames, slider_steps):
    cfg['frames'] = frames
    cfg['layout']['updatemenus'] = [{
        'x': 0.1, 'y': 0, 'yanchor': "top", 'xanchor': "right", 'showactive': False,
        'direction': "left", 'type': "buttons", 'pad': {"t": 87, "r": 10},
        'buttons': [
            {'label': 'Play', 'method': 'animate', 'args': [None]},
            {'label': 'Pause', 'method': 'animate', 'args': [
                [None],
                {"frame": {"duration": 0, "redraw": False}, "mode": "immediate", "transition": {"duration": 0}}
            ]}
        ]
    }]
    if slider_steps is not None:
        cfg['layout']['sliders'] = [{
            'active': 0,
            'steps': [dict(
                label=ss, method='animate',
                args=[
                    [ss],
                    dict(mode='immediate', transition=dict(duration=300), frame=dict(duration=300))
                ]
            ) for ss in slider_steps],
            'x': 0.1, 'len': 0.9, 'xanchor': "left", 'y': 0, 'yanchor': "top", 'pad': {'t': 50, 'b': 10},
            'currentvalue': {
                'visible': True, 'prefix': "Year:", 'xanchor': "right",
                'font': {'size': 20, 'color': "#666"}
            },
            'transition': {'duration': 300, 'easing': "cubic-in-out"}
        }]


def build_frames(data, frame_builder):
    frames, slider_steps = [], []
    for frame in data.get('frames', []):
        frames.append(dict(data=list(frame_builder(frame['data'])), name=frame['name']))
        slider_steps.append(frame['name'])
    return frames, slider_steps


def bar_builder(data, x, y, axes_builder, wrapper, cpg=False, barmode='group', barsort=None, **kwargs):
    """
    Builder function for :plotly:`plotly.graph_objects.Surface <plotly.graph_objects.Surface>`

    :param data: raw data to be represented within surface chart
    :type data: dict
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param axes_builder: function for building axis configurations
    :type axes_builder: func
    :param wrapper: wrapper function returned by :meth:`dtale.charts.utils.chart_wrapper`
    :type wrapper: func
    :param group: column(s) to use for grouping
    :type group: list of str or str
    :param agg: points to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :type agg: str
    :return: surface chart
    :rtype: :plotly:`plotly.graph_objects.Surface <plotly.graph_objects.Surface>`
    """
    hover_text = dict()
    allow_multiaxis = barmode is None or barmode == 'group'
    axes, allow_multiaxis = axes_builder(y) if allow_multiaxis else axes_builder([y[0]])
    name_builder = build_series_name(y, cpg)
    for series_key, series in data['data'].items():
        barsort_col = 'x' if barsort == x or barsort not in series else barsort
        if barsort_col != 'x' or kwargs.get('agg') == 'raw':
            df = pd.DataFrame(series)
            df = df.sort_values(barsort_col)
            data['data'][series_key] = {c: df[c].values for c in df.columns}
            tickvals = list(range(len(df['x'])))
            data['data'][series_key]['x'] = tickvals
            hover_text[series_key] = {'hovertext': df['x'].values, 'hoverinfo': 'y+text'}
            axes['xaxis'] = dict_merge(
                axes.get('xaxis', {}),
                build_spaced_ticks(df['x'].values, mode='array')
            )

    if cpg:
        charts = [
            wrapper(graph_wrapper(
                id='bar-{}-graph'.format(series_key),
                figure={
                    'data': [
                        dict_merge(
                            {'x': series['x'], 'y': series[y2], 'type': 'bar'},
                            name_builder(y2, series_key),
                            {} if i == 1 or not allow_multiaxis else {'yaxis': 'y{}'.format(i)},
                            hover_text.get(series_key) or {}
                        )
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': build_layout(dict_merge(
                        build_title(x, y, series_key, agg=kwargs.get('agg')), axes, dict(barmode=barmode or 'group')
                    ))
                }
            ), group_filter=dict(group=series_key))
            for series_key, series in data['data'].items()
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            dict_merge(
                {'x': series['x'], 'y': series[y2], 'type': 'bar'},
                name_builder(y2, series_key),
                {} if i == 1 or not allow_multiaxis else {'yaxis': 'y{}'.format(i)},
                hover_text.get(series_key) or {}
            )
            for i, y2 in enumerate(y, 1)
        ]
        for series_key, series in data['data'].items()
    ])
    if barmode == 'group' and allow_multiaxis:
        data_cfgs = list(build_grouped_bars_with_multi_yaxis(data_cfgs, y))

    figure_cfg = {
        'data': data_cfgs,
        'layout': build_layout(
            dict_merge(build_title(x, y, agg=kwargs.get('agg')), axes, dict(barmode=barmode or 'group'))
        )
    }
    if kwargs.get('animate_by'):
        def build_frame(frame):
            data, layout = [], {}
            for series_key, series in frame['data'].items():
                barsort_col = 'x' if barsort == x or barsort not in series else barsort
                layout = {}
                if barsort_col != 'x' or kwargs.get('agg') == 'raw':
                    df = pd.DataFrame(series)
                    df = df.sort_values(barsort_col)
                    series = dict_merge(
                        {c: df[c].values for c in df.columns},
                        {'x': list(range(len(df['x']))), 'hovertext': df['x'].values, 'hoverinfo': 'y+text'}
                    )
                    layout['xaxis'] = dict_merge(
                        axes.get('xaxis', {}),
                        build_spaced_ticks(df['x'].values, mode='array')
                    )
                for i, y2 in enumerate(y, 1):
                    data.append(dict_merge(
                        {k: v for k, v in series.items() if k in ['x', 'hovertext', 'hoverinfo']},
                        {'y': series[y2], 'type': 'bar'},
                        name_builder(y2, series_key),
                        {} if i == 1 or not allow_multiaxis else {'yaxis': 'y{}'.format(i)},
                    ))
                if barmode == 'group' and allow_multiaxis:
                    data['data'] = list(build_grouped_bars_with_multi_yaxis(data['data'], y))
                return dict(data=data, layout=layout, name=frame['name'])

        def build_bar_frames(data, frame_builder):
            frames, slider_steps = [], []
            for frame in data.get('frames', []):
                frames.append(frame_builder(frame))
                slider_steps.append(frame['name'])
            return frames, slider_steps

        update_cfg_w_frames(figure_cfg, *build_bar_frames(data, build_frame))

    return wrapper(graph_wrapper(id='bar-graph', figure=figure_cfg))


def line_builder(data, x, y, axes_builder, wrapper, cpg=False, **inputs):
    """
    Builder function for :plotly:`plotly.graph_objects.Scatter(mode='lines') <plotly.graph_objects.Scatter>`

    :param data: raw data to be represented within line chart
    :type data: dict
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param axes_builder: function for building axis configurations
    :type axes_builder: func
    :param wrapper: wrapper function returned by :meth:`dtale.charts.utils.chart_wrapper`
    :type wrapper: func
    :param cpg: `True` if charts are split by groups, `False` if all are contained within one chart
    :type cpg: bool
    :param inputs: Optional keyword arguments containing information about which aggregation (if any) has been used
    :type inputs: dict
    :return: line chart
    :rtype: :plotly:`plotly.graph_objects.Scatter(mode='lines') <plotly.graph_objects.Scatter>`
    """

    axes, multi_yaxis = axes_builder(y)
    name_builder = build_series_name(y, cpg)

    def line_func(s):
        return go.Scattergl if len(s['x']) > 15000 else go.Scatter

    def line_cfg(s):
        if len(s['x']) > 15000:
            return {'mode': 'lines', 'line': {'shape': 'linear'}}
        return {'mode': 'lines', 'line': {'shape': 'spline', 'smoothing': 0.3}}

    if cpg:
        charts = [
            wrapper(graph_wrapper(
                id='line-{}-graph'.format(series_key),
                figure={
                    'data': [
                        line_func(series)(**dict_merge(
                            line_cfg(series),
                            {'x': series['x'], 'y': series[y2]},
                            name_builder(y2, series_key),
                            {} if i == 1 or not multi_yaxis else {'yaxis': 'y{}'.format(i)}
                        ))
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': build_layout(dict_merge(build_title(x, y, group=series_key, agg=inputs.get('agg')), axes))
                }
            ), group_filter=dict(group=series_key))
            for series_key, series in data['data'].items()
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            line_func(series)(**dict_merge(
                line_cfg(series),
                {'x': series['x'], 'y': series[y2]},
                name_builder(y2, series_key),
                {} if i == 1 or not multi_yaxis else {'yaxis': 'y{}'.format(i)}
            ))
            for i, y2 in enumerate(y, 1)
        ]
        for series_key, series in data['data'].items()
    ])

    figure_cfg = {'data': data_cfgs, 'layout': build_layout(dict_merge(build_title(x, y, agg=inputs.get('agg')), axes))}
    if inputs.get('animate') is True:

        def build_frame(i):
            for series_key, series in data['data'].items():
                for j, y2 in enumerate(y, 1):
                    yield line_func(series)(**dict_merge(
                        line_cfg(series),
                        {'x': series['x'][:i], 'y': series[y2][:i]},
                        name_builder(y2, series_key),
                        {} if j == 1 or not multi_yaxis else {'yaxis': 'y{}'.format(j)}
                    ))

        x_data = next(iter(data['data'].values()), {}).get('x', [])
        frames, slider_steps = [], []
        for i, x in enumerate(x_data, 1):
            frames.append(dict(data=list(build_frame(i)), name=x))
            slider_steps.append(x)

        update_cfg_w_frames(figure_cfg, frames, slider_steps)

    return wrapper(graph_wrapper(id='line-graph', figure=figure_cfg))


def pie_builder(data, x, y, wrapper, export=False, **inputs):
    """
    Builder function for :plotly:`plotly.graph_objects.Pie <plotly.graph_objects.Pie>`

    :param data: raw data to be represented within surface chart
    :type data: dict
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param wrapper: wrapper function returned by :meth:`dtale.charts.utils.chart_wrapper`
    :type wrapper: func
    :param inputs: Optional keyword arguments containing information about which aggregation (if any) has been used
    :type inputs: dict
    :return: pie chart
    :rtype: :plotly:`plotly.graph_objects.Pie <plotly.graph_objects.Pie>`
    """

    name_builder = build_series_name(y, True)

    def build_pies():
        for series_key, series in data['data'].items():
            for y2 in y:
                negative_values = []
                for x_val, y_val in zip(series['x'], series[y2]):
                    if y_val < 0:
                        negative_values.append('{} ({})'.format(x_val, y_val))

                layout = build_layout(build_title(x, y2, group=series_key, agg=inputs.get('agg')))
                if len(series['x']) > 5:
                    layout.pop('legend', None)
                    layout['showlegend'] = False
                chart = wrapper(graph_wrapper(
                    id='pie-{}-graph'.format(series_key),
                    figure={
                        'data': [go.Pie(**dict_merge(
                            dict(labels=series['x'], values=series[y2]), name_builder(y2, series_key)
                        ))],
                        'layout': layout
                    }
                ), group_filter=dict_merge(dict(y=y2), {} if series_key == 'all' else dict(group=series_key)))
                if len(negative_values):
                    error_title = (
                        'The following negative values could not be represented within the {}Pie chart'
                    ).format('' if series_key == 'all' else '{} '.format(series_key))
                    error_div = html.Div([
                        html.I(className='ico-error'),
                        html.Span(error_title),
                        html.Div(html.Pre(', '.join(negative_values)), className='traceback')
                    ], className='dtale-alert alert alert-danger')
                    if export:
                        yield chart
                    else:
                        yield html.Div(
                            [html.Div(error_div, className='col-md-12'), html.Div(chart, className='col-md-12 h-100')],
                            className='row',
                        )
                else:
                    yield chart
    if export:
        return next(build_pies())
    return cpg_chunker(list(build_pies()))


def heatmap_builder(data_id, export=False, **inputs):
    """
    Builder function for :plotly:`plotly.graph_objects.Heatmap <plotly.graph_objects.Heatmap>`

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param inputs: Optional keyword arguments containing the following information:
        - x: column to be used as x-axis of chart
        - y: column to be used as y-axis of chart
        - z: column to use for the Z-Axis
        - agg: points to a specific function that can be applied to :func: pandas.core.groupby.DataFrameGroupBy
    :type inputs: dict
    :return: heatmap
    :rtype: :plotly:`plotly.graph_objects.Heatmap <plotly.graph_objects.Heatmap>`
    """
    code = None
    try:
        if not valid_chart(**inputs):
            return None, None
        raw_data = run_query(
            global_state.get_data(data_id),
            inputs.get('query'),
            global_state.get_context_variables(data_id)
        )
        wrapper = chart_wrapper(data_id, raw_data, inputs)
        hm_kwargs = dict(colorscale=inputs.get('colorscale') or 'Greens', showscale=True, hoverinfo='x+y+z')
        x, y, z, agg = (inputs.get(p) for p in ['x', 'y', 'z', 'agg'])
        y = y[0]
        data, code = retrieve_chart_data(raw_data, x, y, z)
        x_title = update_label_for_freq(x)
        y_title = update_label_for_freq(y)
        z_title = z
        data = data.sort_values([x, y])
        code.append("chart_data = chart_data.sort_values(['{x}, '{y}'])".format(x=x, y=y))
        check_all_nan(data)
        dupe_cols = [x, y]
        if agg is not None:
            z_title = '{} ({})'.format(z_title, AGGS[agg])
            if agg == 'corr':
                data = data.dropna()
                data = data.set_index([x, y]).unstack().corr()
                data = data.stack().reset_index(0, drop=True)
                code.append((
                    "chart_data = chart_data.dropna()\n"
                    "chart_data = chart_data.set_index(['{x}', '{y}']).unstack().corr()\n"
                    "chart_data = chart_data.stack().reset_index(0, drop=True)"
                ).format(x=x, y=y))
                y_title = x_title
                dupe_cols = ['{}{}'.format(col, i) for i, col in enumerate(data.index.names)]
                [x, y] = dupe_cols
                data.index.names = dupe_cols
                data = data.reset_index()
                data.loc[data[x] == data[y], z] = np.nan
                code.append((
                    "chart_data.index.names = ['{x}', '{y}']\n"
                    "chart_data = chart_data.reset_index()\n"
                    "chart_data.loc[chart_data['{x}'] == chart_data['{y}'], '{z}'] = np.nan"
                ).format(x=x, y=y, z=z))

                hm_kwargs = dict_merge(
                    hm_kwargs, dict(colorscale=[[0, 'red'], [0.5, 'yellow'], [1.0, 'green']], zmin=-1, zmax=1)
                )
            else:
                data, agg_code = build_agg_data(data, x, y, inputs, agg, z=z)
                code += agg_code
        if not len(data):
            raise Exception('No data returned for this computation!')
        check_exceptions(data[dupe_cols], agg in ['corr', 'raw'], unlimited_data=True)
        dtypes = {c: classify_type(dtype) for c, dtype in get_dtypes(data).items()}
        data_f, _ = chart_formatters(data)
        data = data_f.format_df(data)
        data = data.sort_values([x, y])
        data = data.set_index([x, y])
        data = data.unstack(0)[z]
        code.append((
            "chart_data = data.sort_values(['{x}', '{y}'])\n"
            "chart_data = chart_data.set_index(['{x}', '{y}'])\n"
            "chart_data == unstack(0)['{z}']"
        ).format(x=x, y=y, z=z))

        x_data = weekday_tick_handler(data.columns, x)
        y_data = weekday_tick_handler(data.index.values, y)
        heat_data = data.values

        x_axis = dict_merge({'title': x_title, 'tickangle': -20}, build_spaced_ticks(x_data))
        if dtypes.get(x) == 'I':
            x_axis['tickformat'] = '.0f'

        y_axis = dict_merge({'title': y_title, 'tickangle': -20}, build_spaced_ticks(y_data))
        if dtypes.get(y) == 'I':
            y_axis['tickformat'] = '.0f'

        hm_kwargs = dict_merge(hm_kwargs, dict(x=x_data, y=y_data, z=heat_data, colorbar={'title': z_title},
                                               hoverinfo='x+y+z'))
        chart = graph_wrapper(
            id='heatmap-graph-{}'.format(y),
            style={'margin-right': 'auto', 'margin-left': 'auto'},
            figure=dict(
                data=[go.Heatmapgl(**hm_kwargs)],
                layout=build_layout(dict_merge(
                    dict(xaxis=x_axis, yaxis=y_axis, xaxis_zeroline=False, yaxis_zeroline=False),
                    build_title(x, y, z=z, agg=agg)
                ))
            )
        )
        if export:
            return chart
        return wrapper(chart), code
    except BaseException as e:
        return build_error(e, traceback.format_exc()), code


def build_map_frames(data, animate_by, frame_builder):
    formatter = find_dtype_formatter(find_dtype(data[animate_by]))
    frames, slider_steps = [], []
    for g_name, g in data.groupby(animate_by):
        g_name = formatter(g_name)
        frames.append(dict(
            data=[frame_builder(g)],
            name=g_name
        ))
        slider_steps.append(g_name)
    return frames, slider_steps


def map_builder(data_id, export=False, **inputs):
    code = None
    try:
        if not valid_chart(**inputs):
            return None, None
        props = ['map_type', 'loc_mode', 'loc', 'lat', 'lon', 'map_val', 'scope', 'proj', 'mapbox_style', 'agg',
                 'animate_by']
        map_type, loc_mode, loc, lat, lon, map_val, scope, proj, style, agg, animate_by = (inputs.get(p) for p in props)
        map_group, group_val = (inputs.get(p) for p in ['map_group', 'group_val'])
        raw_data = run_query(
            global_state.get_data(data_id),
            inputs.get('query'),
            global_state.get_context_variables(data_id)
        )
        wrapper = chart_wrapper(data_id, raw_data, inputs)
        title = 'Map of {}'.format(map_val or 'lat/lon')
        if agg:
            agg_title = AGGS[agg]
            title = '{} ({})'.format(title, agg_title)
        if group_val is not None:
            title = '{} {}'.format(title, build_group_inputs_filter(raw_data, group_val))
        layout = build_layout(dict(title=title, autosize=True, margin={'l': 0, 'r': 0, 'b': 0}))
        if map_type == 'scattergeo':
            data, code = retrieve_chart_data(raw_data, lat, lon, map_val, animate_by, map_group, group_val=group_val)
            if agg is not None:
                data, agg_code = build_agg_data(raw_data, lat, lon, {}, agg, z=map_val, animate_by=animate_by)
                code += agg_code

            geo_layout = {}
            if test_plotly_version('4.5.0') and animate_by is None:
                geo_layout['fitbounds'] = 'locations'
            if scope is not None:
                geo_layout['scope'] = scope
            if proj is not None:
                geo_layout['projection_type'] = proj
            if len(geo_layout):
                layout['geo'] = geo_layout

            chart_kwargs = dict(lon=data[lon], lat=data[lat], mode='markers', marker=dict(color='darkblue'))
            if map_val is not None:
                chart_kwargs['text'] = data[map_val]
                chart_kwargs['marker'] = dict(
                    color=data[map_val], cmin=data[map_val].min(), cmax=data[map_val].max(),
                    colorscale=inputs.get('colorscale') or 'Reds',
                    colorbar_title=map_val
                )
            figure_cfg = dict(data=[go.Scattergeo(**chart_kwargs)], layout=layout)
            if animate_by is not None:
                def build_frame(df):
                    frame = dict(lon=df[lon], lat=df[lat], mode='markers')
                    if map_val is not None:
                        frame['text'] = df[map_val]
                        frame['marker'] = dict(color=df[map_val])
                    return frame

                update_cfg_w_frames(figure_cfg, *build_map_frames(data, animate_by, build_frame))
            chart = graph_wrapper(
                id='scattergeo-graph',
                style={'margin-right': 'auto', 'margin-left': 'auto', 'height': '95%'},
                config=dict(topojsonURL='/maps/'),
                figure=figure_cfg
            )
        elif map_type == 'mapbox':
            from dtale.charts.utils import get_mapbox_token
            data, code = retrieve_chart_data(raw_data, lat, lon, map_val, animate_by, map_group, group_val=group_val)
            if agg is not None:
                data, agg_code = build_agg_data(raw_data, lat, lon, {}, agg, z=map_val, animate_by=animate_by)
                code += agg_code

            mapbox_layout = {'style': style}
            mapbox_token = get_mapbox_token()
            if mapbox_token is not None:
                mapbox_layout['accesstoken'] = mapbox_token
            # if test_plotly_version('4.5.0') and animate_by is None:
            #     geo_layout['fitbounds'] = 'locations'
            if len(mapbox_layout):
                layout['mapbox'] = mapbox_layout

            chart_kwargs = dict(lon=data[lon], lat=data[lat], mode='markers', marker=dict(color='darkblue'))
            if map_val is not None:
                chart_kwargs['text'] = data[map_val]
                chart_kwargs['marker'] = dict(
                    color=data[map_val], cmin=data[map_val].min(), cmax=data[map_val].max(),
                    colorscale=inputs.get('colorscale') or 'Jet',
                    colorbar_title=map_val
                )
            figure_cfg = dict(data=[go.Scattermapbox(**chart_kwargs)], layout=layout)
            if animate_by is not None:
                def build_frame(df):
                    frame = dict(lon=df[lon], lat=df[lat], mode='markers')
                    if map_val is not None:
                        frame['text'] = df[map_val]
                        frame['marker'] = dict(color=df[map_val])
                    return frame

                update_cfg_w_frames(figure_cfg, *build_map_frames(data, animate_by, build_frame))
            chart = graph_wrapper(
                id='scattermapbox-graph',
                style={'margin-right': 'auto', 'margin-left': 'auto', 'height': '95%'},
                config=dict(topojsonURL='/maps/'),
                figure=figure_cfg
            )
        else:
            data, code = retrieve_chart_data(raw_data, loc, map_val, map_group, animate_by, group_val=group_val)
            if agg is not None:
                data, agg_code = build_agg_data(data, loc, map_val, {}, agg, animate_by=animate_by)
                code += agg_code
            if loc_mode == 'USA-states':
                layout['geo'] = dict(scope='usa')
            figure_cfg = dict(
                data=[go.Choropleth(
                    locations=data[loc], locationmode=loc_mode, z=data[map_val],
                    colorscale=inputs.get('colorscale') or 'Reds', colorbar_title=map_val,
                    zmin=data[map_val].min(), zmax=data[map_val].max()
                )],
                layout=layout
            )
            if animate_by is not None:
                def build_frame(df):
                    return dict(locations=df[loc], locationmode=loc_mode, z=df[map_val], text=df[loc])

                update_cfg_w_frames(figure_cfg, *build_map_frames(data, animate_by, build_frame))

            chart = graph_wrapper(
                id='choropleth-graph',
                style={'margin-right': 'auto', 'margin-left': 'auto'},
                config=dict(topojsonURL='/maps/'),
                figure=figure_cfg
            )
        if export:
            return chart
        return wrapper(chart), code
    except BaseException as e:
        return build_error(e, traceback.format_exc()), code


def build_figure_data(data_id, chart_type=None, query=None, x=None, y=None, z=None, group=None, group_val=None,
                      agg=None, window=None, rolling_comp=None, animate_by=None, **kwargs):
    """
    Builds chart figure data for loading into dash:`dash_core_components.Graph <dash-core-components/graph>` components

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param chart_type: type of chart (line, bar, pie, scatter...)
    :type chart_type: str
    :param query: pandas dataframe query string
    :type query: str, optional
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param group: column(s) to use for grouping
    :type group: list of str or str, optional
    :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being applied to.
    :type agg: str, optional
    :param window: number of days to include in rolling aggregations
    :type window: int, optional
    :param rolling_comp: computation to use in rolling aggregations
    :type rolling_comp: str, optional
    :param kwargs: optional keyword arguments, here in case invalid arguments are passed to this function
    :type kwargs: dict
    :return: dictionary of series data, min/max ranges of columns used in chart
    :rtype: dict
    """
    if not valid_chart(**dict(x=x, y=y, z=z, chart_type=chart_type, agg=agg, window=window, rolling_comp=rolling_comp)):
        return None, None

    data = run_query(
        global_state.get_data(data_id),
        query,
        global_state.get_context_variables(data_id)
    )
    if data is None or not len(data):
        return None, None

    code = build_code_export(data_id, query=query)
    chart_kwargs = dict(group_col=group, group_val=group_val, agg=agg, allow_duplicates=chart_type == 'scatter',
                        rolling_win=window, rolling_comp=rolling_comp)
    if chart_type in ANIMATE_BY_CHARTS:
        chart_kwargs['animate_by'] = animate_by
    if chart_type in ZAXIS_CHARTS:
        chart_kwargs['z'] = z
    data, chart_code = build_base_chart(data, x, y, unlimited_data=True, **chart_kwargs)
    return data, code + chart_code


def build_raw_figure_data(data_id, chart_type=None, query=None, x=None, y=None, z=None, group=None, agg=None,
                          window=None, rolling_comp=None, **kwargs):
    """
    Returns a :class:`pandas:pandas.DataFrame` of data used within chart configuration

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param chart_type: type of chart (line, bar, pie, scatter...)
    :type chart_type: str
    :param query: pandas dataframe query string
    :type query: str, optional
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param group: column(s) to use for grouping
    :type group: list of str or str, optional
    :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being applied to.
    :type agg: str, optional
    :param window: number of days to include in rolling aggregations
    :type window: int, optional
    :param rolling_comp: computation to use in rolling aggregations
    :type rolling_comp: str, optional
    :param kwargs: optional keyword arguments, here in case invalid arguments are passed to this function
    :type kwargs: dict
    :return: dataframe of all data used in chart
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    chart_params = dict_merge(
        dict(x=x, y=y, z=z, chart_type=chart_type, agg=agg, window=window, rolling_comp=rolling_comp),
        kwargs
    )
    if not valid_chart(**chart_params):
        raise ValueError('invalid chart configuration: {}'.format(chart_params))

    data = run_query(
        global_state.get_data(data_id),
        query,
        global_state.get_context_variables(data_id)
    )
    if chart_type == 'maps':
        if kwargs.get('map_type') == 'choropleth':
            loc, map_val = (kwargs.get(p) for p in ['loc', 'map_val'])
            data, _ = retrieve_chart_data(data, loc, map_val)
            if agg is not None:
                data, _ = build_agg_data(data, loc, map_val, {}, agg)
            return data
        lat, lon, map_val = (kwargs.get(p) for p in ['lat', 'lon', 'map_val'])
        data, _ = retrieve_chart_data(data, lat, lon, map_val)
        if agg is not None:
            data, _ = build_agg_data(data, lat, lon, {}, agg, z=map_val)
        return data

    chart_kwargs = dict(group_col=group, agg=agg, allow_duplicates=chart_type == 'scatter', rolling_win=window,
                        rolling_comp=rolling_comp)
    if chart_type in ZAXIS_CHARTS:
        chart_kwargs['z'] = z
        del chart_kwargs['group_col']
    return build_base_chart(data, x, y, unlimited_data=True, return_raw=True, **chart_kwargs)


def build_chart(data_id=None, **inputs):
    """
    Factory method that forks off into the different chart building methods (heatmaps are handled separately)
        - line
        - bar
        - scatter
        - pie
        - wordcloud
        - 3D scatter
        - surface

    :param data_id: identifier of data to build axis configurations against
    :type data_id: str
    :param inputs: Optional keyword arguments containing the following information:
        - x: column to be used as x-axis of chart
        - y: column to be used as y-axis of chart
        - z: column to use for the Z-Axis
        - agg: points to a specific function that can be applied to :func: pandas.core.groupby.DataFrameGroupBy
    :return: plotly chart object(s)
    :rtype: type of (:dash:`dash_core_components.Graph <dash-core-components/graph>`, dict)
    """
    code = None
    try:
        chart_type = inputs.get('chart_type')
        if chart_type == 'heatmap':
            chart, code = heatmap_builder(data_id, **inputs)
            return chart, None, code

        if chart_type == 'maps':
            chart, code = map_builder(data_id, **inputs)
            return chart, None, code

        data, code = build_figure_data(data_id, **inputs)
        if data is None:
            return None, None, None

        code = '\n'.join(code or [])
        if 'error' in data:
            return build_error(data['error'], data['traceback']), None, code

        range_data = dict(min=data['min'], max=data['max'])
        axis_inputs = inputs.get('yaxis') or {}
        chart_builder = chart_wrapper(data_id, data, inputs)
        x, y, z, agg, group, animate_by = (inputs.get(p) for p in ['x', 'y', 'z', 'agg', 'group', 'animate_by'])
        z = z if chart_type in ZAXIS_CHARTS else None
        chart_inputs = {k: v for k, v in inputs.items() if k not in ['chart_type', 'x', 'y', 'z', 'group']}

        if chart_type == 'wordcloud':
            return (
                chart_builder(dash_components.Wordcloud(id='wc', data=data, y=y, group=group)),
                range_data,
                code
            )

        if chart_type == 'pie':
            return pie_builder(data, x, y, chart_builder, **chart_inputs), range_data, code

        axes_builder = build_axes(data_id, x, axis_inputs, data['min'], data['max'], z=z, agg=agg)
        if chart_type in ['scatter', '3d_scatter']:
            kwargs = dict(agg=agg)
            if chart_type == '3d_scatter':
                kwargs['z'] = z
                kwargs['animate_by'] = animate_by
            if inputs['cpg']:
                scatter_charts = flatten_lists([
                    scatter_builder(data, x, y, axes_builder, chart_builder, group=subgroup, **kwargs)
                    for subgroup in data['data']
                ])
            else:
                scatter_charts = scatter_builder(data, x, y, axes_builder, chart_builder, **kwargs)
            return cpg_chunker(scatter_charts), range_data, code

        if chart_type == 'surface':
            return surface_builder(data, x, y, z, axes_builder, chart_builder, agg=agg), range_data, code

        if chart_type == 'bar':
            return bar_builder(data, x, y, axes_builder, chart_builder, **chart_inputs), range_data, code

        if chart_type == 'line':
            return line_builder(data, x, y, axes_builder, chart_builder, **chart_inputs), range_data, code

        raise NotImplementedError('chart type: {}'.format(chart_type))
    except BaseException as e:
        return build_error(e, traceback.format_exc()), None, code


def build_raw_chart(data_id=None, **inputs):
    """
    Factory method that forks off into the different chart building methods
        - heatmap
        - line
        - bar
        - scatter
        - pie
        - 3D scatter
        - surface

    :param data_id: identifier of data to build axis configurations against
    :type data_id: str
    :param inputs: Optional keyword arguments containing the following information:
        - x: column to be used as x-axis of chart
        - y: column to be used as y-axis of chart
        - z: column to use for the Z-Axis
        - agg: points to a specific function that can be applied to :func: pandas.core.groupby.DataFrameGroupBy
    :return: plotly chart object(s)
    :rtype: type of (:dash:`dash_core_components.Graph <dash-core-components/graph>`, dict)
    """

    def clean_output(output):
        if isinstance(output, list):
            output = output[0]
        if isinstance(output, dcc.Graph):
            output = output.figure
        return output

    def chart_builder_passthru(chart, group_filter=None):
        return chart

    def _raw_chart_builder():
        if inputs.get('chart_type') == 'heatmap':
            chart = heatmap_builder(data_id, **inputs)
            return chart

        if inputs.get('chart_type') == 'maps':
            chart = map_builder(data_id, **inputs)
            return chart

        data, _ = build_figure_data(data_id, **inputs)
        if data is None:
            return None

        chart_type, x, y, z, agg = (inputs.get(p) for p in ['chart_type', 'x', 'y', 'z', 'agg'])
        z = z if chart_type in ZAXIS_CHARTS else None

        axis_inputs = inputs.get('yaxis') or {}
        chart_builder = chart_builder_passthru  # we'll ignore wrapper functionality for raw charts
        chart_inputs = {k: v for k, v in inputs.items() if k not in ['chart_type', 'x', 'y', 'z', 'group']}

        if chart_type == 'pie':
            return pie_builder(data, x, y, chart_builder, **chart_inputs)

        axes_builder = build_axes(data_id, x, axis_inputs, data['min'], data['max'], z=z, agg=agg)
        if chart_type == 'scatter':
            return scatter_builder(data, x, y, axes_builder, chart_builder, agg=agg)

        if chart_type == '3d_scatter':
            return scatter_builder(data, x, y, axes_builder, chart_builder, z=z, agg=agg)

        if chart_type == 'surface':
            return surface_builder(data, x, y, z, axes_builder, chart_builder, agg=agg)

        if chart_type == 'bar':
            return bar_builder(data, x, y, axes_builder, chart_builder, **chart_inputs)

        return line_builder(data, x, y, axes_builder, chart_builder, **chart_inputs)
    return clean_output(_raw_chart_builder())


def export_chart(data_id, params):
    chart = build_raw_chart(data_id, export=True, **params)
    post_script_css = '\n'.join([
        "var css = document.createElement('style');",
        "css.type = 'text/css';",
        (
            "css.appendChild(document.createTextNode('div.modebar > div.modebar-group:last-child,"
            "div.modebar > div.modebar-group:first-child { display: none; }'));"
        ),
        'document.getElementsByTagName("head")[0].appendChild(css);',
    ])
    html_buffer = StringIO()
    config = dict(topojsonURL='')
    write_html(chart, file=html_buffer, include_plotlyjs=True, auto_open=False, post_script=post_script_css,
               config=config)
    html_buffer.seek(0)
    html_str = html_buffer.getvalue()
    if params.get('chart_type') == 'maps':
        return map_chart_post_processing(html_str, params)
    return html_str


def map_chart_post_processing(html_str, params):
    plotly_version = next((v for v in re.findall(r" plotly.js v(\d+.\d+.\d+)", html_str)), None)
    topo_find = INJECTIONS.get(plotly_version) or INJECTIONS[sorted(INJECTIONS.keys())[-1]]
    if topo_find in html_str:
        map_path = os.path.join(os.path.dirname(__file__), '../static/maps/')
        if params.get('map_type') == 'scattergeo':
            topo_name = '{}_110m'.format('-'.join(params.get('scope').split(' ')))
        elif params.get('loc_mode') in ['ISO-3', 'country names']:
            topo_name = 'world_110m'
        else:
            topo_name = 'usa_110m'
        topo_replace = ['.fetchTopojson=function(){']
        with open(os.path.join(map_path, '{}.json'.format(topo_name)), 'r') as file:
            data = file.read().replace('\n', '')
            topo_replace.append("PlotlyGeoAssets.topojson['{}'] = {};".format(topo_name, data))
        topo_replace.append('}')
        topo_replace = ''.join(topo_replace)
        return html_str.replace(topo_find, topo_replace)
    return html_str


def export_chart_data(data_id, params):
    data = build_raw_figure_data(data_id, **params)
    return export_to_csv_buffer(data)
