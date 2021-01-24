import json

import dash_bootstrap_components as dbc
import dash_colorscales as dcs
import dash_core_components as dcc
import dash_daq as daq
import dash_html_components as html
import plotly
from pkg_resources import parse_version

import dtale.dash_application.custom_geojson as custom_geojson
import dtale.global_state as global_state
from dtale.charts.utils import YAXIS_CHARTS, ZAXIS_CHARTS, find_group_vals
from dtale.dash_application.layout.utils import (
    build_input,
    build_option,
    build_tab,
    build_cols,
    build_selections,
    show_style,
    AGGS,
    FREQS,
    FREQ_LABELS,
)
from dtale.query import build_query, inner_build_query, run_query
from dtale.utils import (
    ChartBuildingError,
    classify_type,
    get_dtypes,
    is_app_root_defined,
    coord_type,
    make_list,
)


def test_plotly_version(version_num):
    if "unknown" in plotly.__version__:
        return True
    return parse_version(plotly.__version__) >= parse_version(version_num)


def base_layout(app_root, **kwargs):
    """
    Base layout to be returned by :meth:`dtale.dash_application.views.DtaleDash.interpolate_index`

    :param kwargs: Optional keyword arguments to be passed to 'dash.Dash.interplolate_index'
    :type kwargs: dict
    :return: HTML
    :rtype: str
    """
    webroot_html = ""
    favicon_path = "../../dtale/static/images/favicon.png"
    if is_app_root_defined(app_root):
        webroot_html = """
        <script type="text/javascript">
            window.resourceBaseUrl = '{app_root}';
        </script>
        """.format(
            app_root=app_root
        )
        favicon_path = "{}/dtale/static/images/favicon.png".format(app_root)
    return """
        <!DOCTYPE html>
        <html>
            <head>
                {webroot_html}
                {metas}
                <title>D-Tale Charts</title>
                <link rel="shortcut icon" href="{favicon_path}">
                {css}
            </head>
            <body>
                <div class="container-fluid charts">
                    <div class="row" style="margin: 0">
                        <div class="col-auto">
                            <header>
                                <span class="title-font">D-TALE</span>
                                <span style="font-size: 16px" class="pl-4">Charts</span>
                            </header>
                        </div>
                        <div class="col"></div>
                        <div class="col-auto mt-4">
                            <a href="#" onclick="javascript:backToData()">
                                <i class="fas fa-th mr-4"></i>
                                <span>Back To Data</span>
                            </a>
                        </div>
                    </div>
                    {app_entry}
                </div>
                <footer>
                    {config}
                    {scripts}
                    <script type="text/javascript">
                        const pathSegs = window.location.pathname.split('/');
                        const dataId = pathSegs[pathSegs.length - 1];
                        const backToData = () => window.open('{app_root}/dtale/main/' + dataId);
                    </script>
                    {renderer}
                    {css}
                </footer>
            </body>
        </html>
    """.format(
        metas=kwargs["metas"],
        css=kwargs["css"],
        app_entry=kwargs["app_entry"],
        config=kwargs["config"],
        scripts=kwargs["scripts"],
        renderer=kwargs["renderer"],
        webroot_html=webroot_html,
        app_root=app_root if is_app_root_defined(app_root) else "",
        favicon_path=favicon_path,
    )


CHARTS = [
    dict(value="line"),
    dict(value="bar"),
    dict(value="scatter"),
    dict(value="pie"),
    dict(value="wordcloud"),
    dict(value="heatmap"),
    dict(value="3d_scatter", label="3D Scatter"),
    dict(value="surface"),
    dict(value="maps", label="Maps"),
    dict(value="candlestick"),
    dict(value="treemap"),
]
CHART_INPUT_SETTINGS = {
    "line": dict(
        x=dict(type="single"),
        y=dict(type="multi"),
        z=dict(display=False),
        group=dict(display=True, type="single"),
    ),
    "bar": dict(
        x=dict(type="single"),
        y=dict(type="multi"),
        z=dict(display=False),
        group=dict(display=True, type="single"),
    ),
    "scatter": dict(
        x=dict(type="single"),
        y=dict(type="multi"),
        z=dict(display=False),
        group=dict(display=True, type="single"),
    ),
    "pie": dict(
        x=dict(type="single"),
        y=dict(type="multi"),
        z=dict(display=False),
        group=dict(display=True, type="single"),
    ),
    "wordcloud": dict(
        x=dict(type="single"),
        y=dict(type="multi"),
        z=dict(display=False),
        group=dict(display=True, type="single"),
    ),
    "heatmap": dict(
        x=dict(type="single"),
        y=dict(type="single"),
        z=dict(display=True, type="single"),
        group=dict(display=False),
    ),
    "3d_scatter": dict(
        x=dict(type="single"),
        y=dict(type="single"),
        z=dict(display=True, type="single"),
        group=dict(display=True),
    ),
    "surface": dict(
        x=dict(type="single"),
        y=dict(type="single"),
        z=dict(display=True, type="single"),
        group=dict(display=False),
    ),
    "maps": dict(
        x=dict(display=False),
        y=dict(display=False),
        z=dict(display=False),
        group=dict(display=False),
        map_group=dict(display=True),
    ),
    "candlestick": dict(
        x=dict(display=False),
        y=dict(display=False),
        z=dict(display=False),
        group=dict(display=False),
        map_group=dict(display=False),
        cs_group=dict(display=True),
    ),
    "treemap": dict(
        x=dict(display=False),
        y=dict(display=False),
        z=dict(display=False),
        group=dict(display=False),
        map_group=dict(display=False),
        cs_group=dict(display=False),
        treemap_group=dict(display=True),
    ),
}

MAP_TYPES = [
    dict(value="choropleth", image=True),
    dict(value="scattergeo", label="ScatterGeo", image=True),
    dict(value="mapbox", label="Detailed", image=True),
]
SCOPES = ["world", "usa", "europe", "asia", "africa", "north america", "south america"]
PROJECTIONS = [
    "equirectangular",
    "mercator",
    "orthographic",
    "natural earth",
    "kavrayskiy7",
    "miller",
    "robinson",
    "eckert4",
    "azimuthal equal area",
    "azimuthal equidistant",
    "conic equal area",
    "conic conformal",
    "conic equidistant",
    "gnomonic",
    "stereographic",
    "mollweide",
    "hammer",
    "transverse mercator",
    "albers usa",
    "winkel tripel",
    "aitoff",
    "sinusoidal",
]

AUTO_LOAD_MSG = (
    "By default, the chart builder will try to build a chart everytime you change your chart settings. If you "
    "toggle off 'Auto-Load' then you can change the settings as much as you like without triggering a chart build. "
    "In order to trigger a chart build with 'Auto-Load' off you must click the 'Load' button."
)

BIN_TYPE_MSG = [
    html.Div(
        [
            html.H3("Bin Types", style=dict(display="inline"), className="pr-3"),
            html.A(
                "(Binning in Data Mining)",
                href="https://www.geeksforgeeks.org/binning-in-data-mining/",
            ),
            html.Br(),
        ]
    ),
    html.Ul(
        [
            html.Li(
                [
                    html.B("Equal Width"),
                    html.Span(": the bins are of equal sized ranges"),
                ],
                className="mb-0",
            ),
            html.Li(
                [
                    html.B("Equal Frquency"),
                    html.Span(": the bins contain an equal amount of values"),
                ],
                className="mb-0",
            ),
        ],
        className="mb-0",
    ),
]


def build_img_src(proj, img_type="projections"):
    return "../static/images/{}/{}.png".format(img_type, "_".join(proj.split(" ")))


def build_proj_hover_children(proj):
    if proj is None:
        return None
    return [
        html.I(className="ico-help-outline", style=dict(color="white")),
        html.Div(
            [html.Div(proj), html.Img(src=build_img_src(proj))],
            className="hoverable__content",
            style=dict(width="auto"),
        ),
    ]


def build_proj_hover(proj):
    return html.Span(
        [
            "Projection",
            html.Div(
                build_proj_hover_children(proj),
                className="ml-3 hoverable",
                style=dict(display="none")
                if proj is None
                else dict(borderBottom="none"),
                id="proj-hover",
            ),
        ],
        className="input-group-addon",
    )


def build_mapbox_token_children():
    from dtale.charts.utils import get_mapbox_token

    msg = "To access additional styles enter a token here..."
    if get_mapbox_token() is None:
        msg = "Change your token here..."
    return [
        html.I(className="ico-help-outline", style=dict(color="white")),
        html.Div(
            [
                html.Span("Mapbox Access Token:"),
                dcc.Input(
                    id="mapbox-token-input",
                    type="text",
                    placeholder=msg,
                    className="form-control",
                    value="",
                    style={"lineHeight": "inherit"},
                ),
            ],
            className="hoverable__content",
            style=dict(width="20em", right="-1.45em"),
        ),
    ]


def build_mapbox_token_hover():
    return html.Span(
        [
            "Style",
            html.Div(
                build_mapbox_token_children(),
                className="ml-3 hoverable",
                style=dict(borderBottom="none"),
                id="token-hover",
            ),
        ],
        className="input-group-addon",
    )


LOC_MODE_INFO = {
    "ISO-3": dict(
        url=html.A(
            "ISO-3",
            href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3",
            target="_blank",
        ),
        examples=["USA (United States)", "CAN (Canada)", "GBR (United Kingdom)"],
    ),
    "USA-states": dict(
        url=html.A(
            "USA-states (use ISO)",
            href="https://en.wikipedia.org/wiki/List_of_U.S._state_abbreviations",
            target="_blank",
        ),
        examples=["NY (New York)", "CA (California)", "MA (Massachusetts)"],
    ),
    "country names": dict(
        url=html.A(
            "country names (case-insensitive)",
            href="https://simple.wikipedia.org/wiki/List_of_countries",
            target="_blank",
        ),
        examples=["United States", "United Kingdom", "Germany"],
    ),
    "geojson-id": dict(label="Custom GeoJSON", desc="Load custom geojson into D-Tale"),
}


def build_loc_mode_hover_children(loc_mode):
    if loc_mode is None:
        return None
    loc_mode_cfg = LOC_MODE_INFO[loc_mode]
    url, examples, desc = (loc_mode_cfg.get(p) for p in ["url", "examples", "desc"])
    body = []
    if url is not None:
        body.append(
            html.Div([html.Span("View", className="mr-3"), loc_mode_cfg["url"]])
        )
    if examples is not None:
        body.append(
            html.Ul(
                [
                    html.Li(e, style={"listStyleType": "disc"}, className="mb-3")
                    for e in loc_mode_cfg["examples"]
                ],
                className="pt-3 mb-0",
            )
        )
    if desc is not None:
        body.append(html.Span(desc))
    return [
        html.I(className="ico-help-outline", style=dict(color="white")),
        html.Div(
            body,
            className="hoverable__content build-code",
            style=dict(width="auto", whiteSpace="nowrap", left="-2em", top="auto"),
        ),
    ]


def build_loc_mode_hover(loc_mode):
    return html.Span(
        [
            html.Span("Location Mode", style=dict(whiteSpace="pre-line")),
            html.Div(
                build_loc_mode_hover_children(loc_mode),
                className="ml-3 hoverable",
                style=dict(display="none")
                if loc_mode is None
                else dict(borderBottom="none"),
                id="loc-mode-hover",
            ),
        ],
        className="input-group-addon pt-1 pb-0",
    )


JET = ["#000083", "#003CAA", "#05FFFF", "#FFFF00", "#FA0000", "#800000"]
REDS = ["#fff5f0", "#fdcab4", "#fc8a6a", "#f24632", "#bc141a", "#67000d"]
YLORRD = [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#bd0026",
    "#800026",
]
YLGRBL = ["#ffffd9", "#d5efb3", "#73c9bc", "#1b99c2", "#1c4ea2", "#081d58"]
DEFAULT_CSALES = {"heatmap": JET, "maps": REDS, "3d_Scatter": YLORRD, "surface": YLGRBL}
ANIMATION_CHARTS = ["line"]
ANIMATE_BY_CHARTS = ["bar", "3d_scatter", "heatmap", "maps"]


def show_input_handler(chart_type):
    settings = CHART_INPUT_SETTINGS.get(chart_type or "line") or {}

    def _show_input(input_id, input_type="single"):
        cfg = settings.get(input_id, {})
        return cfg.get("display", True) and cfg.get("type", "single") == input_type

    return _show_input


def get_group_types(inputs, data_id, group_cols=None):
    def _flags(group_prop):
        final_group_cols = group_cols or make_list(inputs.get(group_prop))
        if len(final_group_cols):
            for dtype_info in global_state.get_dtypes(data_id):
                if dtype_info["name"] in final_group_cols:
                    classifier = classify_type(dtype_info["dtype"])
                    if classifier == "F":
                        return ["bins"]
                    if classifier == "I":
                        return ["groups", "bins"]
        return []

    chart_type = inputs.get("chart_type")

    if show_input_handler(chart_type)("group"):
        return _flags("group")
    elif show_input_handler(chart_type)("map_group"):
        return _flags("map_group")
    elif show_input_handler(chart_type)("cs_group"):
        return _flags("cs_group")
    elif show_input_handler(chart_type)("treemap_group"):
        return _flags("treemap_group")
    return False, False


def update_label_for_freq(val):
    """
    Formats sub-values contained within 'val' to display date frequencies if included.
        - (val=['a', 'b', 'c']) => 'a, b, c'
        - (val=['a|H', 'b', 'c']) => 'a (Hour), b, c'
    """

    def _freq_handler(sub_val):
        for freq in FREQS:
            if sub_val.endswith("|{}".format(freq)):
                col, freq = sub_val.split("|")
                if freq in FREQ_LABELS:
                    return "{} ({})".format(col, FREQ_LABELS[freq])
                return col
        return sub_val

    return ", ".join([_freq_handler(sub_val) for sub_val in make_list(val)])


def build_error(error, tb):
    """
    Returns error/traceback information in standard component with styling

    :param error: execption message
    :type error: str
    :param tb: tracebackF
    :type tb: str
    :return: error component
    :rtype: :dash:`dash_html_components.Div <dash-html-components/div>`
    """
    if isinstance(error, ChartBuildingError):
        if error.details:
            tb = error.details
        error = error.error
    return html.Div(
        [
            html.I(className="ico-error"),
            html.Span(str(error)),
            html.Div(html.Pre(str(tb)), className="traceback"),
        ],
        className="dtale-alert alert alert-danger",
    )


def build_input_options(df, **inputs):
    """
    Builds dropdown options for (X, Y, Z, Group, Barsort & Y-Axis Ranges) with filtering based on currently selected
    values for the following inputs: x, y, z, group.
    """
    chart_type, x, y, z, group = (
        inputs.get(p) for p in ["chart_type", "x", "y", "z", "group"]
    )
    col_opts = list(build_cols(df.columns, get_dtypes(df)))
    group_val, z_val = (None, z) if chart_type in ZAXIS_CHARTS else (group, None)
    x_options = [
        build_option(c, l)
        for c, l in col_opts
        if c not in build_selections(y, z_val, group_val)
    ]
    y_filter = build_selections(x, group_val, z_val)
    y_multi_options = [build_option(c, l) for c, l in col_opts if c not in y_filter]
    y_single_options = [build_option(c, l) for c, l in col_opts if c not in y_filter]
    z_options = [
        build_option(c)
        for c in df.columns
        if c not in build_selections(x, y, group_val)
    ]
    group_options = [
        build_option(c, l)
        for c, l in col_opts
        if c not in build_selections(x, y, z_val)
    ]
    barsort_options = [build_option(o) for o in build_selections(x, y)]
    yaxis_options = [build_option(y2) for y2 in y or []]

    return (
        x_options,
        y_multi_options,
        y_single_options,
        z_options,
        group_options,
        barsort_options,
        yaxis_options,
    )


def build_map_options(
    df, type="choropleth", loc=None, lat=None, lon=None, map_val=None
):
    dtypes = get_dtypes(df)
    cols = sorted(dtypes.keys())
    lat_cols, lon_cols, str_cols, num_cols = [], [], [], []
    for c in cols:
        dtype = dtypes[c]
        classification = classify_type(dtype)
        if classification == "S":
            str_cols.append(c)
            continue
        if classification in ["F", "I"]:
            num_cols.append(c)
            coord = coord_type(df[c])
            if coord == "lat":
                lat_cols.append(c)
            elif coord == "lon":
                lon_cols.append(c)

    lat_options = [
        build_option(c) for c in lat_cols if c not in build_selections(lon, map_val)
    ]
    lon_options = [
        build_option(c) for c in lon_cols if c not in build_selections(lat, map_val)
    ]
    loc_options = [
        build_option(c) for c in str_cols if c not in build_selections(map_val)
    ]

    if type == "choropleth":
        val_options = [
            build_option(c) for c in num_cols if c not in build_selections(loc)
        ]
    else:
        val_options = [
            build_option(c) for c in num_cols if c not in build_selections(lon, lat)
        ]
    return loc_options, lat_options, lon_options, val_options


def build_candlestick_options(
    df, cs_x=None, cs_open=None, cs_close=None, cs_high=None, cs_low=None
):
    dtypes = get_dtypes(df)
    cols = sorted(dtypes.keys())
    num_cols, x_cols = [], []
    for c in cols:
        dtype = dtypes[c]
        classification = classify_type(dtype)
        if classification in ["S", "D"]:
            x_cols.append(c)
        if classification in ["F", "I"]:
            num_cols.append(c)

    x_options = [build_option(c) for c in x_cols]
    close_options = [
        build_option(c)
        for c in num_cols
        if c not in build_selections(cs_x, cs_open, cs_low, cs_high)
    ]
    open_options = [
        build_option(c)
        for c in num_cols
        if c not in build_selections(cs_x, cs_close, cs_low, cs_high)
    ]
    low_options = [
        build_option(c)
        for c in num_cols
        if c not in build_selections(cs_x, cs_open, cs_close, cs_high)
    ]
    high_options = [
        build_option(c)
        for c in num_cols
        if c not in build_selections(cs_x, cs_open, cs_close, cs_low)
    ]
    return x_options, close_options, open_options, low_options, high_options


def build_treemap_options(df, treemap_value=None, treemap_label=None):
    dtypes = get_dtypes(df)
    cols = sorted(dtypes.keys())
    num_cols = []
    for c in cols:
        dtype = dtypes[c]
        classification = classify_type(dtype)
        if classification in ["F", "I"]:
            num_cols.append(c)

    value_options = [
        build_option(c) for c in num_cols if c not in build_selections(treemap_label)
    ]
    label_options = [
        build_option(c) for c in cols if c not in build_selections(treemap_value)
    ]
    return value_options, label_options


def build_mapbox_style_options():
    from dtale.charts.utils import get_mapbox_token

    free_styles = [
        "open-street-map",
        "carto-positron",
        "carto-darkmatter",
        "stamen-terrain",
        "stamen-toner",
        "stamen-watercolor",
    ]
    token_styles = [
        "basic",
        "streets",
        "outdoors",
        "light",
        "dark",
        "satellite",
        "satellite-streets",
    ]
    styles = free_styles
    if get_mapbox_token() is not None:
        styles += token_styles
    return [build_option(v) for v in styles]


def bar_input_style(**inputs):
    """
    Sets display CSS property for bar chart inputs
    """
    chart_type, group_col = (inputs.get(p) for p in ["chart_type", "group"])
    show_bar = chart_type == "bar"
    show_barsort = show_bar and group_col is None
    return (
        dict(display="block" if show_bar else "none"),
        dict(display="block" if show_barsort else "none"),
    )


def colorscale_input_style(**inputs):
    return dict(
        display="block"
        if inputs.get("chart_type") in ["heatmap", "maps", "3d_scatter", "surface"]
        else "none"
    )


def animate_styles(df, **inputs):
    chart_type, agg, cpg = (inputs.get(p) for p in ["chart_type", "agg", "cpg"])
    opts = []
    if cpg or agg in ["pctsum", "pctct"]:
        return dict(display="none"), dict(display="none"), opts
    if chart_type in ANIMATION_CHARTS:
        return dict(display="block"), dict(display="none"), opts
    if chart_type in ANIMATE_BY_CHARTS:
        opts = [build_option(v, l) for v, l in build_cols(df.columns, get_dtypes(df))]
    if len(opts):
        return dict(display="none"), dict(display="block"), opts
    return dict(display="none"), dict(display="none"), []


def lock_zoom_style(chart_type):
    return (
        dict(display="block", textTransform="none")
        if chart_type in ["3d_scatter", "surface"]
        else dict(display="none")
    )


def show_chart_per_group(**inputs):
    """
    Boolean function to determine whether "Chart Per Group" toggle should be displayed or not
    """
    [chart_type, group] = [inputs.get(p) for p in ["chart_type", "group"]]
    invalid_type = chart_type in ["pie", "wordcloud", "maps"]
    return (
        show_input_handler(chart_type)("group")
        and len(group or [])
        and not invalid_type
    )


def show_yaxis_ranges(**inputs):
    """
    Boolean function to determine whether "Y-Axis Range" inputs should be displayed or not
    """
    chart_type, y = (inputs.get(p) for p in ["chart_type", "y"])
    return chart_type in YAXIS_CHARTS and len(y or [])


def get_yaxis_type_tabs(y):
    tabs = [
        build_tab("Default", "default", {"padding": "2px", "minWidth": "4em"}),
        build_tab("Single", "single", {"padding": "2px", "minWidth": "4em"}),
    ]
    if len(y) <= 1:
        return tabs
    return tabs + [build_tab("Multi", "multi", {"padding": "2px", "minWidth": "4em"})]


def build_group_val_options(df, group_cols):
    group_vals = find_group_vals(df, group_cols)
    return [
        build_option(
            json.dumps(gv), "|".join([str(gv.get(p, "NaN")) for p in group_cols])
        )
        for gv in group_vals
    ]


def build_map_type_tabs(map_type):
    def _build_map_type_hoverable():
        for t in MAP_TYPES:
            if t.get("image", False):
                yield html.Div(
                    [
                        html.Span(t.get("label", t["value"].capitalize())),
                        html.Img(src=build_img_src(t["value"], img_type="map_type")),
                    ],
                    className="col-md-4",
                )

    return html.Div(
        [
            dcc.Tabs(
                id="map-type-tabs",
                value=map_type or "choropleth",
                children=[
                    build_tab(t.get("label", t["value"].capitalize()), t["value"])
                    for t in MAP_TYPES
                ],
                style=dict(height="36px"),
            ),
            html.Div(
                html.Div(list(_build_map_type_hoverable()), className="row"),
                className="hoverable__content map-types",
            ),
        ],
        style=dict(paddingLeft=15, borderBottom="none", width="20em"),
        className="hoverable",
    )


def build_hoverable(content, hoverable_content, hover_class="map-types", top="50%"):
    return html.Div(
        [
            content,
            html.Div(
                hoverable_content,
                className="hoverable__content {}".format(hover_class),
                style=dict(top=top),
            ),
        ],
        style=dict(borderBottom="none"),
        className="hoverable",
    )


def main_inputs_and_group_val_display(inputs, data_id):
    group_types = get_group_types(inputs, data_id)
    if len(group_types):
        is_groups = "groups" in group_types and inputs.get("group_type") == "groups"
        is_bins = "bins" in group_types and inputs.get("group_type") == "bins"
        return (
            dict(display="block" if len(group_types) > 1 else "none"),
            dict(display="block" if is_groups else "none"),
            dict(display="block" if is_bins else "none"),
            "col-md-8",
            dict(display="block"),
        )
    return (
        dict(display="none"),
        dict(display="none"),
        dict(display="none"),
        "col-md-12",
        dict(display="none"),
    )


def build_slider_counts(df, data_id, query_value):
    record_ct = len(
        run_query(
            df,
            build_query(data_id, query_value),
            global_state.get_context_variables(data_id),
        )
    )
    slider_counts = {
        v * 20: {"label": "{}% ({:,.0f})".format(v * 20, (v * 2) / 10 * record_ct)}
        for v in range(1, 6)
    }
    slider_counts[100]["style"] = {"white-space": "nowrap"}
    return slider_counts


def charts_layout(df, settings, data_id, **inputs):
    """
    Builds main dash inputs with dropdown options populated with the columns of the dataframe associated with the
    page. Inputs included are: chart tabs, query, x, y, z, group, aggregation, rolling window/computation,
    chart per group toggle, bar sort, bar mode, y-axis range editors

    :param df: dataframe to drive the charts built on page
    :type df: :class:`pandas:pandas.DataFrame`
    :param settings: global settings associated with this dataframe (contains properties like "query")
    :type param: dict
    :param data_id: identifier for the data we are viewing
    :type data_id: string
    :return: dash markup
    """
    chart_type, x, y, z, group, agg, load = (
        inputs.get(p) for p in ["chart_type", "x", "y", "z", "group", "agg", "load"]
    )
    y = y or []
    show_input = show_input_handler(chart_type)
    show_cpg = show_chart_per_group(**inputs)
    show_yaxis = show_yaxis_ranges(**inputs)
    scatter_input = dict(display="block" if chart_type == "scatter" else "none")
    bar_style, barsort_input_style = bar_input_style(**inputs)
    animate_style, animate_by_style, animate_opts = animate_styles(df, **inputs)

    options = build_input_options(df, **inputs)
    (
        x_options,
        y_multi_options,
        y_single_options,
        z_options,
        group_options,
        barsort_options,
        yaxis_options,
    ) = options
    query_placeholder = "Enter pandas query (ex: col1 == 1)"
    query_value = inputs.get("query") or inner_build_query(
        settings, settings.get("query")
    )

    query_label = html.Div(
        [
            html.Span("Query"),
            html.A(
                html.I(className="fa fa-info-circle ml-4"),
                href="https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query",
                target="_blank",
                style={"color": "white"},
            ),
        ],
        className="input-group-addon",
        style={"minWidth": "7em"},
    )
    yaxis_type = (inputs.get("yaxis") or {}).get("type") or "default"
    yaxis_type_style = (
        {"borderRadius": "0 0.25rem 0.25rem 0"} if yaxis_type == "default" else None
    )
    show_map = chart_type == "maps"
    map_props = ["map_type", "loc_mode", "loc", "lat", "lon", "map_val"]
    map_type, loc_mode, loc, lat, lon, map_val = (inputs.get(p) for p in map_props)
    map_scope, proj, mapbox_style = (
        inputs.get(p) for p in ["scope", "proj", "mapbox_style"]
    )
    loc_options, lat_options, lon_options, map_val_options = build_map_options(
        df, type=map_type, loc=loc, lat=lat, lon=lon, map_val=map_val
    )
    show_candlestick = chart_type == "candlestick"
    cs_props = ["cs_x", "cs_open", "cs_close", "cs_high", "cs_low", "cs_group"]
    cs_x, cs_open, cs_close, cs_high, cs_low, cs_group = (
        inputs.get(p) for p in cs_props
    )
    (
        cs_x_options,
        open_options,
        close_options,
        high_options,
        low_options,
    ) = build_candlestick_options(
        df,
        cs_x=cs_x,
        cs_open=cs_open,
        cs_close=cs_close,
        cs_high=cs_high,
        cs_low=cs_low,
    )
    show_treemap = chart_type == "treemap"
    treemap_props = ["treemap_value", "treemap_label", "treemap_group"]
    treemap_value, treemap_label, treemap_group = (inputs.get(p) for p in treemap_props)
    (treemap_value_options, treemap_label_options,) = build_treemap_options(
        df,
        treemap_value=treemap_value,
        treemap_label=treemap_label,
    )
    cscale_style = colorscale_input_style(**inputs)
    default_cscale = DEFAULT_CSALES.get(chart_type, REDS)

    (
        group_type_style,
        group_val_style,
        bins_style,
        main_input_class,
        show_groups,
    ) = main_inputs_and_group_val_display(inputs, data_id)
    group_val = [json.dumps(gv) for gv in inputs.get("group_val") or []]

    def show_map_style(show):
        return {} if show else {"display": "none"}

    body_items = [
        dcc.Store(id="query-data", data=inputs.get("query")),
        dcc.Store(
            id="input-data",
            data={
                k: v
                for k, v in inputs.items()
                if k not in ["cpg", "barmode", "barsort"]
            },
        ),
        dcc.Store(
            id="chart-input-data",
            data={
                k: v for k, v in inputs.items() if k in ["cpg", "barmode", "barsort"]
            },
        ),
        dcc.Store(
            id="map-input-data",
            data={
                k: v
                for k, v in inputs.items()
                if k
                in [
                    "map_type",
                    "map_code",
                    "loc_mode",
                    "lat",
                    "lon",
                    "map_val",
                    "scope",
                    "proj",
                ]
            },
        ),
        dcc.Store(
            id="candlestick-input-data",
            data={
                k: v
                for k, v in inputs.items()
                if k in ["cs_x", "cs_open", "cs_close", "cs_high", "cs_low", "cs_group"]
            },
        ),
        dcc.Store(
            id="treemap-input-data",
            data={
                k: v
                for k, v in inputs.items()
                if k in ["treemap_value", "treemap_label", "treemap_group"]
            },
        ),
        dcc.Store(id="range-data"),
        dcc.Store(id="yaxis-data", data=inputs.get("yaxis")),
        dcc.Store(id="last-chart-input-data", data=inputs),
        dcc.Store(id="load-clicks", data=0),
        dcc.Input(id="chart-code", type="hidden"),
        html.Div(
            html.Div(
                dcc.Tabs(
                    id="chart-tabs",
                    value=chart_type or "line",
                    children=[
                        build_tab(t.get("label", t["value"].capitalize()), t["value"])
                        for t in CHARTS
                    ],
                    style=dict(height="36px"),
                ),
                className="col-md-12",
            ),
            className="row pt-3 pb-3 charts-filters",
        ),
        html.Div(
            html.Div(
                [
                    html.Div(
                        [
                            query_label,
                            dcc.Input(
                                id="query-input",
                                type="text",
                                placeholder=query_placeholder,
                                className="form-control",
                                value=query_value,
                                style={"lineHeight": "inherit"},
                            ),
                        ],
                        className="input-group mr-3",
                    )
                ],
                className="col",
            ),
            className="row pt-3 pb-3 charts-filters",
        ),
        html.Div(
            html.Div(
                [
                    html.Div(
                        [
                            build_hoverable(
                                html.Span("Load"),
                                html.Span(
                                    "Load a random percentage of rows from your dataset."
                                ),
                            ),
                            dcc.Slider(
                                id="load-input",
                                min=10,
                                max=100,
                                step=10,
                                value=100 if load is None else load,
                                className="w-100",
                                marks=build_slider_counts(df, data_id, query_value),
                                tooltip={
                                    "always_visible": False,
                                    "placement": "left",
                                },
                            ),
                        ],
                        className="input-group mr-3",
                    )
                ],
                className="col",
            ),
            className="row pt-3 pb-3 charts-filters",
        ),
        html.Div(
            [
                html.Div(
                    [
                        html.Div(
                            [
                                build_input(
                                    [html.Div("X"), html.Small("(Agg By)")],
                                    dcc.Dropdown(
                                        id="x-dropdown",
                                        options=x_options,
                                        placeholder="Default Index (1, 2, ..., N)",
                                        value=x,
                                        style=dict(width="inherit"),
                                    ),
                                    label_class="input-group-addon d-block pt-1 pb-0",
                                ),
                                build_input(
                                    "Y",
                                    dcc.Dropdown(
                                        id="y-multi-dropdown",
                                        options=y_multi_options,
                                        multi=True,
                                        placeholder="Select a column(s)",
                                        style=dict(width="inherit"),
                                        value=y if show_input("y", "multi") else None,
                                    ),
                                    className="col",
                                    id="y-multi-input",
                                    style=show_style(show_input("y", "multi")),
                                ),
                                build_input(
                                    [html.Div("Y"), html.Small("(Agg By)")],
                                    dcc.Dropdown(
                                        id="y-single-dropdown",
                                        options=y_single_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=y[0]
                                        if show_input("y") and len(y)
                                        else None,
                                    ),
                                    className="col",
                                    label_class="input-group-addon d-block pt-1 pb-0",
                                    id="y-single-input",
                                    style=show_style(show_input("y")),
                                ),
                                build_input(
                                    "Z",
                                    dcc.Dropdown(
                                        id="z-dropdown",
                                        options=z_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=z,
                                    ),
                                    className="col",
                                    id="z-input",
                                    style=show_style(show_input("z")),
                                ),
                                build_input(
                                    "Group",
                                    dcc.Dropdown(
                                        id="group-dropdown",
                                        options=group_options,
                                        multi=True,
                                        placeholder="Select a group(s)",
                                        value=group,
                                        style=dict(width="inherit"),
                                    ),
                                    className="col",
                                    id="group-input",
                                    style=show_style(show_input("group")),
                                ),
                            ],
                            id="standard-inputs",
                            style={}
                            if not show_map
                            and not show_candlestick
                            and not show_treemap
                            else {"display": "none"},
                            className="row p-0 charts-filters",
                        ),
                        html.Div(
                            [
                                build_map_type_tabs(map_type),
                                html.Div(
                                    [
                                        html.Div(
                                            [
                                                build_loc_mode_hover(loc_mode),
                                                dcc.Dropdown(
                                                    id="map-loc-mode-dropdown",
                                                    options=[
                                                        build_option(
                                                            v,
                                                            LOC_MODE_INFO[v].get(
                                                                "label"
                                                            ),
                                                        )
                                                        for v in [
                                                            "ISO-3",
                                                            "USA-states",
                                                            "country names",
                                                            "geojson-id",
                                                        ]
                                                    ],
                                                    style=dict(width="inherit"),
                                                    value=loc_mode,
                                                ),
                                            ],
                                            className="input-group mr-3",
                                        )
                                    ],
                                    id="map-loc-mode-input",
                                    style=show_map_style(map_type == "choropleth"),
                                    className="col-auto",
                                ),
                                custom_geojson.build_modal(map_type, loc_mode),
                                build_input(
                                    [html.Div("Locations"), html.Small("(Agg By)")],
                                    dcc.Dropdown(
                                        id="map-loc-dropdown",
                                        options=loc_options,
                                        placeholder="Select a column",
                                        value=loc,
                                        style=dict(width="inherit"),
                                    ),
                                    id="map-loc-input",
                                    label_class="input-group-addon d-block pt-1 pb-0",
                                    style=show_map_style(map_type == "choropleth"),
                                ),
                                build_input(
                                    [html.Div("Lat"), html.Small("(Agg By)")],
                                    dcc.Dropdown(
                                        id="map-lat-dropdown",
                                        options=lat_options,
                                        placeholder="Select a column",
                                        value=lat,
                                        style=dict(width="inherit"),
                                    ),
                                    id="map-lat-input",
                                    label_class="input-group-addon d-block pt-1 pb-0",
                                    style=show_map_style(
                                        map_type in ["scattergeo", "mapbox"]
                                    ),
                                ),
                                build_input(
                                    [html.Div("Lon"), html.Small("(Agg By)")],
                                    dcc.Dropdown(
                                        id="map-lon-dropdown",
                                        options=lon_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=lon,
                                    ),
                                    id="map-lon-input",
                                    label_class="input-group-addon d-block pt-1 pb-0",
                                    style=show_map_style(
                                        map_type in ["scattergeo", "mapbox"]
                                    ),
                                ),
                                build_input(
                                    "Scope",
                                    dcc.Dropdown(
                                        id="map-scope-dropdown",
                                        options=[build_option(v) for v in SCOPES],
                                        style=dict(width="inherit"),
                                        value=map_scope or "world",
                                    ),
                                    id="map-scope-input",
                                    style=show_map_style(map_type == "scattergeo"),
                                ),
                                html.Div(
                                    [
                                        html.Div(
                                            [
                                                build_mapbox_token_hover(),
                                                dcc.Dropdown(
                                                    id="map-mapbox-style-dropdown",
                                                    options=build_mapbox_style_options(),
                                                    style=dict(width="inherit"),
                                                    value=mapbox_style
                                                    or "open-street-map",
                                                ),
                                            ],
                                            className="input-group mr-3",
                                        )
                                    ],
                                    id="map-mapbox-style-input",
                                    className="col-auto",
                                    style=show_map_style(map_type == "mapbox"),
                                ),
                                html.Div(
                                    [
                                        html.Div(
                                            [
                                                build_proj_hover(proj),
                                                dcc.Dropdown(
                                                    id="map-proj-dropdown",
                                                    options=[
                                                        build_option(v)
                                                        for v in PROJECTIONS
                                                    ],
                                                    style=dict(width="inherit"),
                                                    value=proj,
                                                ),
                                            ],
                                            className="input-group mr-3",
                                        )
                                    ],
                                    id="map-proj-input",
                                    style=show_map_style(map_type == "scattergeo"),
                                    className="col-auto",
                                ),
                                build_input(
                                    "Value",
                                    dcc.Dropdown(
                                        id="map-val-dropdown",
                                        options=map_val_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=map_val,
                                    ),
                                ),
                                build_input(
                                    "Group",
                                    dcc.Dropdown(
                                        id="map-group-dropdown",
                                        options=group_options,
                                        multi=True,
                                        placeholder="Select a group(s)",
                                        value=inputs.get("map_group"),
                                        style=dict(width="inherit"),
                                    ),
                                    className="col",
                                    id="map-group-input",
                                ),
                            ],
                            id="map-inputs",
                            className="row charts-filters",
                            style={} if show_map else {"display": "none"},
                        ),
                        html.Div(
                            [
                                build_input(
                                    "X",
                                    dcc.Dropdown(
                                        id="candlestick-x-dropdown",
                                        options=cs_x_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=cs_x,
                                    ),
                                ),
                                build_input(
                                    "Open",
                                    dcc.Dropdown(
                                        id="candlestick-open-dropdown",
                                        options=open_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=cs_open,
                                    ),
                                ),
                                build_input(
                                    "High",
                                    dcc.Dropdown(
                                        id="candlestick-high-dropdown",
                                        options=high_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=cs_high,
                                    ),
                                ),
                                build_input(
                                    "Low",
                                    dcc.Dropdown(
                                        id="candlestick-low-dropdown",
                                        options=low_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=cs_low,
                                    ),
                                ),
                                build_input(
                                    "Close",
                                    dcc.Dropdown(
                                        id="candlestick-close-dropdown",
                                        options=close_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=cs_close,
                                    ),
                                ),
                                build_input(
                                    "Group",
                                    dcc.Dropdown(
                                        id="candlestick-group-dropdown",
                                        options=group_options,
                                        multi=True,
                                        placeholder="Select a group(s)",
                                        value=inputs.get("cs_group"),
                                        style=dict(width="inherit"),
                                    ),
                                    className="col",
                                    id="candlestick-group-input",
                                ),
                            ],
                            id="candlestick-inputs",
                            className="row charts-filters",
                            style={} if show_candlestick else {"display": "none"},
                        ),
                        html.Div(
                            [
                                build_input(
                                    "Value",
                                    dcc.Dropdown(
                                        id="treemap-value-dropdown",
                                        options=treemap_value_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=treemap_value,
                                    ),
                                ),
                                build_input(
                                    "Labels",
                                    dcc.Dropdown(
                                        id="treemap-label-dropdown",
                                        options=treemap_label_options,
                                        placeholder="Select a column",
                                        style=dict(width="inherit"),
                                        value=treemap_label,
                                    ),
                                ),
                                build_input(
                                    "Group",
                                    dcc.Dropdown(
                                        id="treemap-group-dropdown",
                                        options=group_options,
                                        multi=True,
                                        placeholder="Select a group(s)",
                                        value=inputs.get("treemap_group"),
                                        style=dict(width="inherit"),
                                    ),
                                    className="col",
                                    id="treemap-group-input",
                                ),
                            ],
                            id="treemap-inputs",
                            className="row charts-filters",
                            style={} if show_treemap else {"display": "none"},
                        ),
                        html.Div(
                            [
                                build_input(
                                    "Aggregation",
                                    dcc.Dropdown(
                                        id="agg-dropdown",
                                        options=[
                                            build_option(v, AGGS[v])
                                            for v in [
                                                "count",
                                                "nunique",
                                                "sum",
                                                "mean",
                                                "rolling",
                                                "corr",
                                                "first",
                                                "last",
                                                "drop_duplicates",
                                                "median",
                                                "min",
                                                "max",
                                                "std",
                                                "var",
                                                "mad",
                                                "prod",
                                                "pctsum",
                                                "pctct",
                                            ]
                                        ],
                                        placeholder="No Aggregation",
                                        style=dict(width="inherit"),
                                        value=agg or "raw",
                                    ),
                                ),
                                html.Div(
                                    [
                                        build_input(
                                            "Window",
                                            dcc.Input(
                                                id="window-input",
                                                type="number",
                                                placeholder="Enter days",
                                                className="form-control text-center",
                                                style={"lineHeight": "inherit"},
                                                value=inputs.get("window"),
                                            ),
                                        ),
                                        build_input(
                                            "Computation",
                                            dcc.Dropdown(
                                                id="rolling-comp-dropdown",
                                                options=[
                                                    build_option("corr", "Correlation"),
                                                    build_option("count", "Count"),
                                                    build_option("cov", "Covariance"),
                                                    build_option("kurt", "Kurtosis"),
                                                    build_option("max", "Maximum"),
                                                    build_option("mean", "Mean"),
                                                    build_option("median", "Median"),
                                                    build_option("min", "Minimum"),
                                                    build_option("skew", "Skew"),
                                                    build_option(
                                                        "std", "Standard Deviation"
                                                    ),
                                                    build_option("sum", "Sum"),
                                                    build_option("var", "Variance"),
                                                ],
                                                placeholder="Select an computation",
                                                style=dict(width="inherit"),
                                                value=inputs.get("rolling_comp"),
                                            ),
                                        ),
                                    ],
                                    id="rolling-inputs",
                                    style=show_style(agg == "rolling"),
                                ),
                                build_input(
                                    "Drilldowns",
                                    html.Div(
                                        daq.BooleanSwitch(
                                            id="drilldown-toggle",
                                            on=False,
                                        ),
                                        className="toggle-wrapper",
                                    ),
                                    id="drilldown-input",
                                    style=show_style((agg or "raw") != "raw"),
                                    className="col-auto",
                                ),
                            ],
                            className="row pt-3 pb-3 charts-filters",
                        ),
                    ],
                    id="main-inputs",
                    className=main_input_class,
                ),
                html.Div(
                    [
                        html.Div(
                            html.Div(
                                html.Div(
                                    [
                                        html.Span(
                                            "Group Type",
                                            className="input-group-addon",
                                        ),
                                        html.Div(
                                            dcc.Tabs(
                                                id="group-type",
                                                value=inputs.get("group_type")
                                                or "groups",
                                                children=[
                                                    build_tab(
                                                        "Values",
                                                        "groups",
                                                        {
                                                            "padding": "2px",
                                                            "minWidth": "4em",
                                                        },
                                                    ),
                                                    build_tab(
                                                        "Bins",
                                                        "bins",
                                                        {
                                                            "padding": "2px",
                                                            "minWidth": "4em",
                                                        },
                                                    ),
                                                ],
                                            ),
                                            id="group-type-div",
                                            className="form-control col-auto pt-3",
                                        ),
                                    ],
                                    className="input-group",
                                ),
                                className="addon-min-width",
                            ),
                            className="col-md-12 p-0 pb-5",
                            id="group-type-input",
                            style=group_type_style,
                        ),
                        build_input(
                            "Group(s)",
                            dcc.Dropdown(
                                id="group-val-dropdown",
                                multi=True,
                                placeholder="Select a group value(s)",
                                value=group_val,
                                style=dict(width="inherit"),
                            ),
                            className="col-md-12 p-0 pb-5",
                            id="group-val-input",
                            style=group_val_style,
                        ),
                        build_input(
                            "Bins",
                            [
                                daq.NumericInput(
                                    id="bins-val-input",
                                    min=1,
                                    max=30,
                                    value=inputs.get("bins_val") or 5,
                                ),
                                html.Div(
                                    html.Div(
                                        [
                                            html.Span(
                                                "Binning",
                                                className="input-group-addon",
                                            ),
                                            html.Div(
                                                build_hoverable(
                                                    dcc.Tabs(
                                                        id="bin-type",
                                                        value=inputs.get("bin_type")
                                                        or "width",
                                                        children=[
                                                            build_tab(
                                                                "Width",
                                                                "width",
                                                                {
                                                                    "padding": "2px",
                                                                    "minWidth": "4em",
                                                                },
                                                            ),
                                                            build_tab(
                                                                "Freq",
                                                                "freq",
                                                                {
                                                                    "padding": "2px",
                                                                    "minWidth": "4em",
                                                                },
                                                            ),
                                                        ],
                                                    ),
                                                    BIN_TYPE_MSG,
                                                    "",
                                                    top="120%",
                                                ),
                                                id="bin-type-div",
                                                className="form-control col-auto pt-3",
                                            ),
                                        ],
                                        className="input-group",
                                    ),
                                    className="col-auto addon-min-width",
                                    id="bin-type-input",
                                ),
                            ],
                            className="col-md-12 p-0",
                            id="bins-input",
                            style=bins_style,
                        ),
                    ],
                    id="group-inputs-row",
                    className="col-md-4 row pt-3 pb-5",
                    style=show_groups,
                ),
            ],
            className="row",
        ),
        html.Div(
            [
                build_input(
                    "Chart Per\nGroup",
                    html.Div(
                        daq.BooleanSwitch(
                            id="cpg-toggle",
                            on=inputs.get("cpg") or False,
                        ),
                        className="toggle-wrapper",
                    ),
                    id="cpg-input",
                    style=show_style(show_cpg),
                    className="col-auto",
                ),
                build_input(
                    "Trendline",
                    dcc.Dropdown(
                        id="trendline-dropdown",
                        options=[
                            build_option("ols"),
                            build_option("lowess"),
                        ],
                        value=inputs.get("trendline"),
                    ),
                    className="col-auto addon-min-width",
                    style=scatter_input,
                    id="trendline-input",
                ),
                build_input(
                    "Barmode",
                    dcc.Dropdown(
                        id="barmode-dropdown",
                        options=[
                            build_option("group", "Group"),
                            build_option("stack", "Stack"),
                            build_option("relative", "Relative"),
                        ],
                        value=inputs.get("barmode") or "group",
                        placeholder="Select a mode",
                    ),
                    className="col-auto addon-min-width",
                    style=bar_style,
                    id="barmode-input",
                ),
                build_input(
                    "Barsort",
                    dcc.Dropdown(
                        id="barsort-dropdown",
                        options=barsort_options,
                        value=inputs.get("barsort"),
                    ),
                    className="col-auto addon-min-width",
                    style=barsort_input_style,
                    id="barsort-input",
                ),
                build_input(
                    "Top",
                    dcc.Dropdown(
                        id="top-bars",
                        options=[build_option(v) for v in [5, 10, 20, 50]],
                        value=inputs.get("top_bars"),
                        placeholder=None,
                    ),
                    className="col-auto",
                    style=barsort_input_style,
                    id="top-bars-input",
                ),
                html.Div(
                    html.Div(
                        [
                            html.Span(
                                "Y-Axis",
                                className="input-group-addon",
                            ),
                            html.Div(
                                dcc.Tabs(
                                    id="yaxis-type",
                                    value=yaxis_type,
                                    children=get_yaxis_type_tabs(y),
                                ),
                                id="yaxis-type-div",
                                className="form-control col-auto pt-3",
                                style=yaxis_type_style,
                            ),
                            dcc.Dropdown(
                                id="yaxis-dropdown",
                                options=yaxis_options,
                            ),
                            html.Span(
                                "Min:",
                                className="input-group-addon col-auto",
                                id="yaxis-min-label",
                            ),
                            dcc.Input(
                                id="yaxis-min-input",
                                type="number",
                                className="form-control col-auto",
                                style={"lineHeight": "inherit"},
                            ),
                            html.Span(
                                "Max:",
                                className="input-group-addon col-auto",
                                id="yaxis-max-label",
                            ),
                            dcc.Input(
                                id="yaxis-max-input",
                                type="number",
                                className="form-control col-auto",
                                style={"lineHeight": "inherit"},
                            ),
                        ],
                        className="input-group",
                        id="yaxis-min-max-options",
                    ),
                    className="col-auto addon-min-width",
                    id="yaxis-input",
                    style=show_style(show_yaxis),
                ),
                build_input(
                    "Colorscale",
                    dcs.DashColorscales(
                        id="colorscale-picker",
                        colorscale=inputs.get("colorscale") or default_cscale,
                    ),
                    className="col-auto addon-min-width pr-0",
                    style=cscale_style,
                    id="colorscale-input",
                ),
                build_input(
                    "Animate",
                    html.Div(
                        daq.BooleanSwitch(
                            id="animate-toggle",
                            on=inputs.get("animate") or False,
                        ),
                        className="toggle-wrapper",
                    ),
                    id="animate-input",
                    style=animate_style,
                    className="col-auto",
                ),
                build_input(
                    "Animate By",
                    dcc.Dropdown(
                        id="animate-by-dropdown",
                        options=animate_opts,
                        value=inputs.get("animate_by"),
                    ),
                    className="col-auto addon-min-width",
                    style=animate_by_style,
                    id="animate-by-input",
                ),
                dbc.Button(
                    "Lock Zoom",
                    id="lock-zoom-btn",
                    className="ml-auto",
                    style=lock_zoom_style(chart_type),
                ),
                build_input(
                    build_hoverable(
                        html.Div("Auto-Load", style=dict(color="white")),
                        AUTO_LOAD_MSG,
                        "",
                        top="120%",
                    ),
                    html.Div(
                        daq.BooleanSwitch(
                            id="auto-load-toggle",
                            on=True,
                            color="green",
                        ),
                        className="toggle-wrapper",
                    ),
                    id="auto-load-input",
                    className="ml-auto col-auto",
                ),
                dbc.Button(
                    "Load",
                    id="load-btn",
                    color="primary",
                    style=dict(display="none"),
                ),
            ],
            className="row pt-3 pb-5 charts-filters",
            id="chart-inputs",
        ),
        dcc.Loading(
            html.Div(id="chart-content", style={"height": "69vh"}), type="circle"
        ),
        dcc.Textarea(id="copy-text", style=dict(position="absolute", left="-110%")),
    ]
    if settings.get("github_fork", False):
        body_items.append(
            html.Span(
                html.A("Fork me on Github", href="https://github.com/man-group/dtale"),
                id="forkongithub",
            )
        )
    return html.Div(body_items, className="charts-body")
