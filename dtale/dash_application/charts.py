import json
import math
import urllib

import dash_core_components as dcc
import dash_html_components as html
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from six import PY3

import dtale.dash_application.components as dash_components
from dtale.utils import (classify_type, dict_merge, divide_chunks,
                         flatten_lists, get_dtypes)
from dtale.views import DATA

YAXIS_CHARTS = ['line', 'bar', 'scatter']


def build_axes(data_id, x, axis_inputs, mins, maxs):
    data = DATA[data_id]
    dtypes = get_dtypes(data)

    def _build_axes(y):
        axes = {}
        positions = []
        for i, y2 in enumerate(y, 0):
            right = i % 2 == 1
            axis_ct = int(i / 2)
            if i == 0:
                key = 'yaxis'
                value = dict(title=y2)
            else:
                key = 'yaxis{}'.format(i + 1)
                value = dict(title=y2, overlaying='y', side='right' if right else 'left')
                value['anchor'] = 'free' if axis_ct > 0 else 'x'
                if axis_ct > 0:
                    pos = axis_ct / 20.0
                    value['position'] = (1 - pos) if right else pos
                    positions.append(value['position'])
            if y2 in axis_inputs and not (axis_inputs[y2]['min'], axis_inputs[y2]['max']) == (mins[y2], maxs[y2]):
                value['range'] = [axis_inputs[y2]['min'], axis_inputs[y2]['max']]
            if classify_type(dtypes[y2]) == 'I':
                value['tickformat'] = '.0f'
            axes[key] = value
        if len(positions):
            domain = [0, 1]
            if len(positions) == 1:
                domain = [positions[0] + 0.05, 1]
            elif len(positions) == 2:
                domain = sorted(positions)
                domain = [domain[0] + 0.05, domain[1] - 0.05]
            else:
                lower, upper = divide_chunks(sorted(positions), 2)
                domain = [lower[-1] + 0.05, upper[0] - 0.05]
            axes['xaxis'] = dict(domain=domain)
        if classify_type(dtypes[x]) == 'I':
            axes['xaxis'] = dict_merge(axes.get('xaxis', {}), dict(tickformat='.0f'))
        return axes
    return _build_axes


def build_spaced_ticks(tickvals, ticktext):
    size = len(tickvals)
    if len(tickvals) <= 30:
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
    if url_params is None:
        return lambda chart: chart

    url_params_func = urllib.parse.urlencode if PY3 else urllib.urlencode
    base_props = ['chart_type', 'x', 'z', 'agg', 'window', 'rolling_comp', 'barmode', 'barsort']
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
        href='/charts/popup/{}?{}'.format(data_id, url_params_func(params)),
        target='_blank',
        style={'position': 'absolute', 'zIndex': 5}
    )

    def _chart_wrapper(chart):
        return html.Div([popup_link, chart], style={'position': 'relative'})
    return _chart_wrapper


def build_title(x, y, group=None):
    if group:
        return {'title': '{} - {} by {}'.format(group, y, x)}
    return {'title': '{} by {}'.format(y, x)}


def cpg_chunker(charts, columns=2):
    return [
        html.Div([html.Div(c, className='col-md-6') for c in chunk], className='row')
        for chunk in divide_chunks(charts, columns)
    ]


def scatter_builder(data, x, y, axes_builder, wrapper, group=None):
    return [
        wrapper(dcc.Graph(
            id='scatter-{}-{}'.format(group or 'all', y2),
            figure={'data': [
                dict(x=d['x'], y=d[y2], mode='markers', opacity=0.7, name=series_key,
                     marker={'size': 15, 'line': {'width': 0.5, 'color': 'white'}})
                for series_key, d in data['data'].items() if y2 in d and (group is None or group == series_key)
            ], 'layout': dict_merge(build_title(x, y2, group), axes_builder([y2]))}
        ))
        for y2 in y
    ]


def build_grouped_bars_with_multi_yaxis(data_cfgs, y):
    for i, y2 in enumerate(y, 1):
        for dc in data_cfgs:
            curr_y = dc.get('yaxis')
            yaxis = 'y{}'.format(i)
            if (i == 1 and curr_y is None) or (yaxis == curr_y):
                yield dc
            else:
                yield dict_merge(
                    {k: v for k, v in dc.items() if k in ['x', 'name', 'type']},
                    dict(hoverinfo='none', showlegend=False, y=[0]),
                    dict(yaxis=yaxis) if i > 1 else {}
                )


def bar_builder(data, x, y, axes_builder, wrapper, cpg=False, barmode='group', barsort=None, **kwargs):
    hover_text = dict()
    multiaxis = barmode is None or barmode == 'group'
    axes = axes_builder(y) if multiaxis else axes_builder([y[0]])
    if barsort is not None:
        for k in data['data']:
            barsort_col = 'x' if barsort == x or barsort not in data['data'][k] else barsort
            if barsort_col != 'x':
                df = pd.DataFrame(data['data'][k])
                df = df.sort_values(barsort_col)
                data['data'][k] = {c: df[c].values for c in df.columns}
                data['data'][k]['x'] = list(range(len(df['x'])))
                hover_text[k] = df['x'].values
                axes['xaxis'] = dict_merge(
                    axes.get('xaxis', {}), build_spaced_ticks(data['data'][k]['x'], df['x'].values)
                )

    if cpg:
        charts = [
            wrapper(dcc.Graph(
                id='bar-{}-graph'.format(k),
                figure={
                    'data': [
                        dict_merge(
                            {'x': d['x'], 'y': d[y2], 'type': 'bar', 'name': '{}-{}'.format(k, y2)},
                            {} if i == 1 or not multiaxis else {'yaxis': 'y{}'.format(i)},
                            {'hovertext': hover_text[k], 'hoverinfo': 'y+text'} if k in hover_text else {}
                        )
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': go.Layout(
                        dict_merge(build_title(x, ', '.join(y), k), axes, dict(barmode=barmode or 'group'))
                    )
                }
            ))
            for k, d in data['data'].items()
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            dict_merge(
                {'x': d['x'], 'y': d[y2], 'name': '{}-{}'.format(k, y2), 'type': 'bar'},
                {} if i == 1 or not multiaxis else {'yaxis': 'y{}'.format(i)},
                {'hovertext': hover_text[k], 'hoverinfo': 'y+text'} if k in hover_text else {}
            )
            for i, y2 in enumerate(y, 1)
        ]
        for k, d in data['data'].items()
    ])
    if barmode == 'group' and len(y or []) > 1:
        data_cfgs = list(build_grouped_bars_with_multi_yaxis(data_cfgs, y))

    return wrapper(dcc.Graph(
        id='bar-graph',
        figure={'data': data_cfgs, 'layout': go.Layout(
            dict_merge(build_title(x, ', '.join(y)), axes, dict(barmode=barmode or 'group')))}
    ))


def line_builder(data, x, y, axes_builder, wrapper, cpg=False, **kwargs):
    hover_text = dict()
    axes = axes_builder(y)
    if cpg:
        charts = [
            wrapper(dcc.Graph(
                id='line-{}-graph'.format(k),
                figure={
                    'data': [
                        dict_merge(
                            {'x': data['data'][k]['x'], 'y': data['data'][k][y2], 'type': 'line',
                             'name': '{}-{}'.format(k, y2)},
                            {} if i == 1 else {'yaxis': 'y{}'.format(i)},
                            {'hovertext': hover_text[k], 'hoverinfo': 'y+text'} if k in hover_text else {}
                        )
                        for i, y2 in enumerate(y, 1)
                    ],
                    'layout': go.Layout(dict_merge(build_title(x, ', '.join(y), group=k), axes))
                }
            ))
            for k in data['data']
        ]
        return cpg_chunker(charts)

    data_cfgs = flatten_lists([
        [
            dict_merge(
                {'x': d['x'], 'y': d[y2], 'name': '{}-{}'.format(k, y2), 'type': 'line'},
                {} if i == 1 else {'yaxis': 'y{}'.format(i)},
                {'hovertext': hover_text[k], 'hoverinfo': 'y+text'} if k in hover_text else {}
            )
            for i, y2 in enumerate(y, 1)
        ]
        for k, d in data['data'].items()
    ])
    return wrapper(dcc.Graph(
        id='line-graph',
        figure={'data': data_cfgs, 'layout': go.Layout(dict_merge(build_title(x, ', '.join(y)), axes))}
    ))


def heatmap_builder(data_id, data, x, y, z, wrapper):
    dtypes = get_dtypes(DATA[data_id])
    charts = []
    for y2 in y:
        x_data = data['data']['all']['x']
        y_data = data['data']['all'][y2]
        z_data = data['data']['all'][z]
        x_ticks = sorted(set(x_data))
        x_tick_idx = {v: idx for idx, v in enumerate(x_ticks)}
        y_ticks = sorted(set(y_data))
        y_tick_idx = {v: idx for idx, v in enumerate(y_ticks)}
        heat_data = [[np.nan for _ in x_ticks] for _ in y_ticks]
        for x_val, y_val, z_val in zip(x_data, y_data, z_data):
            heat_data[y_tick_idx[y_val]][x_tick_idx[x_val]] = z_val

        x_axis = {'title': x}
        if classify_type(dtypes[x]) == 'I':
            x_axis['tickformat'] = '.0f'
        y_axis = {'title': y2, 'tickmode': 'array', 'tickvals': y_ticks, 'tickfont': {'size': 8}, 'tickangle': -20}
        if classify_type(dtypes[y2]) == 'I':
            y_axis['tickformat'] = '.0f'
        charts.append(wrapper(dcc.Graph(
            id='heatmap-graph-{}'.format(y2),
            style={'margin-right': 'auto', 'margin-left': 'auto', 'height': 600},
            figure=dict(
                data=[go.Heatmap(x=x_ticks, y=y_ticks, z=heat_data, hoverongaps=False,
                                 colorscale='Electric', colorbar={'title': 'Percentage'}, showscale=True)],
                layout=go.Layout(title='{} vs {} weighted by {}'.format(x, y2, z), xaxis=x_axis, yaxis=y_axis)
            )
        )))

    return charts


def build_chart(data, data_id, **inputs):
    axis_inputs = inputs.get('yaxis', {})
    chart_builder = chart_wrapper(data_id, data, inputs)
    chart_type, x, y, z = (inputs.get(p) for p in ['chart_type', 'x', 'y', 'z'])
    chart_inputs = {k: v for k, v in inputs.items() if k not in ['chart_type', 'x', 'y', 'z', 'group']}
    if chart_type == 'heatmap':
        return heatmap_builder(data_id, data, x, y, z, chart_builder)

    if chart_type == 'wordcloud':
        return chart_builder(dash_components.Wordcloud(id='wc', data=data, y=y, group=inputs.get('group')))

    axes_builder = build_axes(data_id, x, axis_inputs, data['min'], data['max'])
    if chart_type == 'scatter':
        if inputs['cpg']:
            return cpg_chunker(flatten_lists([
                scatter_builder(data, x, y, axes_builder, chart_builder, group=group) for group in data['data']
            ]))
        return scatter_builder(data, x, y, axes_builder, chart_builder)

    if chart_type == 'bar':
        return bar_builder(data, x, y, axes_builder, chart_builder, **chart_inputs)

    if chart_type == 'line':
        return line_builder(data, x, y, axes_builder, chart_builder, **chart_inputs)
    raise NotImplementedError(chart_type)
