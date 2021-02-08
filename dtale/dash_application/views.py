import json as json
from logging import getLogger

import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

import dtale.dash_application.custom_geojson as custom_geojson
import dtale.dash_application.drilldown_modal as drilldown_modal
import dtale.dash_application.lock_zoom as lock_zoom
import dtale.global_state as global_state
from dtale.charts.utils import MAX_GROUPS, ZAXIS_CHARTS
from dtale.dash_application.charts import (
    build_chart,
    chart_url_params,
    CHART_EXPORT_CODE,
)
from dtale.dash_application.layout.layout import (
    animate_styles,
    bar_input_style,
    base_layout,
    build_group_val_options,
    build_input_options,
    build_loc_mode_hover_children,
    build_map_options,
    build_candlestick_options,
    build_mapbox_style_options,
    build_proj_hover_children,
    build_slider_counts,
    build_treemap_options,
    charts_layout,
    colorscale_input_style,
    get_yaxis_type_tabs,
    lock_zoom_style,
    main_inputs_and_group_val_display,
    show_chart_per_group,
    get_group_types,
    show_input_handler,
    show_yaxis_ranges,
)
from dtale.dash_application.layout.utils import show_style
from dtale.dash_application.utils import get_data_id
from dtale.query import run_query
from dtale.utils import dict_merge, is_app_root_defined, make_list

logger = getLogger(__name__)


class DtaleDash(dash.Dash):
    """
    Wrapper class to dash.Dash to allow for abstraction of global state used for building the default layout.
    Additional state include stylesheets, JS files and styling for github demos.
    """

    def __init__(self, *args, **kwargs):
        server = kwargs.get("server")
        kwargs["external_stylesheets"] = [
            "/dtale/static/css/main.css",
            "/dtale/static/css/dash.css",
            "/dtale/static/css/github_fork.css",
        ]
        kwargs["external_scripts"] = [
            "/dtale/static/dash/components_bundle.js",
            "/dtale/static/dash/custom_bundle.js",
            "/dtale/static/dist/base_styles_bundle.js",
        ]

        app_root = server.config.get("APPLICATION_ROOT")
        if is_app_root_defined(app_root):

            def _prepend_app_root(v):
                return "{}{}".format(app_root, v)

            kwargs["requests_pathname_prefix"] = _prepend_app_root(
                kwargs["routes_pathname_prefix"]
            )
            kwargs["external_stylesheets"] = [
                _prepend_app_root(v) for v in kwargs["external_stylesheets"]
            ]
            kwargs["external_scripts"] = [
                _prepend_app_root(v) for v in kwargs["external_scripts"]
            ]
            kwargs["assets_url_path"] = _prepend_app_root("")
            kwargs["assets_external_path"] = _prepend_app_root("/assets")

        super(DtaleDash, self).__init__(*args, **kwargs)

    def interpolate_index(self, **kwargs):
        return base_layout(self.server.config.get("APPLICATION_ROOT"), **kwargs)


def add_dash(server):
    """
    Adds dash support to main D-Tale Flask process.

    :param server: main D-Tale Flask process
    :type server: :class:`flask:flask.Flask`
    :return: server with dash added
    :rtype: :class:`flask:flask.Flask`
    """

    dash_app = DtaleDash(
        server=server, routes_pathname_prefix="/dtale/charts/", eager_loading=True
    )

    # Since we're adding callbacks to elements that don't exist in the app.layout,
    # Dash will raise an exception to warn us that we might be
    # doing something wrong.
    # In this case, we're adding the elements through a callback, so we can ignore
    # the exception.
    dash_app.config.suppress_callback_exceptions = True
    dash_app.layout = html.Div(
        [dcc.Location(id="url", refresh=False), html.Div(id="popup-content")]
    )
    dash_app.scripts.config.serve_locally = True
    dash_app.css.config.serve_locally = True

    init_callbacks(dash_app)

    return dash_app.server


def init_callbacks(dash_app):
    """
    Dynamically adds dash callbacks to dash-wrapped flask server

    :param dash_app: flask server with dash support enabled
    :type dash_app: :class:`flask:flask.Flask`
    :return: flask server with dash callbacks added
    :rtype: :class:`flask:flask.Flask`
    """

    @dash_app.callback(
        [
            Output("query-data", "data"),
            Output("query-input", "style"),
            Output("query-input", "title"),
            Output("load-input", "marks"),
        ],
        [Input("query-input", "value")],
        [
            State("url", "pathname"),
            State("query-data", "data"),
            State("load-input", "marks"),
        ],
    )
    def query_input(query, pathname, curr_query, curr_marks):
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
            df = run_query(data, query, ctxt_vars)
            return (
                query,
                {"line-height": "inherit"},
                "",
                build_slider_counts(df, data_id, query),
            )
        except BaseException as ex:
            return (
                curr_query,
                {"line-height": "inherit", "background-color": "pink"},
                str(ex),
                curr_marks,
            )

    @dash_app.callback(
        [
            Output("input-data", "data"),
            Output("x-dropdown", "options"),
            Output("y-single-dropdown", "options"),
            Output("y-multi-dropdown", "options"),
            Output("z-dropdown", "options"),
            Output("group-dropdown", "options"),
            Output("barsort-dropdown", "options"),
            Output("yaxis-dropdown", "options"),
            Output("standard-inputs", "style"),
            Output("map-inputs", "style"),
            Output("candlestick-inputs", "style"),
            Output("treemap-inputs", "style"),
            Output("colorscale-input", "style"),
            Output("drilldown-input", "style"),
            Output("lock-zoom-btn", "style"),
        ],
        [
            Input("query-data", "modified_timestamp"),
            Input("chart-tabs", "value"),
            Input("x-dropdown", "value"),
            Input("y-multi-dropdown", "value"),
            Input("y-single-dropdown", "value"),
            Input("z-dropdown", "value"),
            Input("group-dropdown", "value"),
            Input("group-type", "value"),
            Input("group-val-dropdown", "value"),
            Input("bins-val-input", "value"),
            Input("bin-type", "value"),
            Input("agg-dropdown", "value"),
            Input("window-input", "value"),
            Input("rolling-comp-dropdown", "value"),
            Input("load-input", "value"),
        ],
        [State("url", "pathname"), State("query-data", "data")],
    )
    def input_data(
        _ts,
        chart_type,
        x,
        y_multi,
        y_single,
        z,
        group,
        group_type,
        group_val,
        bins_val,
        bin_type,
        agg,
        window,
        rolling_comp,
        load,
        pathname,
        query,
    ):
        """
        dash callback for maintaining chart input state and column-based dropdown options.  This will guard against
        users selecting the same column for multiple axes.
        """
        y_val = make_list(y_single if chart_type in ZAXIS_CHARTS else y_multi)
        data_id = get_data_id(pathname)
        if group_val is not None:
            group_val = [json.loads(gv) for gv in group_val]
        inputs = dict(
            query=query,
            chart_type=chart_type,
            x=x,
            y=y_val,
            z=z,
            group=group,
            group_type=group_type or "groups",
            group_val=group_val if group else None,
            bins_val=bins_val if group else None,
            bin_type=bin_type or "width",
            agg=agg or "raw",
            window=window,
            rolling_comp=rolling_comp,
            load=load,
        )
        options = build_input_options(global_state.get_data(data_id), **inputs)
        (
            x_options,
            y_multi_options,
            y_single_options,
            z_options,
            group_options,
            barsort_options,
            yaxis_options,
        ) = options
        show_map = chart_type == "maps"
        map_style = {} if show_map else {"display": "none"}
        show_cs = chart_type == "candlestick"
        cs_style = {} if show_cs else {"display": "none"}
        show_treemap = chart_type == "treemap"
        treemap_style = {} if show_treemap else {"display": "none"}
        standard_style = (
            {"display": "none"} if show_map or show_cs or show_treemap else {}
        )
        cscale_style = colorscale_input_style(chart_type=chart_type)
        drilldown_toggle_style = show_style((agg or "raw") != "raw")
        return (
            inputs,
            x_options,
            y_single_options,
            y_multi_options,
            z_options,
            group_options,
            barsort_options,
            yaxis_options,
            standard_style,
            map_style,
            cs_style,
            treemap_style,
            cscale_style,
            drilldown_toggle_style,
            lock_zoom_style(chart_type),
        )

    @dash_app.callback(
        [
            Output("map-input-data", "data"),
            Output("map-loc-dropdown", "options"),
            Output("map-lat-dropdown", "options"),
            Output("map-lon-dropdown", "options"),
            Output("map-val-dropdown", "options"),
            Output("map-loc-mode-input", "style"),
            Output("map-loc-input", "style"),
            Output("map-lat-input", "style"),
            Output("map-lon-input", "style"),
            Output("map-scope-input", "style"),
            Output("map-mapbox-style-input", "style"),
            Output("map-proj-input", "style"),
            Output("proj-hover", "style"),
            Output("proj-hover", "children"),
            Output("loc-mode-hover", "style"),
            Output("loc-mode-hover", "children"),
            Output("custom-geojson-input", "style"),
        ],
        [
            Input("map-type-tabs", "value"),
            Input("map-loc-mode-dropdown", "value"),
            Input("map-loc-dropdown", "value"),
            Input("map-lat-dropdown", "value"),
            Input("map-lon-dropdown", "value"),
            Input("map-val-dropdown", "value"),
            Input("map-scope-dropdown", "value"),
            Input("map-mapbox-style-dropdown", "value"),
            Input("map-proj-dropdown", "value"),
            Input("map-group-dropdown", "value"),
            Input("geojson-dropdown", "value"),
            Input("featureidkey-dropdown", "value"),
        ],
        [State("url", "pathname")],
    )
    def map_data(
        map_type,
        loc_mode,
        loc,
        lat,
        lon,
        map_val,
        scope,
        style,
        proj,
        group,
        geojson,
        featureidkey,
        pathname,
    ):
        data_id = get_data_id(pathname)
        map_type = map_type or "choropleth"
        if map_type == "choropleth":
            map_data = dict(
                map_type=map_type, loc_mode=loc_mode, loc=loc, map_val=map_val
            )
            if loc_mode == "geojson-id":
                map_data["geojson"] = geojson
                map_data["featureidkey"] = featureidkey
        elif map_type == "mapbox":
            map_data = dict(
                map_type=map_type, lat=lat, lon=lon, map_val=map_val, mapbox_style=style
            )
        else:
            map_data = dict(
                map_type=map_type,
                lat=lat,
                lon=lon,
                map_val=map_val,
                scope=scope,
                proj=proj,
            )

        if group is not None:
            map_data["map_group"] = group
        df = global_state.get_data(data_id)
        loc_options, lat_options, lon_options, map_val_options = build_map_options(
            df, type=map_type, loc=loc, lat=lat, lon=lon, map_val=map_val
        )
        choro_style = {} if map_type == "choropleth" else {"display": "none"}
        coord_style = (
            {} if map_type in ["scattergeo", "mapbox"] else {"display": "none"}
        )
        scatt_style = {} if map_type == "scattergeo" else {"display": "none"}
        mapbox_style = {} if map_type == "mapbox" else {"display": "none"}
        proj_hover_style = (
            {"display": "none"} if proj is None else dict(borderBottom="none")
        )
        proj_hopver_children = build_proj_hover_children(proj)
        loc_mode_hover_style = (
            {"display": "none"} if loc_mode is None else dict(borderBottom="none")
        )
        loc_mode_children = build_loc_mode_hover_children(loc_mode)
        custom_geojson_link = (
            {}
            if map_type == "choropleth" and loc_mode == "geojson-id"
            else {"display": "none"}
        )
        return (
            map_data,
            loc_options,
            lat_options,
            lon_options,
            map_val_options,
            choro_style,
            choro_style,
            coord_style,
            coord_style,
            scatt_style,
            mapbox_style,
            scatt_style,
            proj_hover_style,
            proj_hopver_children,
            loc_mode_hover_style,
            loc_mode_children,
            custom_geojson_link,
        )

    @dash_app.callback(
        Output("map-mapbox-style-dropdown", "options"),
        [Input("mapbox-token-input", "value")],
    )
    def update_mapbox_token(token):
        from dtale.charts.utils import set_mapbox_token

        if token:
            set_mapbox_token(token)
        return build_mapbox_style_options()

    @dash_app.callback(
        [
            Output("candlestick-input-data", "data"),
            Output("candlestick-x-dropdown", "options"),
            Output("candlestick-open-dropdown", "options"),
            Output("candlestick-close-dropdown", "options"),
            Output("candlestick-high-dropdown", "options"),
            Output("candlestick-low-dropdown", "options"),
        ],
        [
            Input("candlestick-x-dropdown", "value"),
            Input("candlestick-open-dropdown", "value"),
            Input("candlestick-close-dropdown", "value"),
            Input("candlestick-high-dropdown", "value"),
            Input("candlestick-low-dropdown", "value"),
            Input("candlestick-group-dropdown", "value"),
        ],
        [State("url", "pathname")],
    )
    def cs_data_callback(
        cs_x,
        cs_open,
        cs_close,
        cs_high,
        cs_low,
        group,
        pathname,
    ):
        data_id = get_data_id(pathname)
        cs_data = dict(
            cs_x=cs_x,
            cs_open=cs_open,
            cs_close=cs_close,
            cs_high=cs_high,
            cs_low=cs_low,
        )
        if group is not None:
            cs_data["cs_group"] = group
        df = global_state.get_data(data_id)
        (
            x_options,
            close_options,
            open_options,
            low_options,
            high_options,
        ) = build_candlestick_options(
            df,
            cs_x=cs_x,
            cs_open=cs_open,
            cs_close=cs_close,
            cs_high=cs_high,
            cs_low=cs_low,
        )

        return (
            cs_data,
            x_options,
            open_options,
            close_options,
            high_options,
            low_options,
        )

    @dash_app.callback(
        [
            Output("treemap-input-data", "data"),
            Output("treemap-value-dropdown", "options"),
            Output("treemap-label-dropdown", "options"),
        ],
        [
            Input("treemap-value-dropdown", "value"),
            Input("treemap-label-dropdown", "value"),
            Input("treemap-group-dropdown", "value"),
        ],
        [State("url", "pathname")],
    )
    def treemap_data_callback(
        treemap_value,
        treemap_label,
        group,
        pathname,
    ):
        data_id = get_data_id(pathname)
        treemap_data = dict(
            treemap_value=treemap_value,
            treemap_label=treemap_label,
        )
        if group is not None:
            treemap_data["treemap_group"] = group
        df = global_state.get_data(data_id)
        value_options, label_options = build_treemap_options(
            df,
            treemap_value=treemap_value,
            treemap_label=treemap_label,
        )
        return treemap_data, value_options, label_options

    @dash_app.callback(
        [
            Output("y-multi-input", "style"),
            Output("y-single-input", "style"),
            Output("z-input", "style"),
            Output("group-input", "style"),
            Output("rolling-inputs", "style"),
            Output("cpg-input", "style"),
            Output("barmode-input", "style"),
            Output("barsort-input", "style"),
            Output("top-bars-input", "style"),
            Output("yaxis-input", "style"),
            Output("animate-input", "style"),
            Output("animate-by-input", "style"),
            Output("animate-by-dropdown", "options"),
            Output("trendline-input", "style"),
        ],
        [Input("input-data", "modified_timestamp")],
        [State("input-data", "data"), State("url", "pathname")],
    )
    def input_toggles(_ts, inputs, pathname):
        """
        dash callback controlling showing/hiding of chart-specific inputs (for example z-axis) as well as chart
        formatting inputs (sorting for bars in bar chart, bar chart style (stacked) or y-axis ranges.
        """
        [chart_type, agg] = [inputs.get(p) for p in ["chart_type", "agg"]]
        show_input = show_input_handler(chart_type)

        y_multi_style = {"display": "block" if show_input("y", "multi") else "none"}
        y_single_style = {"display": "block" if show_input("y") else "none"}
        z_style = {"display": "block" if show_input("z") else "none"}
        group_style = {"display": "block" if show_input("group") else "none"}
        rolling_style = {"display": "inherit" if agg == "rolling" else "none"}
        cpg_style = {"display": "block" if show_chart_per_group(**inputs) else "none"}
        bar_style, barsort_style = bar_input_style(**inputs)
        yaxis_style = {"display": "block" if show_yaxis_ranges(**inputs) else "none"}

        data_id = get_data_id(pathname)
        df = global_state.get_data(data_id)
        animate_style, animate_by_style, animate_opts = animate_styles(df, **inputs)
        trendline_style = dict(display="block" if chart_type == "scatter" else "none")
        return (
            y_multi_style,
            y_single_style,
            z_style,
            group_style,
            rolling_style,
            cpg_style,
            bar_style,
            barsort_style,
            barsort_style,
            yaxis_style,
            animate_style,
            animate_by_style,
            animate_opts,
            trendline_style,
        )

    @dash_app.callback(
        Output("chart-input-data", "data"),
        [
            Input("cpg-toggle", "on"),
            Input("barmode-dropdown", "value"),
            Input("barsort-dropdown", "value"),
            Input("top-bars", "value"),
            Input("colorscale-picker", "colorscale"),
            Input("animate-toggle", "on"),
            Input("animate-by-dropdown", "value"),
            Input("trendline-dropdown", "value"),
            Input("yaxis-scale", "value"),
        ],
    )
    def chart_input_data(
        cpg,
        barmode,
        barsort,
        top_bars,
        colorscale,
        animate,
        animate_by,
        trendline,
        scale,
    ):
        """
        dash callback for maintaining selections in chart-formatting inputs
            - chart per group flag
            - bar chart mode
            - bar chart sorting
        """
        return dict(
            cpg=cpg,
            barmode=barmode,
            barsort=barsort,
            top_bars=top_bars,
            colorscale=colorscale,
            animate=animate,
            animate_by=animate_by,
            trendline=trendline,
            scale=scale,
        )

    @dash_app.callback(
        Output("load-btn", "style"),
        [
            Input("auto-load-toggle", "on"),
        ],
    )
    def load_style(auto_load):
        return dict(display="block" if not auto_load else "none")

    @dash_app.callback(
        [
            Output("chart-content", "children"),
            Output("last-chart-input-data", "data"),
            Output("range-data", "data"),
            Output("chart-code", "value"),
            Output("yaxis-type", "children"),
            Output("load-clicks", "data"),
        ],
        # Since we use the data prop in an output,
        # we cannot get the initial data on load with the data prop.
        # To counter this, you can use the modified_timestamp
        # as Input and the data as State.
        # This limitation is due to the initial None callbacks
        # https://github.com/plotly/dash-renderer/pull/81
        [
            Input("input-data", "modified_timestamp"),
            Input("chart-input-data", "modified_timestamp"),
            Input("yaxis-data", "modified_timestamp"),
            Input("map-input-data", "modified_timestamp"),
            Input("candlestick-input-data", "modified_timestamp"),
            Input("treemap-input-data", "modified_timestamp"),
            Input("load-btn", "n_clicks"),
        ],
        [
            State("url", "pathname"),
            State("input-data", "data"),
            State("chart-input-data", "data"),
            State("yaxis-data", "data"),
            State("map-input-data", "data"),
            State("candlestick-input-data", "data"),
            State("treemap-input-data", "data"),
            State("last-chart-input-data", "data"),
            State("auto-load-toggle", "on"),
            State("load-clicks", "data"),
        ],
    )
    def on_data(
        _ts1,
        _ts2,
        _ts3,
        _ts4,
        _ts5,
        _ts6,
        load,
        pathname,
        inputs,
        chart_inputs,
        yaxis_data,
        map_data,
        cs_data,
        treemap_data,
        last_chart_inputs,
        auto_load,
        prev_load_clicks,
    ):
        """
        dash callback controlling the building of dash charts
        """
        all_inputs = dict_merge(
            inputs,
            chart_inputs,
            dict(yaxis=yaxis_data or {}),
            map_data,
            cs_data,
            treemap_data,
        )
        if not auto_load and load == prev_load_clicks:
            raise PreventUpdate
        if all_inputs == last_chart_inputs:
            raise PreventUpdate
        if is_app_root_defined(dash_app.server.config.get("APPLICATION_ROOT")):
            all_inputs["app_root"] = dash_app.server.config["APPLICATION_ROOT"]
        charts, range_data, code = build_chart(get_data_id(pathname), **all_inputs)
        return (
            charts,
            all_inputs,
            range_data,
            "\n".join(make_list(code) + [CHART_EXPORT_CODE]),
            get_yaxis_type_tabs(make_list(inputs.get("y") or [])),
            load,
        )

    def get_default_range(range_data, y, max=False):
        if max:
            return next(
                iter(
                    sorted(
                        [range_data[y2] for y2 in y if y2 in range_data], reverse=True
                    )
                ),
                None,
            )
        return next(
            iter(sorted([range_data[y2] for y2 in y if y2 in range_data])), None
        )

    @dash_app.callback(
        [
            Output("yaxis-min-input", "value"),
            Output("yaxis-max-input", "value"),
            Output("yaxis-dropdown", "style"),
            Output("yaxis-min-label", "style"),
            Output("yaxis-min-input", "style"),
            Output("yaxis-max-label", "style"),
            Output("yaxis-max-input", "style"),
            Output("yaxis-type-div", "style"),
        ],
        [Input("yaxis-type", "value"), Input("yaxis-dropdown", "value")],
        [
            State("input-data", "data"),
            State("yaxis-data", "data"),
            State("range-data", "data"),
        ],
    )
    def yaxis_min_max_values(yaxis_type, yaxis, inputs, yaxis_inputs, range_data):
        """
        dash callback controlling values for selected y-axis in y-axis range editor
        """
        y = make_list(inputs.get("y"))
        dd_style = dict(
            display="block" if yaxis_type == "multi" and len(y) > 1 else "none"
        )
        type_style = (
            {"borderRadius": "0 0.25rem 0.25rem 0"} if yaxis_type == "default" else None
        )
        min_max_style = (
            "none"
            if (yaxis_type == "default") or (yaxis_type == "multi" and yaxis is None)
            else "block"
        )
        label_style = dict(display=min_max_style)
        input_style = {"lineHeight": "inherit", "display": min_max_style}
        curr_min, curr_max = (None, None)
        range_min, range_max = ((range_data or {}).get(p) or {} for p in ["min", "max"])
        if yaxis:
            curr_vals = (yaxis_inputs or {}).get("data", {}).get(yaxis) or {}
            curr_min = curr_vals.get("min") or range_min.get(yaxis)
            curr_max = curr_vals.get("max") or range_max.get(yaxis)
        elif yaxis_type == "single":
            curr_vals = (yaxis_inputs or {}).get("data", {}).get("all") or {}
            curr_min = curr_vals.get("min")
            if curr_min is None:
                curr_min = get_default_range(range_min, y)
            curr_max = curr_vals.get("max")
            if curr_max is None:
                curr_max = get_default_range(range_max, y, max=True)
        return (
            curr_min,
            curr_max,
            dd_style,
            label_style,
            input_style,
            label_style,
            input_style,
            type_style,
        )

    @dash_app.callback(
        Output("yaxis-data", "data"),
        [
            Input("yaxis-type", "value"),
            Input("yaxis-min-input", "value"),
            Input("yaxis-max-input", "value"),
        ],
        [
            State("yaxis-dropdown", "value"),
            State("yaxis-data", "data"),
            State("range-data", "data"),
            State("input-data", "data"),
        ],
    )
    def update_yaxis_data(
        yaxis_type, yaxis_min, yaxis_max, yaxis, yaxis_data, range_data, inputs
    ):
        """
        dash callback controlling updates to y-axis range state
        """
        yaxis_data = yaxis_data or dict(data={})
        yaxis_data["type"] = yaxis_type
        yaxis_name = "all" if yaxis_type == "single" else yaxis
        if yaxis_name == "all":
            y = make_list(inputs.get("y"))
            mins = range_data.get("min", {})
            maxs = range_data.get("max", {})
            range_min = get_default_range(mins, y)
            range_max = get_default_range(maxs, y, max=True)
        elif yaxis is None:
            raise PreventUpdate
        else:
            range_min, range_max = (
                range_data[p].get(yaxis_name) for p in ["min", "max"]
            )

        if yaxis_name in yaxis_data["data"]:
            if (yaxis_min, yaxis_max) == (range_min, range_max):
                del yaxis_data["data"][yaxis_name]
            else:
                yaxis_data["data"][yaxis_name] = dict(min=yaxis_min, max=yaxis_max)
        else:
            if (yaxis_min, yaxis_max) != (range_min, range_max):
                yaxis_data["data"][yaxis_name] = dict(min=yaxis_min, max=yaxis_max)
        return yaxis_data

    @dash_app.callback(
        [
            Output("group-type-input", "style"),
            Output("group-val-input", "style"),
            Output("bins-input", "style"),
            Output("main-inputs", "className"),
            Output("group-inputs-row", "style"),
        ],
        [
            Input("input-data", "modified_timestamp"),
            Input("map-input-data", "modified_timestamp"),
            Input("candlestick-input-data", "modified_timestamp"),
            Input("treemap-input-data", "modified_timestamp"),
        ],
        [
            State("url", "pathname"),
            State("input-data", "data"),
            State("map-input-data", "data"),
            State("candlestick-input-data", "data"),
            State("treemap-input-data", "data"),
        ],
    )
    def main_input_class(
        ts_, ts2_, _ts3, _ts4, pathname, inputs, map_inputs, cs_inputs, treemap_inputs
    ):
        return main_inputs_and_group_val_display(
            dict_merge(inputs, map_inputs, cs_inputs, treemap_inputs),
            get_data_id(pathname),
        )

    @dash_app.callback(
        [
            Output("group-val-dropdown", "options"),
            Output("group-val-dropdown", "value"),
        ],
        [
            Input("chart-tabs", "value"),
            Input("group-dropdown", "value"),
            Input("map-group-dropdown", "value"),
            Input("candlestick-group-dropdown", "value"),
            Input("treemap-group-dropdown", "value"),
        ],
        [
            State("url", "pathname"),
            State("input-data", "data"),
            State("group-val-dropdown", "value"),
        ],
    )
    def group_values(
        chart_type,
        group_cols,
        map_group_cols,
        cs_group_cols,
        treemap_group_cols,
        pathname,
        inputs,
        prev_group_vals,
    ):
        data_id = get_data_id(pathname)
        group_cols = group_cols
        if chart_type == "maps":
            group_cols = map_group_cols
        elif chart_type == "candlestick":
            group_cols = cs_group_cols
        elif chart_type == "treemap":
            group_cols = treemap_group_cols
        group_cols = make_list(group_cols)
        group_types = get_group_types(inputs, data_id, group_cols)
        if "groups" not in group_types:
            return [], None
        group_vals = run_query(
            global_state.get_data(data_id),
            inputs.get("query"),
            global_state.get_context_variables(data_id),
        )
        group_vals = build_group_val_options(group_vals, group_cols)
        selections = []
        available_vals = [gv["value"] for gv in group_vals]
        if prev_group_vals is not None:
            selections = [pgv for pgv in prev_group_vals if pgv in available_vals]
        if not len(selections) and len(group_vals) <= MAX_GROUPS:
            selections = available_vals
        return group_vals, selections

    @dash_app.callback(
        Output("popup-content", "children"),
        [Input("url", "pathname"), Input("url", "search")],
    )
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
        return charts_layout(df, settings, data_id, **params)

    custom_geojson.init_callbacks(dash_app)
    drilldown_modal.init_callbacks(dash_app)
    lock_zoom.init_callbacks(dash_app)
