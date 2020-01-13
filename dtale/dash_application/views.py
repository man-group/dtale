import json
import traceback
import urllib
from logging import getLogger

import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate
from six import PY3

from dtale.dash_application.charts import YAXIS_CHARTS, build_chart
from dtale.dash_application.layout import (base_layout, build_option,
                                           charts_layout)
from dtale.utils import dict_merge, flatten_lists, json_timestamp, make_list
from dtale.views import DATA, _test_filter
from dtale.views import build_chart as build_chart_data

logger = getLogger(__name__)


class DtaleDash(dash.Dash):

    def __init__(self, *args, **kwargs):
        server = kwargs.get('server')
        kwargs['external_stylesheets'] = ['/css/main.css', '/css/dash.css']
        if server.config['GITHUB_FORK']:
            kwargs['external_stylesheets'].append('/css/github_fork.css')
        kwargs['external_scripts'] = ['/dash/components_bundle.js', '/dist/base_styles_bundle.js']

        super(DtaleDash, self).__init__(*args, **kwargs)

    def interpolate_index(self, **kwargs):
        return base_layout(self.server.config['GITHUB_FORK'], **kwargs)


def add_dash(server):
    """Create Dash app."""

    dash_app = DtaleDash(server=server, routes_pathname_prefix='/charts/', eager_loading=True)

    # Since we're adding callbacks to elements that don't exist in the app.layout,
    # Dash will raise an exception to warn us that we might be
    # doing something wrong.
    # In this case, we're adding the elements through a callback, so we can ignore
    # the exception.
    dash_app.config.suppress_callback_exceptions = True
    dash_app.layout = html.Div([dcc.Location(id='url', refresh=False), html.Div(id='popup-content')])
    dash_app.scripts.config.serve_locally = True

    init_callbacks(dash_app)

    return dash_app.server


def get_url_parser():
    if PY3:
        return urllib.parse.parse_qsl
    else:
        try:
            return urllib.parse_qsl
        except BaseException:
            from urlparse import parse_qsl
            return parse_qsl


def chart_url_params(search):
    params = dict(get_url_parser()(search.lstrip('?')))
    for gp in ['y', 'group', 'yaxis']:
        if gp in params:
            params[gp] = json.loads(params[gp])
    params['cpg'] = 'true' == params['cpg']
    if 'window' in params:
        params['window'] = int(params['window'])
    return params


def get_data_id(pathname):
    return pathname.split('/')[-1]


def build_error(error, tb):
    logger.error(error)
    logger.error(tb)
    return html.Div([
        html.I(className='ico-error'), html.Span(str(error)), html.Div(html.Pre(tb), className='traceback')
    ], className='dtale-alert alert alert-danger')


def build_figure_data(pathname, chart_type=None, query=None, x=None, y=None, z=None, group=None, agg=None, window=None,
                      rolling_comp=None, **kwargs):
    try:
        if x is None or not len(y or []):
            return None

        if chart_type == 'heatmap' and z is None:
            return None

        data_id = get_data_id(pathname)
        data = DATA[data_id] if (query or '') == '' else DATA[data_id].query(query)
        chart_kwargs = dict(group_col=group, agg=agg, allow_duplicates=chart_type == 'scatter', rolling_win=window,
                            rolling_comp=rolling_comp)
        if chart_type == 'heatmap':
            chart_kwargs['z'] = z
            del chart_kwargs['group_col']
        data = build_chart_data(data, x, y, **chart_kwargs)
        data['load_time'] = json_timestamp(pd.Timestamp('now'))
        return data
    except BaseException as e:
        return dict(error=str(e), traceback=str(traceback.format_exc()))


def init_callbacks(dash_app):

    @dash_app.callback(
        [Output('query-data', 'data'), Output('query-input', 'style'), Output('query-input', 'title')],
        [Input('query-input', 'value')],
        [State('url', 'pathname'), State('query-data', 'data')]
    )
    def query_input(query, pathname, curr_query):
        try:
            if query is not None and query != '':
                _test_filter(DATA[get_data_id(pathname)], query)
            return query, {'line-height': 'inherit'}, ''
        except BaseException as ex:
            return curr_query, {'line-height': 'inherit', 'background-color': 'pink'}, str(ex)

    @dash_app.callback(
        [
            Output('input-data', 'data'),
            Output('x-dropdown', 'options'),
            Output('y-dropdown', 'options'),
            Output('y-heatmap-dropdown', 'options'),
            Output('z-dropdown', 'options'),
            Output('group-dropdown', 'options'),
        ],
        [
            Input('query-data', 'modified_timestamp'),
            Input('chart-tabs', 'value'),
            Input('x-dropdown', 'value'),
            Input('y-dropdown', 'value'),
            Input('y-heatmap-dropdown', 'value'),
            Input('z-dropdown', 'value'),
            Input('group-dropdown', 'value'),
            Input('agg-dropdown', 'value'),
            Input('window-input', 'value'),
            Input('rolling-comp-dropdown', 'value'),
        ],
        [State('url', 'pathname'), State('query-data', 'data')]
    )
    def input_data(_ts, chart_type, x, y, y_heatmap, z, group, agg, window, rolling_comp, pathname, query):
        selected_y = make_list(y_heatmap if chart_type == 'heatmap' else y)
        inputs = dict(query=query, chart_type=chart_type, x=x, y=selected_y, z=z, group=group, agg=agg, window=window,
                      rolling_comp=rolling_comp)
        cols = DATA[get_data_id(pathname)].columns

        def build_selections(*args):
            return flatten_lists([[] if a is None else make_list(a) for a in args])

        x_filter = build_selections(y_heatmap, z) if chart_type == 'heatmap' else build_selections(y, group)
        x_options = [build_option(c) for c in cols if c not in x_filter]
        y_options = [build_option(c) for c in cols if c not in build_selections(x, group)]
        y_heatmap_options = [build_option(c) for c in cols if c not in build_selections(x, group)]
        z_options = [build_option(c) for c in cols if c not in build_selections(x, y_heatmap)]
        group_options = [build_option(c) for c in cols if c not in build_selections(x, y)]
        return inputs, x_options, y_options, y_heatmap_options, z_options, group_options

    @dash_app.callback(
        [
            Output('y-input', 'style'),
            Output('y-heatmap-input', 'style'),
            Output('z-input', 'style'),
            Output('group-input', 'style'),
            Output('rolling-inputs', 'style'),
            Output('cpg-input', 'style'),
            Output('barmode-input', 'style'),
            Output('barsort-input', 'style'),
            Output('barsort-dropdown', 'options'),
            Output('yaxis-input', 'style'),
            Output('yaxis-dropdown', 'options')
        ],
        [Input('input-data', 'modified_timestamp')],
        [State('input-data', 'data')]
    )
    def input_toggles(_ts, inputs):
        [chart_type, x, y, group, agg] = [inputs.get(p) for p in ['chart_type', 'x', 'y', 'group', 'agg']]
        y_style = {'display': 'none' if chart_type == 'heatmap' else 'block'}
        y_heatmap_style = {'display': 'block' if chart_type == 'heatmap' else 'none'}
        z_style = {'display': 'block' if chart_type == 'heatmap' else 'none'}
        group_style = {'display': 'none' if chart_type == 'heatmap' else 'block'}
        rolling_style = {'display': 'inherit' if agg == 'rolling' else 'none'}
        cpg_style = {'display': 'block' if chart_type != 'heatmap' and len(group or []) else 'none'}
        barmode_style = {'display': 'block' if chart_type == 'bar' else 'none'}
        barsort_style = {'display': 'block' if chart_type == 'bar' else 'none'}
        barsort_options = make_list(x) if x is not None else []
        barsort_options += make_list(y) if y is not None else []
        barsort_options = [build_option(o) for o in barsort_options]

        yaxis_style, yaxis_options = {'display': 'none'}, []
        if chart_type in YAXIS_CHARTS and len(y or []):
            yaxis_style, yaxis_options = {'display': 'block'}, [build_option(y2) for y2 in y]

        return (
            y_style, y_heatmap_style, z_style, group_style, rolling_style, cpg_style, barmode_style, barsort_style,
            barsort_options, yaxis_style, yaxis_options
        )

    @dash_app.callback(
        Output('chart-input-data', 'data'),
        [
            Input('cpg-toggle', 'on'),
            Input('barmode-dropdown', 'value'),
            Input('barsort-dropdown', 'value'),
        ]
    )
    def chart_input_data(cpg, barmode, barsort):
        return dict(cpg=cpg, barmode=barmode, barsort=barsort)

    @dash_app.callback(
        [Output('chart-content', 'children'), Output('last-chart-input-data', 'data'), Output('range-data', 'data')],
        # Since we use the data prop in an output,
        # we cannot get the initial data on load with the data prop.
        # To counter this, you can use the modified_timestamp
        # as Input and the data as State.
        # This limitation is due to the initial None callbacks
        # https://github.com/plotly/dash-renderer/pull/81
        [
            Input('input-data', 'modified_timestamp'),
            Input('chart-input-data', 'modified_timestamp'),
            Input('yaxis-data', 'modified_timestamp'),
        ],
        [
            State('url', 'pathname'),
            State('input-data', 'data'),
            State('chart-input-data', 'data'),
            State('yaxis-data', 'data'),
            State('last-chart-input-data', 'data')
        ]
    )
    def on_data(_ts1, _ts2, _ts3, pathname, inputs, chart_inputs, yaxis_data, last_chart_inputs):
        all_inputs = dict_merge(inputs, chart_inputs, dict(yaxis=yaxis_data or {}))
        if all_inputs == last_chart_inputs:
            raise PreventUpdate
        charts, range_data = load_chart(pathname, **all_inputs)
        return charts, all_inputs, range_data

    def load_chart(pathname, **kwargs):
        try:
            data = build_figure_data(pathname, **kwargs)
            if data is None:
                return None, None

            if 'error' in data:
                return build_error(data['error'], data['traceback']), None

            data_id = get_data_id(pathname)
            return build_chart(data, data_id, **kwargs), dict(min=data['min'], max=data['max'])
        except BaseException as e:
            return build_error(str(e), str(traceback.format_exc())), None

    @dash_app.callback(
        [Output('yaxis-min-input', 'value'), Output('yaxis-max-input', 'value')],
        [Input('yaxis-dropdown', 'value')],
        [State('input-data', 'data'), State('yaxis-data', 'data'), State('range-data', 'data')]
    )
    def yaxis_min_max_values(yaxis, inputs, yaxis_inputs, range_data):
        chart_type, y = [(inputs or {}).get(p) for p in ['chart_type', 'y']]
        if chart_type not in YAXIS_CHARTS:
            return None, None
        if not len(y or []):
            return None, None
        if yaxis is None:
            return None, None

        curr_vals = (yaxis_inputs or {}).get(yaxis) or {}
        curr_min = curr_vals.get('min') or range_data.get('min', {}).get(yaxis)
        curr_max = curr_vals.get('max') or range_data.get('max', {}).get(yaxis)
        return curr_min, curr_max

    @dash_app.callback(
        Output('yaxis-data', 'data'),
        [Input('yaxis-min-input', 'value'), Input('yaxis-max-input', 'value')],
        [State('yaxis-dropdown', 'value'), State('yaxis-data', 'data'), State('range-data', 'data')]
    )
    def update_yaxis_data(yaxis_min, yaxis_max, yaxis, yaxis_data, range_data):
        if yaxis is None:
            raise PreventUpdate
        yaxis_data = yaxis_data or {}
        range_min, range_max = (range_data[p][yaxis] for p in ['min', 'max'])
        if yaxis in yaxis_data:
            if (yaxis_min, yaxis_max) == (range_min, range_max):
                del yaxis_data[yaxis]
            else:
                yaxis_data[yaxis] = dict(min=yaxis_min, max=yaxis_max)
        else:
            if (yaxis_min, yaxis_max) != (range_min, range_max):
                yaxis_data[yaxis] = dict(min=yaxis_min, max=yaxis_max)
        return yaxis_data

    @dash_app.callback(Output('popup-chart-content', 'children'), [Input('url', 'pathname'), Input('url', 'search')])
    def popup_figure_content(pathname, search):
        params = chart_url_params(search)
        charts, _ = load_chart(pathname, **params)
        return charts

    @dash_app.callback(
        Output('popup-content', 'children'),
        [Input('url', 'modified_timestamp')],
        [State('url', 'pathname')])
    def display_page(_ts, pathname):
        dash_app.config.suppress_callback_exceptions = False
        if pathname.startswith('/charts/popup/'):
            return html.Div(dcc.Loading(html.Div(id='popup-chart-content'), type='circle'), className='charts-body')
        df = DATA[get_data_id(pathname)]
        return charts_layout(df)
