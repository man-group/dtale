import json as json
from logging import getLogger

import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

import dtale.global_state as global_state
from dtale.charts.utils import MAX_GROUPS, ZAXIS_CHARTS
from dtale.dash_application.charts import build_chart, chart_url_params
from dtale.dash_application.layout import (animate_styles, bar_input_style,
                                           base_layout,
                                           build_group_val_options,
                                           build_input_options,
                                           build_loc_mode_hover_children,
                                           build_map_options,
                                           build_proj_hover_children,
                                           charts_layout,
                                           colorscale_input_style,
                                           get_yaxis_type_tabs,
                                           main_inputs_and_group_val_display,
                                           show_chart_per_group,
                                           show_input_handler,
                                           show_yaxis_ranges)
from dtale.utils import dict_merge, make_list, run_query

logger = getLogger(__name__)


class DtaleDash(dash.Dash):
    """
    Wrapper class to dash.Dash to allow for abstraction of global state used for building the default layout.
    Additional state include stylesheets, JS files and styling for github demos.
    """

    def __init__(self, *args, **kwargs):
        server = kwargs.get('server')
        kwargs['external_stylesheets'] = ['/css/main.css', '/css/dash.css']
        if server.config['GITHUB_FORK']:
            kwargs['external_stylesheets'].append('/css/github_fork.css')
        kwargs['external_scripts'] = [
            '/dash/components_bundle.js', '/dash/custom_bundle.js', '/dist/base_styles_bundle.js'
        ]

        super(DtaleDash, self).__init__(*args, **kwargs)

    def interpolate_index(self, **kwargs):
        return base_layout(self.server.config['GITHUB_FORK'], **kwargs)


def add_dash(server):
    """
    Adds dash support to main D-Tale Flask process.

    :param server: main D-Tale Flask process
    :type server: :class:`flask:flask.Flask`
    :return: server with dash added
    :rtype: :class:`flask:flask.Flask`
    """

    dash_app = DtaleDash(server=server, routes_pathname_prefix='/charts/', eager_loading=True)

    # Since we're adding callbacks to elements that don't exist in the app.layout,
    # Dash will raise an exception to warn us that we might be
    # doing something wrong.
    # In this case, we're adding the elements through a callback, so we can ignore
    # the exception.
    dash_app.config.suppress_callback_exceptions = True
    dash_app.layout = html.Div([dcc.Location(id='url', refresh=False), html.Div(id='popup-content')])
    dash_app.scripts.config.serve_locally = True
    dash_app.css.config.serve_locally = True

    init_callbacks(dash_app)

    return dash_app.server


def get_data_id(pathname):
    """
    Parses data ID from query path (ex: 'foo/bar/1' => '1')
    """
    return pathname.split('/')[-1]


def init_callbacks(dash_app):
    """
    Dynamically adds dash callbacks to dash-wrapped flask server

    :param dash_app: flask server with dash support enabled
    :type dash_app: :class:`flask:flask.Flask`
    :return: flask server with dash callbacks added
    :rtype: :class:`flask:flask.Flask`
    """

    @dash_app.callback(
        [Output('query-data', 'data'), Output('query-input', 'style'), Output('query-input', 'title')],
        [Input('query-input', 'value')],
        [State('url', 'pathname'), State('query-data', 'data')]
    )
    def query_input(query, pathname, curr_query):
        """
        dash callback for storing valid pandas dataframe queries.  This acts as an intermediary between values typed
        by the user and values that are applied to pandas dataframes.  Most of the time what the user has typed is not
        complete and thus not a valid pandas dataframe query.

        :param query: query input
        :type query: str
        :param pathname: URL path
        :param curr_query: current valid pandas dataframe query
        :return: tuple of (query (if valid), styling for query input (if invalid input), query input title (containing
        invalid query exception information)
        :rtype: tuple of (str, str, str)
        """
        try:
            data_id = get_data_id(pathname)
            data = global_state.get_data(data_id)
            ctxt_vars = global_state.get_context_variables(data_id)
            run_query(data, query, ctxt_vars)
            return query, {'line-height': 'inherit'}, ''
        except BaseException as ex:
            return curr_query, {'line-height': 'inherit', 'background-color': 'pink'}, str(ex)

    @dash_app.callback(
        [
            Output('input-data', 'data'),
            Output('x-dropdown', 'options'),
            Output('y-single-dropdown', 'options'),
            Output('y-multi-dropdown', 'options'),
            Output('z-dropdown', 'options'),
            Output('group-dropdown', 'options'),
            Output('barsort-dropdown', 'options'),
            Output('yaxis-dropdown', 'options'),
            Output('non-map-inputs', 'style'),
            Output('map-inputs', 'style'),
            Output('colorscale-input', 'style'),
        ],
        [
            Input('query-data', 'modified_timestamp'),
            Input('chart-tabs', 'value'),
            Input('x-dropdown', 'value'),
            Input('y-multi-dropdown', 'value'),
            Input('y-single-dropdown', 'value'),
            Input('z-dropdown', 'value'),
            Input('group-dropdown', 'value'),
            Input('group-val-dropdown', 'value'),
            Input('agg-dropdown', 'value'),
            Input('window-input', 'value'),
            Input('rolling-comp-dropdown', 'value'),
        ],
        [State('url', 'pathname'), State('query-data', 'data')]
    )
    def input_data(_ts, chart_type, x, y_multi, y_single, z, group, group_val, agg, window, rolling_comp, pathname,
                   query):
        """
        dash callback for maintaining chart input state and column-based dropdown options.  This will guard against
        users selecting the same column for multiple axes.
        """
        y_val = make_list(y_single if chart_type in ZAXIS_CHARTS else y_multi)
        if group_val is not None:
            group_val = [json.loads(gv) for gv in group_val]
        inputs = dict(query=query, chart_type=chart_type, x=x, y=y_val, z=z, group=group, group_val=group_val, agg=agg,
                      window=window, rolling_comp=rolling_comp)
        data_id = get_data_id(pathname)
        options = build_input_options(global_state.get_data(data_id), **inputs)
        x_options, y_multi_options, y_single_options, z_options, group_options, barsort_options, yaxis_options = options
        show_map = chart_type == 'maps'
        map_style = {} if show_map else {'display': 'none'}
        non_map_style = {'display': 'none'} if show_map else {}
        cscale_style = colorscale_input_style(chart_type=chart_type)
        return (
            inputs, x_options, y_single_options, y_multi_options, z_options, group_options, barsort_options,
            yaxis_options, non_map_style, map_style, cscale_style
        )

    @dash_app.callback(
        [
            Output('map-input-data', 'data'),
            Output('map-loc-dropdown', 'options'),
            Output('map-lat-dropdown', 'options'),
            Output('map-lon-dropdown', 'options'),
            Output('map-val-dropdown', 'options'),
            Output('map-loc-mode-input', 'style'),
            Output('map-loc-input', 'style'),
            Output('map-lat-input', 'style'),
            Output('map-lon-input', 'style'),
            Output('map-scope-input', 'style'),
            Output('map-proj-input', 'style'),
            Output('proj-hover', 'style'),
            Output('proj-hover', 'children'),
            Output('loc-mode-hover', 'style'),
            Output('loc-mode-hover', 'children')
        ],
        [
            Input('map-type-tabs', 'value'),
            Input('map-loc-mode-dropdown', 'value'),
            Input('map-loc-dropdown', 'value'),
            Input('map-lat-dropdown', 'value'),
            Input('map-lon-dropdown', 'value'),
            Input('map-val-dropdown', 'value'),
            Input('map-scope-dropdown', 'value'),
            Input('map-proj-dropdown', 'value'),
            Input('map-group-dropdown', 'value')
        ],
        [State('url', 'pathname')]
    )
    def map_data(map_type, loc_mode, loc, lat, lon, map_val, scope, proj, group, pathname):
        data_id = get_data_id(pathname)
        map_type = map_type or 'choropleth'
        if map_type == 'choropleth':
            map_data = dict(map_type=map_type, loc_mode=loc_mode, loc=loc, map_val=map_val)
        else:
            map_data = dict(map_type=map_type, lat=lat, lon=lon, map_val=map_val, scope=scope, proj=proj)

        if group is not None:
            map_data['map_group'] = group
        df = global_state.get_data(data_id)
        loc_options, lat_options, lon_options, map_val_options = build_map_options(df, type=map_type, loc=loc,
                                                                                   lat=lat, lon=lon, map_val=map_val)
        choro_style = {} if map_type == 'choropleth' else {'display': 'none'}
        scatt_style = {} if map_type == 'scattergeo' else {'display': 'none'}
        proj_hover_style = {'display': 'none'} if proj is None else dict(borderBottom='none')
        proj_hopver_children = build_proj_hover_children(proj)
        loc_mode_hover_style = {'display': 'none'} if loc_mode is None else dict(borderBottom='none')
        loc_mode_children = build_loc_mode_hover_children(loc_mode)
        return (
            map_data, loc_options, lat_options, lon_options, map_val_options, choro_style, choro_style, scatt_style,
            scatt_style, scatt_style, scatt_style, proj_hover_style, proj_hopver_children, loc_mode_hover_style,
            loc_mode_children
        )

    @dash_app.callback(
        [
            Output('y-multi-input', 'style'),
            Output('y-single-input', 'style'),
            Output('z-input', 'style'),
            Output('group-input', 'style'),
            Output('rolling-inputs', 'style'),
            Output('cpg-input', 'style'),
            Output('barmode-input', 'style'),
            Output('barsort-input', 'style'),
            Output('yaxis-input', 'style'),
            Output('animate-input', 'style'),
            Output('animate-by-input', 'style'),
            Output('animate-by-dropdown', 'options')
        ],
        [Input('input-data', 'modified_timestamp')],
        [State('input-data', 'data'), State('url', 'pathname')]
    )
    def input_toggles(_ts, inputs, pathname):
        """
        dash callback controlling showing/hiding of chart-specific inputs (for example z-axis) as well as chart
        formatting inputs (sorting for bars in bar chart, bar chart style (stacked) or y-axis ranges.
        """
        [chart_type, agg] = [inputs.get(p) for p in ['chart_type', 'agg']]
        show_input = show_input_handler(chart_type)

        y_multi_style = {'display': 'block' if show_input('y', 'multi') else 'none'}
        y_single_style = {'display': 'block' if show_input('y') else 'none'}
        z_style = {'display': 'block' if show_input('z') else 'none'}
        group_style = {'display': 'block' if show_input('group') else 'none'}
        rolling_style = {'display': 'inherit' if agg == 'rolling' else 'none'}
        cpg_style = {'display': 'block' if show_chart_per_group(**inputs) else 'none'}
        bar_style = bar_input_style(**inputs)
        yaxis_style = {'display': 'block' if show_yaxis_ranges(**inputs) else 'none'}

        data_id = get_data_id(pathname)
        df = global_state.get_data(data_id)
        animate_style, animate_by_style, animate_opts = animate_styles(df, **inputs)

        return (
            y_multi_style, y_single_style, z_style, group_style, rolling_style, cpg_style, bar_style, bar_style,
            yaxis_style, animate_style, animate_by_style, animate_opts
        )

    @dash_app.callback(
        Output('chart-input-data', 'data'),
        [
            Input('cpg-toggle', 'on'),
            Input('barmode-dropdown', 'value'),
            Input('barsort-dropdown', 'value'),
            Input('colorscale-dropdown', 'value'),
            Input('animate-toggle', 'on'),
            Input('animate-by-dropdown', 'value'),
        ]
    )
    def chart_input_data(cpg, barmode, barsort, colorscale, animate, animate_by):
        """
        dash callback for maintaining selections in chart-formatting inputs
            - chart per group flag
            - bar chart mode
            - bar chart sorting
        """
        return dict(cpg=cpg, barmode=barmode, barsort=barsort, colorscale=colorscale, animate=animate,
                    animate_by=animate_by)

    @dash_app.callback(
        [
            Output('chart-content', 'children'),
            Output('last-chart-input-data', 'data'),
            Output('range-data', 'data'),
            Output('chart-code', 'value'),
            Output('yaxis-type', 'children'),
        ],
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
            Input('map-input-data', 'modified_timestamp')
        ],
        [
            State('url', 'pathname'),
            State('input-data', 'data'),
            State('chart-input-data', 'data'),
            State('yaxis-data', 'data'),
            State('map-input-data', 'data'),
            State('last-chart-input-data', 'data')
        ]
    )
    def on_data(_ts1, _ts2, _ts3, _ts4, pathname, inputs, chart_inputs, yaxis_data, map_data, last_chart_inputs):
        """
        dash callback controlling the building of dash charts
        """
        all_inputs = dict_merge(inputs, chart_inputs, dict(yaxis=yaxis_data or {}), map_data)
        if all_inputs == last_chart_inputs:
            raise PreventUpdate
        charts, range_data, code = build_chart(get_data_id(pathname), **all_inputs)
        return charts, all_inputs, range_data, code, get_yaxis_type_tabs(make_list(inputs.get('y') or []))

    def get_default_range(range_data, y, max=False):
        if max:
            return next(iter(sorted([range_data[y2] for y2 in y if y2 in range_data], reverse=True)), None)
        return next(iter(sorted([range_data[y2] for y2 in y if y2 in range_data])), None)

    @dash_app.callback(
        [
            Output('yaxis-min-input', 'value'),
            Output('yaxis-max-input', 'value'),
            Output('yaxis-dropdown', 'style'),
            Output('yaxis-min-label', 'style'),
            Output('yaxis-min-input', 'style'),
            Output('yaxis-max-label', 'style'),
            Output('yaxis-max-input', 'style'),
            Output('yaxis-type-div', 'style'),
        ],
        [Input('yaxis-type', 'value'), Input('yaxis-dropdown', 'value')],
        [State('input-data', 'data'), State('yaxis-data', 'data'), State('range-data', 'data')]
    )
    def yaxis_min_max_values(yaxis_type, yaxis, inputs, yaxis_inputs, range_data):
        """
        dash callback controlling values for selected y-axis in y-axis range editor
        """
        y = make_list(inputs.get('y'))
        dd_style = dict(display='block' if yaxis_type == 'multi' and len(y) > 1 else 'none')
        type_style = {'borderRadius': '0 0.25rem 0.25rem 0'} if yaxis_type == 'default' else None
        min_max_style = 'none' if (yaxis_type == 'default') or (yaxis_type == 'multi' and yaxis is None) else 'block'
        label_style = dict(display=min_max_style)
        input_style = {'lineHeight': 'inherit', 'display': min_max_style}
        curr_min, curr_max = (None, None)
        range_min, range_max = ((range_data or {}).get(p) or {} for p in ['min', 'max'])
        if yaxis:
            curr_vals = (yaxis_inputs or {}).get('data', {}).get(yaxis) or {}
            curr_min = curr_vals.get('min') or range_min.get(yaxis)
            curr_max = curr_vals.get('max') or range_max.get(yaxis)
        elif yaxis_type == 'single':
            curr_vals = (yaxis_inputs or {}).get('data', {}).get('all') or {}
            curr_min = curr_vals.get('min')
            if curr_min is None:
                curr_min = get_default_range(range_min, y)
            curr_max = curr_vals.get('max')
            if curr_max is None:
                curr_max = get_default_range(range_max, y, max=True)
        return curr_min, curr_max, dd_style, label_style, input_style, label_style, input_style, type_style

    @dash_app.callback(
        Output('yaxis-data', 'data'),
        [Input('yaxis-type', 'value'), Input('yaxis-min-input', 'value'), Input('yaxis-max-input', 'value')],
        [
            State('yaxis-dropdown', 'value'),
            State('yaxis-data', 'data'),
            State('range-data', 'data'),
            State('input-data', 'data')
        ]
    )
    def update_yaxis_data(yaxis_type, yaxis_min, yaxis_max, yaxis, yaxis_data, range_data, inputs):
        """
        dash callback controlling updates to y-axis range state
        """
        yaxis_data = yaxis_data or dict(data={})
        yaxis_data['type'] = yaxis_type
        yaxis_name = 'all' if yaxis_type == 'single' else yaxis
        if yaxis_name == 'all':
            y = make_list(inputs.get('y'))
            mins = range_data.get('min', {})
            maxs = range_data.get('max', {})
            range_min = get_default_range(mins, y)
            range_max = get_default_range(maxs, y, max=True)
        elif yaxis is None:
            raise PreventUpdate
        else:
            range_min, range_max = (range_data[p].get(yaxis_name) for p in ['min', 'max'])

        if yaxis_name in yaxis_data['data']:
            if (yaxis_min, yaxis_max) == (range_min, range_max):
                del yaxis_data['data'][yaxis_name]
            else:
                yaxis_data['data'][yaxis_name] = dict(min=yaxis_min, max=yaxis_max)
        else:
            if (yaxis_min, yaxis_max) != (range_min, range_max):
                yaxis_data['data'][yaxis_name] = dict(min=yaxis_min, max=yaxis_max)
        return yaxis_data

    @dash_app.callback(
        [Output('group-val-input', 'style'), Output('main-inputs', 'className')],
        [Input('input-data', 'modified_timestamp'), Input('map-input-data', 'modified_timestamp')],
        [State('input-data', 'data'), State('map-input-data', 'data')]
    )
    def main_input_class(ts_, ts2_, inputs, map_inputs):
        return main_inputs_and_group_val_display(dict_merge(inputs, map_inputs))

    @dash_app.callback(
        [Output('group-val-dropdown', 'options'), Output('group-val-dropdown', 'value')],
        [Input('chart-tabs', 'value'), Input('group-dropdown', 'value'), Input('map-group-dropdown', 'value')],
        [State('url', 'pathname'), State('input-data', 'data'), State('group-val-dropdown', 'value')]
    )
    def group_values(chart_type, group_cols, map_group_cols, pathname, inputs, prev_group_vals):
        group_cols = make_list(group_cols)
        if show_input_handler(chart_type or 'line')('group') and not len(group_cols):
            return [], None
        elif chart_type == 'maps':  # all maps have a group input
            group_cols = make_list(map_group_cols)
            if not len(group_cols):
                return [], None
        data_id = get_data_id(pathname)
        group_vals = run_query(
            global_state.get_data(data_id),
            inputs.get('query'),
            global_state.get_context_variables(data_id)
        )
        group_vals = build_group_val_options(group_vals, group_cols)
        selections = []
        available_vals = [gv['value'] for gv in group_vals]
        if prev_group_vals is not None:
            selections = [pgv for pgv in prev_group_vals if pgv in available_vals]
        if not len(selections) and len(group_vals) <= MAX_GROUPS:
            selections = available_vals

        return group_vals, selections

    @dash_app.callback(
        Output('popup-content', 'children'),
        [Input('url', 'pathname'), Input('url', 'search')])
    def display_page(pathname, search):
        """
        dash callback which gets called on initial load of each dash page (main & popup)
        """
        dash_app.config.suppress_callback_exceptions = False
        if pathname is None:
            raise PreventUpdate
        params = chart_url_params(search)
        data_id = get_data_id(pathname)
        df = global_state.get_data(data_id)
        settings = global_state.get_settings(data_id) or {}
        return charts_layout(df, settings, **params)
