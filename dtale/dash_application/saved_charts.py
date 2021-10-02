import dash_bootstrap_components as dbc
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

from dtale.charts.utils import ANIMATION_CHARTS, ANIMATE_BY_CHARTS, ZAXIS_CHARTS
from dtale.dash_application import dcc, html
from dtale.dash_application.charts import build_chart, valid_chart
from dtale.dash_application.layout.utils import build_hoverable
from dtale.utils import dict_merge, is_app_root_defined, flatten_lists, make_list
from dtale.translations import text

MAX_SAVED_CHARTS = 10
SAVED_CHART_IDS = list(range(1, MAX_SAVED_CHARTS + 1))


def build_layout():
    return flatten_lists(
        [
            [
                dcc.Store(id="saved-chart-config-{}".format(i)),
                dcc.Store(id="prev-saved-chart-config-{}".format(i)),
                dcc.Store(id="saved-deletes-{}".format(i), data=0),
                html.Div(
                    [
                        html.Div(
                            [
                                html.H3(
                                    "{} {}".format(text("Saved Chart"), i),
                                    className="col-auto pr-3",
                                ),
                                html.Div(
                                    id="saved-chart-header-{}".format(i),
                                    className="col pl-0",
                                ),
                                html.Div(
                                    dbc.Button(
                                        text("Delete"),
                                        id="delete-saved-btn-{}".format(i),
                                        color="primary",
                                        className="delete-chart",
                                    ),
                                    className="col-auto",
                                ),
                            ],
                            className="row",
                        ),
                        html.Div(id="saved-chart-{}".format(i)),
                    ],
                    id="saved-chart-div-{}".format(i),
                    className="saved-chart-div pt-5",
                    style=dict(display="none"),
                ),
            ]
            for i in SAVED_CHART_IDS
        ]
    )


def build_saved_header(config):
    chart_type = config["chart_type"]
    final_data = [
        ("Data ID", config["data_id"]),
        ("Query", config.get("query")),
        ("Chart Type", chart_type),
    ]
    if config.get("agg") not in [None, "raw"]:
        final_data.append(("Aggregation", config["agg"]))

    if chart_type == "maps":
        group_by = config["map_group"]
        map_type = config.get("map_type")
        if map_type == "scattergeo":
            map_props = ["map_type", "lat", "lon", "map_val", "scope", "proj"]
        elif map_type == "mapbox":
            map_props = ["map_type", "lat", "lon", "map_val", "mapbox_style"]
        else:
            map_props = ["map_type", "loc_mode", "loc", "map_val"]
            if config.get("loc_mode") == "geojson-id":
                map_props += ["geojson", "featureidkey"]
        for prop in map_props:
            final_data.append((prop, config.get(prop)))
    elif chart_type == "candlestick":
        group_by = config["cs_group"]
        for prop in ["cs_x", "cs_open", "cs_close", "cs_high", "cs_low"]:
            final_data.append((prop.split("_")[-1], config.get(prop)))
    elif chart_type == "treemap":
        group_by = config["treemap_group"]
        for prop in ["treemap_value", "treemap_label"]:
            final_data.append((prop.split("_")[-1], config.get(prop)))
    elif chart_type == "funnel":
        group_by = config["funnel_group"]
        for prop in ["funnel_value", "funnel_label"]:
            final_data.append((prop.split("_")[-1], config.get(prop)))
    elif chart_type == "clustergram":
        group_by = config["clustergram_group"]
        for prop in ["clustergram_value", "clustergram_label"]:
            final_data.append((prop.split("_")[-1], config.get(prop)))
    else:
        group_by = config.get("group")
        final_data.append(("X-Axis", config["x"]))
        y = make_list(config["y"])
        final_data.append(("Y-Axes" if len(y) > 1 else "Y-Axis", ",".join(y)))
        if chart_type in ZAXIS_CHARTS:
            final_data.append(("z", config.get("z")))
        if chart_type == "scatter" and config["trendline"]:
            final_data.append(("Trendline", "\u2714"))

    if group_by:
        final_data.append(("Group By", ", ".join(make_list(group_by))))
        group_type = config["group_type"]
        final_data.append(("Group Type", group_type))
        if group_type == "bins":
            final_data.append(("Bin Type", config["bin_type"]))
            final_data.append(("Bins", config["bin_val"]))
        else:
            final_data.append(
                ("Selected Groups", ", ".join(make_list(config["groups"])))
            )

    if config["cpg"]:
        final_data.append(("Chart Per Group", "\u2714"))
    if config["cpy"]:
        final_data.append(("Chart Per Y", "\u2714"))
    if chart_type in ANIMATION_CHARTS and config["animate"]:
        final_data.append(("Animate", "\u2714"))
    if chart_type in ANIMATE_BY_CHARTS and config["animate_by"]:
        final_data.append(("Animate By", ", ".join(make_list(config["animate_by"]))))

    return build_hoverable(
        html.I(className="ico-help-outline"),
        [
            html.B("Chart Configuration"),
            html.Ul(
                [
                    html.Li(
                        [html.B(text(prop)), html.Span(": {}".format(value))],
                        className="mb-0",
                    )
                    for prop, value in final_data
                    if value is not None
                ],
                className="mb-0",
            ),
        ],
        hover_class="saved-chart-config",
        top="unset",
    )


def init_callbacks(dash_app):
    def save_chart(*args):
        args = list(args)
        save_clicks = args.pop(0)
        current_deletes = [args.pop(0) or 0 for _ in range(MAX_SAVED_CHARTS)]
        inputs = args.pop(0)
        chart_inputs = args.pop(0)
        yaxis_data = args.pop(0)
        map_data = args.pop(0)
        cs_data = args.pop(0)
        treemap_data = args.pop(0)
        prev_save_clicks = args.pop(0)
        updated_configs = [args.pop(0) for _ in range(MAX_SAVED_CHARTS)]
        prev_deletes = [args.pop(0) or 0 for _ in range(MAX_SAVED_CHARTS)]

        delete_idx = None
        for i, (curr_delete, prev_delete) in enumerate(
            zip(current_deletes, prev_deletes)
        ):
            if curr_delete > prev_delete:
                delete_idx = i

        if delete_idx is None:
            if save_clicks == prev_save_clicks:
                raise PreventUpdate

            config = dict_merge(
                inputs,
                chart_inputs,
                dict(yaxis=yaxis_data or {}),
                map_data,
                cs_data,
                treemap_data,
            )

            if not valid_chart(**config):
                raise PreventUpdate

            for index, saved_config in enumerate(updated_configs):
                if saved_config is None:
                    updated_configs[index] = config
                    break
        else:
            updated_configs[delete_idx] = None

        return tuple([save_clicks] + updated_configs + current_deletes)

    def load_saved_chart(_ts, config, prev_config):
        if config == prev_config:
            raise PreventUpdate
        if config is None:
            return dict(display="none"), None, None, None
        if is_app_root_defined(dash_app.server.config.get("APPLICATION_ROOT")):
            config["app_root"] = dash_app.server.config["APPLICATION_ROOT"]
        charts, _, _ = build_chart(**config)
        return dict(display="block"), charts, config, build_saved_header(config)

    dash_app.callback(
        [Output("save-clicks", "data")]
        + [Output("saved-chart-config-{}".format(i), "data") for i in SAVED_CHART_IDS]
        + [Output("saved-deletes-{}".format(i), "data") for i in SAVED_CHART_IDS],
        [Input("save-btn", "n_clicks")]
        + [Input("delete-saved-btn-{}".format(i), "n_clicks") for i in SAVED_CHART_IDS],
        [
            State("input-data", "data"),
            State("chart-input-data", "data"),
            State("yaxis-data", "data"),
            State("map-input-data", "data"),
            State("candlestick-input-data", "data"),
            State("treemap-input-data", "data"),
            State("save-clicks", "data"),
        ]
        + [State("saved-chart-config-{}".format(i), "data") for i in SAVED_CHART_IDS]
        + [State("saved-deletes-{}".format(i), "data") for i in SAVED_CHART_IDS],
    )(save_chart)

    for i in SAVED_CHART_IDS:
        dash_app.callback(
            [
                Output("saved-chart-div-{}".format(i), "style"),
                Output("saved-chart-{}".format(i), "children"),
                Output("prev-saved-chart-config-{}".format(i), "data"),
                Output("saved-chart-header-{}".format(i), "children"),
            ],
            [Input("saved-chart-config-{}".format(i), "modified_timestamp")],
            [
                State("saved-chart-config-{}".format(i), "data"),
                State("prev-saved-chart-config-{}".format(i), "data"),
            ],
        )(load_saved_chart)
