import json
import math
import traceback
import urllib

import dash_core_components as dcc
import dash_html_components as html
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from six import PY3

import dtale.dash_application.components as dash_components
import dtale.global_state as global_state
from dtale.charts.utils import YAXIS_CHARTS, ZAXIS_CHARTS, build_agg_data
from dtale.charts.utils import build_formatters as chart_formatters
from dtale.charts.utils import (check_all_nan, check_exceptions,
                                retrieve_chart_data, valid_chart,
                                weekday_tick_handler)
from dtale.dash_application.layout import (AGGS, build_error,
                                           update_label_for_freq)
from dtale.utils import (build_code_export, classify_type, dict_merge,
                         divide_chunks, flatten_lists, get_dtypes, make_list,
                         run_query)
from dtale.views import build_chart as build_chart_data


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

    def _build_axes(y):
        axes = {'xaxis': dict(title=update_label_for_freq(x))}
        positions = []
        for i, y2 in enumerate(y, 0):
            right = i % 2 == 1
            axis_ct = int(i / 2)
            title = update_label_for_freq(y2)
            if z is None and agg is not None:
                title = '{} ({})'.format(title, AGGS[agg])
            value = dict(title=title)
            if i == 0:
                key = 'yaxis'
            else:
                key = 'yaxis{}'.format(i + 1)
                value = dict_merge(value, dict(overlaying='y', side='right' if right else 'left'))
                value['anchor'] = 'free' if axis_ct > 0 else 'x'
                if axis_ct > 0:
                    pos = axis_ct / 20.0
                    value['position'] = (1 - pos) if right else pos
                    positions.append(value['position'])
            if y2 in axis_inputs and not (axis_inputs[y2]['min'], axis_inputs[y2]['max']) == (mins[y2], maxs[y2]):
                value['range'] = [axis_inputs[y2]['min'], axis_inputs[y2]['max']]
            if classify_type(dtypes.get(y2)) == 'I':
                value['tickformat'] = '.0f'
            axes[key] = value
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
        return axes
    return _build_axes


def build_spaced_ticks(ticktext):
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
    tickvals = list(range(size))
    if size <= 30:
        return {'tickmode': 'array', 'tickvals': tickvals, 'ticktext': ticktext}
    spaced_ticks, spaced_text = [tickvals[0]], [ticktext[0]]
    factor = int(math.ceil(size / 28.0))
    for i in range(factor, size - 1, factor):
        spaced_ticks.append(tickvals[i])
        spaced_text.append(ticktext[i])
    spaced_ticks.append(tickvals[-1])
    spaced_text.append(ticktext[-1])
    return {'tickmode': 'array', 'tickvals': spaced_ticks, 'ticktext': spaced_text}


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

    url_params_func = urllib.parse.urlencode if PY3 else urllib.urlencode
    base_props = ['chart_type', 'query', 'x', 'z', 'agg', 'window', 'rolling_comp', 'barmode', 'barsort']
    params = {k: url_params[k] for k in base_props if url_params.get(k) is not None}
    params['cpg'] = 'true' if url_params.get('cpg') is True else 'false'
    for gp in ['y', 'group']:
        group_param = [val for val in url_params.get(gp) or [] if val is not None]
        if len(group_param):
            params[gp] = json.dumps(group_param)
    if params['chart_type'] in YAXIS_CHARTS:
        params_yaxis = {}
        for y, range in (url_params.get('yaxis') or {}).items():
            if y not in data['min']:
                continue
            if not (range['min'], range['max']) == (data['min'][y], data['max'][y]):
                params_yaxis[y] = range
        if len(params_yaxis):
            params['yaxis'] = json.dumps(params_yaxis)

    popup_link = html.A(
        [html.I(className='far fa-window-restore mr-4'), html.Span('Popup Chart')],
        href='/charts/{}?{}'.format(data_id, url_params_func(params)),
        target='_blank',
        className='mr-5'
    )
    copy_link = html.Div(
        [html.A(
            [html.I(className='ico-link mr-4'), html.Span('Copy Link')],
            href='/charts/{}?{}'.format(data_id, url_params_func(params)),
            target='_blank',
            className='mr-5 copy-link-btn'
        ), html.Div('Copied to clipboard', className="hoverable__content copy-tt-bottom")
        ],
        className='hoverable-click'
    )
    code_snippet = html.A(
        [html.I(className='ico-code mr-4'), html.Span('Code Snippet')],
        href='#',
        className='code-snippet-btn',
    )
    links = html.Div([popup_link, copy_link, code_snippet], style={'position': 'absolute', 'zIndex': 5})

    def _chart_wrapper(chart):
        return html.Div([links, chart], style={'position': 'relative'})
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
    return go.Layout(**dict_merge(dict(legend=dict(orientation='h', y=1.2)), cfg))


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
    return [
        html.Div([html.Div(c, className='col-md-6') for c in chunk], className='row')
        for chunk in divide_chunks(charts, columns)
    ]


def scatter_builder(data, x, y, axes_builder, wrapper, group=None, z=None, agg=None):
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
            return {'height': 700, 'margin': {'l': 0, 'r': 0, 'b': 0},
                    'scene': dict_merge(axes, dict(aspectmode='data'))}
        return axes

    def marker(series):
        if z is not None:
            return {'size': 8, 'color': series[z], 'colorscale': 'Blackbody', 'opacity': 0.8,
                    'showscale': True, 'colorbar': {'thickness': 15, 'len': 0.5, 'x': 0.8, 'y': 0.6}}
        return {'size': 15, 'line': {'width': 0.5, 'color': 'white'}}

    scatter_func = go.Scatter3d if z is not None else go.Scatter
    return [
        wrapper(dcc.Graph(
            id='scatter-{}-{}'.format(group or 'all', y2),
            figure={'data': [
                scatter_func(**dict_merge(
                    dict(x=d['x'], y=d[y2], mode='markers', opacity=0.7, name=series_key, marker=marker(d)),
                    dict(z=d[z]) if z is not None else dict())
                )
                for series_key, d in data['data'].items() if y2 in d and (group is None or group == series_key)
            ], 'layout': build_layout(dict_merge(build_title(x, y2, group, z=z, agg=agg), layout(axes_builder([y2]))))}
        ))
        for y2 in y
    ]


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

    axes = axes_builder([y[0]])
    layout = {'height': 700, 'autosize': True, 'margin': {'l': 0, 'r': 0, 'b': 0}, 'scene': dict_merge(axes, scene)}
    return [
        wrapper(dcc.Graph(
            id='surface-{}'.format(y2),
            figure={'data': [
                go.Surface(x=x_vals, y=y_vals, z=z_data, opacity=0.8, name='all', colorscale='YlGnBu',
                           colorbar={'title': layout['scene']['zaxis']['title'], 'thickness': 15, 'len': 0.5,
                                     'x': 0.8, 'y': 0.6})
            ], 'layout': build_layout(dict_merge(build_title(x, y2, z=z, agg=agg), layout))}
        ))
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
    multiaxis = barmode is None or barmode == 'group'
    axes = axes_builder(y) if multiaxis else axes_builder([y[0]])
    name_builder = build_series_name(y, cpg)
    if barsort is not None:
        for series_key, series in data['data'].items():
            barsort_col = 'x' if barsort == x or barsort not in series else barsort
            if barsort_col != 'x':
                df = pd.DataFrame(series)
                df = df.sort_values(barsort_col)
                data['data'][series_key] = {c: df[c].values for c in df.columns}
                data['data'][series_key]['x'] = list(range(len(df['x'])))
                hover_text[series_key] = {'hovertext': df['x'].values, 'hoverinfo': 'y+text'}
                axes['xaxis'] = dict_merge(
                    axes.get('xaxis', {}), build_spaced_ticks(df['x'].values)
                )

    if cpg:
        charts = [
            wrapper(dcc.Graph(
                id='bar-{}-graph'.format(series_key),
                figure={
                    'data': [
                        dict_merge(
                            {'x': series['x'], 'y': series[y2], 'type': 'bar'},
                            name_builder(y2, series_key),
                            {} if i == 1 or not multiaxis else {'yaxis': 'y{}'.format(i)},
                            hover_text.get(series_key) or {}
                        )
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': build_layout(dict_merge(
                        build_title(x, y, series_key, agg=kwargs.get('agg')), axes, dict(barmode=barmode or 'group')
                    ))
                }
            ))
            for series_key, series in data['data'].items()
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            dict_merge(
                {'x': series['x'], 'y': series[y2], 'type': 'bar'},
                name_builder(y2, series_key),
                {} if i == 1 or not multiaxis else {'yaxis': 'y{}'.format(i)},
                hover_text.get(series_key) or {}
            )
            for i, y2 in enumerate(y, 1)
        ]
        for series_key, series in data['data'].items()
    ])
    if barmode == 'group' and len(y or []) > 1:
        data_cfgs = list(build_grouped_bars_with_multi_yaxis(data_cfgs, y))

    return wrapper(dcc.Graph(
        id='bar-graph',
        figure={'data': data_cfgs, 'layout': build_layout(
            dict_merge(build_title(x, y, agg=kwargs.get('agg')), axes, dict(barmode=barmode or 'group')))}
    ))


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

    axes = axes_builder(y)
    name_builder = build_series_name(y, cpg)
    line_cfg = {'mode': 'lines', 'line': {'shape': 'spline', 'smoothing': 0.3}}
    if cpg:
        charts = [
            wrapper(dcc.Graph(
                id='line-{}-graph'.format(series_key),
                figure={
                    'data': [
                        go.Scatter(**dict_merge(
                            line_cfg,
                            {'x': series['x'], 'y': series[y2]},
                            name_builder(y2, series_key),
                            {} if i == 1 else {'yaxis': 'y{}'.format(i)}
                        ))
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': build_layout(dict_merge(build_title(x, y, group=series_key, agg=inputs.get('agg')), axes))
                }
            ))
            for series_key, series in data['data'].items()
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            go.Scatter(**dict_merge(
                line_cfg,
                {'x': series['x'], 'y': series[y2]},
                name_builder(y2, series_key),
                {} if i == 1 else {'yaxis': 'y{}'.format(i)}
            ))
            for i, y2 in enumerate(y, 1)
        ]
        for series_key, series in data['data'].items()
    ])
    return wrapper(dcc.Graph(
        id='line-graph',
        figure={'data': data_cfgs, 'layout': build_layout(dict_merge(build_title(x, y, agg=inputs.get('agg')), axes))}
    ))


def pie_builder(data, x, y, wrapper, **inputs):
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

                chart = wrapper(dcc.Graph(
                    id='pie-{}-graph'.format(series_key),
                    figure={
                        'data': [go.Pie(**dict_merge(
                            dict(labels=series['x'], values=series[y2]), name_builder(y2, series_key)
                        ))],
                        'layout': build_layout(build_title(x, y2, group=series_key, agg=inputs.get('agg')))
                    }
                ))
                if len(negative_values):
                    error_title = (
                        'The following negative values could not be represented within the {}Pie chart'
                    ).format('' if series_key == 'all' else '{} '.format(series_key))
                    error_div = html.Div([
                        html.I(className='ico-error'),
                        html.Span(error_title),
                        html.Div(html.Pre(', '.join(negative_values)), className='traceback')
                    ], className='dtale-alert alert alert-danger')
                    yield html.Div(
                        [html.Div(error_div, className='col-md-12'), html.Div(chart, className='col-md-12')],
                        className='row'
                    )
                else:
                    yield chart
    return cpg_chunker(list(build_pies()))


def heatmap_builder(data_id, **inputs):
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
        raw_data = global_state.get_data(data_id)
        wrapper = chart_wrapper(data_id, raw_data, inputs)
        hm_kwargs = dict(hoverongaps=False, colorscale='Greens', showscale=True, hoverinfo='x+y+z')
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
        check_exceptions(data[dupe_cols], agg != 'corr', data_limit=40000,
                         limit_msg='Heatmap exceeds {} cells, cannot render. Please apply filter...')
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

        hovertemplate = ''.join([x_title, ': %{customdata[0]}<br>', y_title, ': %{customdata[1]}<br>', z_title,
                                 ': %{z}<extra></extra>'])
        hm_kwargs = dict_merge(hm_kwargs, dict(z=heat_data, colorbar={'title': z_title},
                                               hoverinfo='x+y+z', hovertemplate=hovertemplate,
                                               customdata=[[[xd, yd] for xd in x_data] for yd in y_data]))
        return wrapper(dcc.Graph(
            id='heatmap-graph-{}'.format(y),
            style={'margin-right': 'auto', 'margin-left': 'auto', 'height': 600},
            figure=dict(
                data=[go.Heatmap(**hm_kwargs)],
                layout=build_layout(dict_merge(
                    dict(xaxis=x_axis, yaxis=y_axis, xaxis_zeroline=False, yaxis_zeroline=False),
                    build_title(x, y, z=z, agg=agg)
                ))
            )
        )), code
    except BaseException as e:
        return build_error(str(e), str(traceback.format_exc())), code


def build_figure_data(data_id, chart_type=None, query=None, x=None, y=None, z=None, group=None, agg=None, window=None,
                      rolling_comp=None, **kwargs):
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
    :param kwargs: optional keyword arguments, here in case invalid arguements are passed to this function
    :type kwargs: dict
    :return: dictionary of series data, min/max ranges of columns used in chart
    :rtype: dict
    """
    code = None
    try:
        if not valid_chart(**dict(x=x, y=y, z=z, chart_type=chart_type, agg=agg, window=window,
                                  rolling_comp=rolling_comp)):
            return None, None

        data = run_query(
            global_state.get_data(data_id),
            query,
            global_state.get_context_variables(data_id)
        )
        code = build_code_export(data_id, query=query)
        chart_kwargs = dict(group_col=group, agg=agg, allow_duplicates=chart_type == 'scatter', rolling_win=window,
                            rolling_comp=rolling_comp)
        if chart_type in ZAXIS_CHARTS:
            chart_kwargs['z'] = z
            del chart_kwargs['group_col']
        data, chart_code = build_chart_data(data, x, y, **chart_kwargs)
        return data, code + chart_code
    except BaseException as e:
        return dict(error=str(e), traceback=str(traceback.format_exc())), code


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
        if inputs.get('chart_type') == 'heatmap':
            data, code = heatmap_builder(data_id, **inputs)
            return data, None, code

        data, code = build_figure_data(data_id, **inputs)
        if data is None:
            return None, None, None

        code = '\n'.join(code or [])
        if 'error' in data:
            return build_error(data['error'], data['traceback']), None, code

        range_data = dict(min=data['min'], max=data['max'])
        axis_inputs = inputs.get('yaxis', {})
        chart_builder = chart_wrapper(data_id, data, inputs)
        chart_type, x, y, z, agg = (inputs.get(p) for p in ['chart_type', 'x', 'y', 'z', 'agg'])
        z = z if chart_type in ZAXIS_CHARTS else None
        chart_inputs = {k: v for k, v in inputs.items() if k not in ['chart_type', 'x', 'y', 'z', 'group']}

        if chart_type == 'wordcloud':
            return (
                chart_builder(dash_components.Wordcloud(id='wc', data=data, y=y, group=inputs.get('group'))),
                range_data,
                code
            )

        axes_builder = build_axes(data_id, x, axis_inputs, data['min'], data['max'], z=z, agg=agg)
        if chart_type == 'scatter':
            if inputs['cpg']:
                scatter_charts = flatten_lists([
                    scatter_builder(data, x, y, axes_builder, chart_builder, group=group, agg=agg)
                    for group in data['data']
                ])
            else:
                scatter_charts = scatter_builder(data, x, y, axes_builder, chart_builder, agg=agg)
            return cpg_chunker(scatter_charts), range_data, code

        if chart_type == '3d_scatter':
            return scatter_builder(data, x, y, axes_builder, chart_builder, z=z, agg=agg), range_data, code

        if chart_type == 'surface':
            return surface_builder(data, x, y, z, axes_builder, chart_builder, agg=agg), range_data, code

        if chart_type == 'bar':
            return bar_builder(data, x, y, axes_builder, chart_builder, **chart_inputs), range_data, code

        if chart_type == 'line':
            return line_builder(data, x, y, axes_builder, chart_builder, **chart_inputs), range_data, code

        if chart_type == 'pie':
            return pie_builder(data, x, y, chart_builder, **chart_inputs), range_data, code
        raise NotImplementedError('chart type: {}'.format(chart_type))
    except BaseException as e:
        return build_error(str(e), str(traceback.format_exc())), None, code
