import numpy as np
import pandas as pd

from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

import dtale.global_state as global_state
from dtale.charts.utils import AGGS
from dtale.dash_application.charts import (
    build_chart,
    bar_builder,
    build_axes,
    chart_builder_passthru,
)
from dtale.dash_application.layout.utils import (
    build_cols,
    build_option,
    build_selections,
)
from dtale.utils import (
    classify_type,
    dict_merge,
    find_dtype,
    is_app_root_defined,
    json_date,
    json_float,
    make_list,
    get_dtypes,
)
from dtale.query import build_query, run_query
from dtale.charts.utils import (
    MAX_GROUPS,
    ZAXIS_CHARTS,
    build_group_inputs_filter,
    convert_date_val_to_date,
)
from dtale.translations import text


def combine_inputs(dash_app, inputs, chart_inputs={}, yaxis_data={}, map_data={}):
    """
    Combines all managed state (inputs, chart inputs, map inputs & yaxis inputs) within Dash into one dictionary.
    """
    all_inputs = dict_merge(
        inputs, chart_inputs, dict(yaxis=yaxis_data or {}), map_data
    )
    if is_app_root_defined(dash_app.server.config.get("APPLICATION_ROOT")):
        all_inputs["app_root"] = dash_app.server.config["APPLICATION_ROOT"]
    return all_inputs


def build_histogram(data_id, col, query, point_filter):
    data = run_query(
        global_state.get_data(data_id),
        query,
        global_state.get_context_variables(data_id),
    )
    query, _ = build_group_inputs_filter(data, [point_filter])
    data = run_query(data, query)
    s = data[~pd.isnull(data[col])][col]
    hist_data, hist_labels = np.histogram(s, bins=10)
    hist_labels = list(map(lambda x: json_float(x, precision=3), hist_labels[1:]))
    axes_builder = build_axes(
        dict(
            data=dict(all=dict(Frequency=hist_data, Bins=hist_labels)),
            min=dict(Frequency=0),
            max=dict(Frequency=max(hist_data)),
        ),
        "Bins",
        dict(type="single", data={}),
    )
    hist_data = dict(data={"all": dict(x=hist_labels, Frequency=hist_data)})
    bars = bar_builder(
        hist_data,
        "Bins",
        ["Frequency"],
        axes_builder,
        chart_builder_passthru,
        modal=True,
    )
    bars.figure["layout"]["xaxis"]["type"] = "category"
    bars.figure["layout"]["title"]["text"] = "{} {} ({} {})".format(
        text("Histogram of"), col, len(s), text("data points")
    )
    return bars


def build_drilldown_title(data_id, all_inputs, click_point, props, val_prop):
    data = global_state.get_data(data_id)

    def _build_val(col, val):
        if classify_type(find_dtype(data[col])) == "D":
            return json_date(convert_date_val_to_date(val))
        return val

    if "text" in click_point:  # Heatmaps
        strs = []
        for dim in click_point["text"].split("<br>"):
            prop, val = dim.split(": ")
            strs.append("{} ({})".format(prop, val))
        return "{}: {}".format(text("Drilldown for"), ", ".join(strs))

    strs = []
    frame_col = all_inputs.get("animate_by")
    if frame_col:
        strs.append("{} ({})".format(frame_col, click_point.get("customdata")))
    for prop in props:
        prop = make_list(prop)
        val_key = prop[0]
        if click_point.get(val_key) is not None:
            col = make_list(all_inputs.get(prop[-1]))[0]
            strs.append(
                "{} ({})".format(col, _build_val(col, click_point.get(val_key)))
            )

    val_prop = make_list(val_prop)
    val_key = val_prop[0]
    val_col = make_list(all_inputs.get(val_prop[-1]))[0]
    agg = AGGS[all_inputs.get("agg") or "raw"]
    strs.append(
        "{} {} ({})".format(agg, val_col, _build_val(val_col, click_point.get(val_key)))
    )
    return "{}: {}".format(text("Drilldown for"), ", ".join(strs))


def init_callbacks(dash_app):
    def toggle_modal(close1, close2, click_data, is_open, inputs, drilldowns_on):
        if not drilldowns_on:
            raise PreventUpdate
        if (inputs.get("agg") or "raw") == "raw":
            raise PreventUpdate
        if close1 or close2 or click_data:
            return not is_open
        return is_open

    def build_x_dropdown(is_open, inputs, chart_inputs, yaxis_data, map_data):
        if not is_open:
            raise PreventUpdate
        data_id = inputs["data_id"]
        df = global_state.get_data(data_id)
        all_inputs = combine_inputs(
            dash_app, inputs, chart_inputs, yaxis_data, map_data
        )
        chart_type, x, y, z, group, map_val, animate_by = (
            all_inputs.get(p)
            for p in ["chart_type", "x", "y", "z", "group", "map_val", "animate_by"]
        )
        if chart_type == "maps":
            if all_inputs.get("map_type") == "choropleth":
                x = all_inputs["loc"]
            else:
                x = "lat_lon"
            x_options = build_selections(map_val, animate_by)
        else:
            x_options = build_selections(z or y, animate_by)
        col_opts = list(build_cols(df.columns, get_dtypes(df)))
        x_options = [build_option(c, l) for c, l in col_opts if c not in x_options]
        return x_options, x

    def update_click_data(
        click_data,
        inputs,
        chart_inputs,
        yaxis_data,
        map_data,
        current_click_data,
        drilldowns_on,
    ):
        if not drilldowns_on:
            raise PreventUpdate
        all_inputs = combine_inputs(
            dash_app, inputs, chart_inputs, yaxis_data, map_data
        )
        if (all_inputs.get("agg") or "raw") == "raw":
            raise PreventUpdate
        if not click_data:
            raise PreventUpdate
        data_id = inputs["data_id"]
        chart_type = all_inputs.get("chart_type")
        click_data = click_data or current_click_data
        click_point = next((p for p in click_data.get("points", [])), None)
        if chart_type == "maps":
            props = [["location", "loc"], "lat", "lon"]
            val = ["z", "map_val"]
        else:
            props = ["x"]
            val = "y"
            if click_point.get("z"):
                props = ["x", "y"]
                val = "z"

        header = build_drilldown_title(data_id, all_inputs, click_point, props, val)
        return click_data, header

    def load_drilldown_content(
        _click_data_ts,
        drilldown_type,
        drilldown_x,
        inputs,
        chart_inputs,
        yaxis_data,
        map_data,
        click_data,
        drilldowns_on,
    ):
        if not drilldowns_on:
            raise PreventUpdate
        data_id = inputs["data_id"]
        all_inputs = combine_inputs(
            dash_app, inputs, chart_inputs, yaxis_data, map_data
        )
        agg = all_inputs.get("agg") or "raw"
        chart_type = all_inputs.get("chart_type")
        frame_col = all_inputs.get("animate_by")
        all_inputs.pop("animate_by", None)
        if agg == "raw":
            raise PreventUpdate
        if drilldown_x is None and chart_type != "maps":
            raise PreventUpdate
        if click_data:
            click_point = next((p for p in click_data.get("points", [])), None)
            if click_point:
                curr_settings = global_state.get_settings(data_id) or {}
                query = build_query(
                    data_id, all_inputs.get("query") or curr_settings.get("query")
                )
                x_col = all_inputs.get("x")
                y_col = next((y2 for y2 in make_list(all_inputs.get("y"))), None)
                if chart_type in ZAXIS_CHARTS:
                    x, y, z, frame = (
                        click_point.get(p) for p in ["x", "y", "z", "customdata"]
                    )
                    if chart_type == "heatmap":
                        click_point_vals = {}
                        for dim in click_point["text"].split("<br>"):
                            prop, val = dim.split(": ")
                            click_point_vals[prop] = val
                        x, y, frame = (
                            click_point_vals.get(p) for p in [x_col, y_col, frame_col]
                        )
                    point_filter = {x_col: x, y_col: y}
                    if frame_col:
                        point_filter[frame_col] = frame
                    if drilldown_type == "histogram":
                        z_col = next(
                            (z2 for z2 in make_list(all_inputs.get("z"))), None
                        )
                        hist_chart = build_histogram(
                            data_id, z_col, query, point_filter
                        )
                        return hist_chart, dict(display="none")
                    else:
                        xy_query, _ = build_group_inputs_filter(
                            global_state.get_data(data_id),
                            [point_filter],
                        )
                        if not query:
                            query = xy_query
                        else:
                            query = "({}) and ({})".format(query, xy_query)
                        all_inputs["query"] = query
                        all_inputs["chart_type"] = drilldown_type
                        all_inputs["agg"] = "raw"
                        all_inputs["modal"] = True
                        all_inputs["x"] = drilldown_x
                        all_inputs["y"] = [all_inputs["z"]]
                        chart, _, _ = build_chart(**all_inputs)
                        return chart, None

                elif chart_type == "maps":
                    map_type = all_inputs.get("map_type")
                    point_filter = {}
                    if frame_col:
                        point_filter[frame_col] = click_point["customdata"]
                    if map_type == "choropleth":
                        point_filter[all_inputs["loc"]] = click_point["location"]
                    elif map_type == "scattergeo":
                        lat, lon = (click_point.get(p) for p in ["lat", "lon"])
                        point_filter[all_inputs["lat"]] = lat
                        point_filter[all_inputs["lon"]] = lon
                    map_val = all_inputs["map_val"]
                    if drilldown_type == "histogram":
                        hist_chart = build_histogram(
                            data_id, map_val, query, point_filter
                        )
                        return hist_chart, dict(display="none")
                    else:
                        map_query, _ = build_group_inputs_filter(
                            global_state.get_data(data_id),
                            [point_filter],
                        )
                        if not query:
                            query = map_query
                        else:
                            query = "({}) and ({})".format(query, map_query)
                        all_inputs["query"] = query
                        all_inputs["chart_type"] = drilldown_type
                        all_inputs["agg"] = "raw"
                        all_inputs["modal"] = True

                        data = global_state.get_data(data_id)
                        all_inputs["x"] = drilldown_x
                        x_style = None
                        if map_type != "choropleth":
                            all_inputs["x"] = "lat_lon"
                            lat, lon = (all_inputs.get(p) for p in ["lat", "lon"])
                            data.loc[:, "lat_lon"] = (
                                data[lat].astype(str) + "|" + data[lon].astype(str)
                            )
                            x_style = dict(display="none")
                        all_inputs["y"] = [map_val]
                        chart, _, _ = build_chart(data=data, **all_inputs)
                        return chart, x_style
                else:
                    x_filter = click_point.get("x")
                    point_filter = {x_col: x_filter}
                    if frame_col:
                        point_filter[frame_col] = click_point.get("customdata")
                    if drilldown_type == "histogram":
                        hist_chart = build_histogram(
                            data_id, y_col, query, point_filter
                        )
                        return hist_chart, dict(display="none")
                    else:
                        x_query, _ = build_group_inputs_filter(
                            global_state.get_data(data_id),
                            [point_filter],
                        )
                        if not query:
                            query = x_query
                        else:
                            query = "({}) and ({})".format(query, x_query)
                        all_inputs["query"] = query
                        all_inputs["chart_type"] = drilldown_type
                        all_inputs["agg"] = "raw"
                        all_inputs["modal"] = True
                        all_inputs["x"] = drilldown_x
                        chart, _, _ = build_chart(**all_inputs)
                        return chart, None
        return None, dict(display="none")

    for i in range(1, MAX_GROUPS + 1):
        dash_app.callback(
            Output("drilldown-modal-{}".format(i), "is_open"),
            [
                Input("close-drilldown-modal-{}".format(i), "n_clicks"),
                Input("close-drilldown-modal-header-{}".format(i), "n_clicks"),
                Input("chart-{}".format(i), "clickData"),
            ],
            [
                State("drilldown-modal-{}".format(i), "is_open"),
                State("input-data", "data"),
                State("drilldown-toggle", "on"),
            ],
        )(toggle_modal)
        dash_app.callback(
            [
                Output("chart-click-data-{}".format(i), "data"),
                Output("drilldown-modal-header-{}".format(i), "children"),
            ],
            [Input("chart-{}".format(i), "clickData")],
            [
                State("input-data", "data"),
                State("chart-input-data", "data"),
                State("yaxis-data", "data"),
                State("map-input-data", "data"),
                State("chart-click-data-{}".format(i), "data"),
                State("drilldown-toggle", "on"),
            ],
        )(update_click_data)
        dash_app.callback(
            [
                Output("drilldown-x-dropdown-{}".format(i), "options"),
                Output("drilldown-x-dropdown-{}".format(i), "value"),
            ],
            [Input("drilldown-modal-{}".format(i), "is_open")],
            [
                State("input-data", "data"),
                State("chart-input-data", "data"),
                State("yaxis-data", "data"),
                State("map-input-data", "data"),
            ],
        )(build_x_dropdown)
        dash_app.callback(
            [
                Output("drilldown-content-{}".format(i), "children"),
                Output("drilldown-x-input-{}".format(i), "style"),
            ],
            [
                Input("chart-click-data-{}".format(i), "modified_timestamp"),
                Input("drilldown-chart-type-{}".format(i), "value"),
                Input("drilldown-x-dropdown-{}".format(i), "value"),
            ],
            [
                State("input-data", "data"),
                State("chart-input-data", "data"),
                State("yaxis-data", "data"),
                State("map-input-data", "data"),
                State("chart-click-data-{}".format(i), "data"),
                State("drilldown-toggle", "on"),
            ],
        )(load_drilldown_content)
