import base64
import json
import pandas as pd

import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

from dtale.dash_application.layout.utils import build_input, build_option

CUSTOM_GEOJSON = []


def get_custom_geojson(geojson_id=None):
    global CUSTOM_GEOJSON

    if geojson_id is None:
        return CUSTOM_GEOJSON
    return next((ct for ct in CUSTOM_GEOJSON if ct["key"] == geojson_id), None)


def add_custom_geojson(geojson_key, geojson):
    global CUSTOM_GEOJSON

    suffix = 0
    while get_custom_geojson("{}{}".format(geojson_key, suffix or "")):
        suffix += 1

    geojson_key = "{}{}".format(geojson_key, suffix + 1 if suffix else "")
    geojson["key"] = geojson_key
    CUSTOM_GEOJSON.append(geojson)
    return geojson_key


def load_geojson(contents, filename):
    if contents is None and filename is None:
        return None
    if not filename.endswith(".json"):
        raise Exception("geojson files must be JSON!")
    _, content_string = contents.split(",")
    decoded = base64.b64decode(content_string)
    geojson = json.loads(decoded.decode("utf-8"))
    geojson_key = "".join(filename.split(".")[:-1])

    # get properties available to use for featureidkey
    data = dict(
        data=geojson, filename=filename, time=pd.Timestamp("now"), type=geojson["type"]
    )
    if data["type"] == "FeatureCollection":
        data["properties"] = sorted(geojson["features"][0]["properties"].keys())

    geojson_key = add_custom_geojson(geojson_key, data)
    return geojson_key


def build_geojson_upload(loc_mode, geojson_key=None, featureidkey=None):
    curr_geojson = get_custom_geojson(geojson_key)

    featureidkey_options = []
    featureidkey_value = featureidkey
    featureidkey_placeholder = "Select uploaded data"
    disabled = False
    if curr_geojson and not isinstance(curr_geojson, list):
        if curr_geojson.get("type") == "FeatureCollection":
            featureidkey_options = [
                build_option(fik) for fik in curr_geojson["properties"]
            ]
        else:
            featureidkey_value = None
            disabled = True
            featureidkey_placeholder = "id"

    return [
        html.Div(
            [
                html.Div(
                    [
                        dcc.Upload(
                            html.Div(
                                html.Span(
                                    html.Span(
                                        "Upload File", style=dict(whiteSpace="pre-line")
                                    ),
                                    className="input-group-addon d-block pt-1 pb-0 pointer",
                                ),
                                className="input-group mr-3",
                                id="upload-geojson-btn",
                            ),
                            id="upload-geojson",
                        ),
                    ],
                    className="col-auto",
                ),
                html.Div(id="output-geojson-upload", className="col mt-auto mb-auto"),
            ],
            className="row pb-5",
        ),
        html.Div(
            [
                build_input(
                    "geojson",
                    dcc.Dropdown(
                        id="geojson-dropdown",
                        options=[build_option(ct["key"]) for ct in CUSTOM_GEOJSON],
                        placeholder="Select uploaded data",
                        style=dict(width="inherit"),
                        value=geojson_key if loc_mode == "geojson-id" else None,
                    ),
                    className="col-md-6",
                    id="geojson-input",
                ),
                build_input(
                    "featureidkey",
                    dcc.Dropdown(
                        id="featureidkey-dropdown",
                        options=featureidkey_options,
                        placeholder=featureidkey_placeholder,
                        style=dict(width="inherit"),
                        disabled=disabled,
                        value=featureidkey_value,
                    ),
                    className="col-md-6",
                    id="featureidkey-input",
                ),
            ],
            className="row",
        ),
    ]


def build_modal(map_type, loc_mode):
    return html.Div(
        [
            html.Div(
                html.Span(
                    html.Span("GeoJSON Options", style=dict(whiteSpace="pre-line")),
                    className="input-group-addon d-block pt-1 pb-0 pointer",
                ),
                className="input-group mr-3",
                id="open-geojson-modal",
            ),
            dbc.Modal(
                [
                    dbc.ModalHeader("Custom GeoJSON Options"),
                    dbc.ModalBody(build_geojson_upload(loc_mode)),
                    dbc.ModalFooter(
                        dbc.Button(
                            "Close", id="close-geojson-modal", className="ml-auto"
                        )
                    ),
                ],
                id="geojson-modal",
                size="lg",
                centered=True,
            ),
        ],
        className="col-auto",
        style={}
        if map_type == "choropleth" and loc_mode == "geojson-id"
        else {"display": "none"},
        id="custom-geojson-input",
    )


def init_callbacks(dash_app):
    @dash_app.callback(
        [
            Output("output-geojson-upload", "children"),
            Output("geojson-dropdown", "options"),
        ],
        [Input("upload-geojson", "contents")],
        [State("upload-geojson", "filename")],
    )
    def update_geojson(contents, filename):
        if filename is None:
            raise PreventUpdate
        geojson_options = [build_option(ct["key"]) for ct in get_custom_geojson()]
        try:
            geojson_key = load_geojson(contents, filename)
            geojson_options.append(build_option(geojson_key))
            return "{} uploaded!".format(geojson_key), geojson_options
        except BaseException as ex:
            return str(ex), geojson_options

    @dash_app.callback(
        [
            Output("featureidkey-dropdown", "options"),
            Output("featureidkey-dropdown", "disabled"),
            Output("featureidkey-dropdown", "placeholder"),
        ],
        [Input("geojson-dropdown", "value")],
    )
    def update_featureidkey_options(geojson):
        geojson_data = get_custom_geojson(geojson)
        placeholder = "Select uploaded data"
        if geojson_data is None or isinstance(geojson_data, list):
            return [], False, placeholder
        disabled = geojson_data["type"] != "FeatureCollection"
        placeholder = "id" if disabled else placeholder
        if geojson_data and not disabled:
            return (
                [build_option(p) for p in geojson_data.get("properties", [])],
                disabled,
                placeholder,
            )
        return [], disabled, placeholder

    @dash_app.callback(
        Output("geojson-modal", "is_open"),
        [
            Input("open-geojson-modal", "n_clicks"),
            Input("close-geojson-modal", "n_clicks"),
        ],
        [State("geojson-modal", "is_open")],
    )
    def toggle_modal(n1, n2, is_open):
        if n1 or n2:
            return not is_open
        return is_open
