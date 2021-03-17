import dash_bootstrap_components as dbc
import dash_core_components as dcc
import dash_html_components as html

from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate

from dtale.charts.utils import AGGS, NON_EXT_AGGREGATION
from dtale.dash_application.layout.utils import (
    build_hoverable,
    build_input,
    build_option,
    show_style,
)
from dtale.translations import text
from dtale.utils import make_list

MAX_INPUTS = 10
INPUT_IDS = list(range(1, MAX_INPUTS + 1))


def build_error(error):
    return html.Div(
        [
            html.I(className="ico-error"),
            html.Span(error),
        ],
        className="dtale-alert alert alert-danger",
    )


def build_extended_agg_desc(ext_agg):
    desc = []
    col, agg, window, comp = (ext_agg.get(p) for p in ["col", "agg", "window", "comp"])
    desc += [html.Span("Col: "), html.B(col)]
    desc += [html.Span(", Agg: "), html.B(agg)]
    if window:
        desc += [html.Span(", Win: "), html.B(window)]
    if comp:
        desc += [html.Span(", Roll Comp: "), html.B(comp)]
    return desc


def build_body(ext_aggs):
    col_inputs = [html.Div(id="extended-agg-errors")]
    for i in INPUT_IDS:
        ext_agg = ext_aggs[i - 1] if len(ext_aggs) >= i else {}
        col_inputs.append(
            html.Div(
                [
                    html.Span(
                        "{}.".format(i),
                        className="col-auto pr-0 mt-auto mb-auto ext-agg-id",
                    ),
                    build_input(
                        text("Col"),
                        dcc.Dropdown(
                            id="col-dropdown-{}".format(i),
                            placeholder=text("Select"),
                            style=dict(width="inherit"),
                            value=ext_agg.get("col"),
                        ),
                        className="col-md-3",
                    ),
                    build_input(
                        text("Agg"),
                        dcc.Dropdown(
                            id="agg-dropdown-{}".format(i),
                            options=[
                                build_option(v, text(AGGS[v]))
                                for v in [
                                    "count",
                                    "nunique",
                                    "sum",
                                    "mean",
                                    "rolling",
                                    "corr",
                                    "first",
                                    "last",
                                    # "drop_duplicates",
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
                            placeholder=text("Select"),
                            style=dict(width="inherit"),
                            value=ext_agg.get("agg"),
                        ),
                        className="col-md-3",
                    ),
                    html.Div(
                        [
                            build_input(
                                text("Window"),
                                dcc.Input(
                                    id="window-input-{}".format(i),
                                    type="number",
                                    placeholder=text("Enter Days"),
                                    className="form-control text-center",
                                    style={"lineHeight": "inherit"},
                                    value=ext_agg.get("window"),
                                ),
                                className="col-md-6",
                            ),
                            build_input(
                                text("Computation"),
                                dcc.Dropdown(
                                    id="rolling-comp-dropdown-{}".format(i),
                                    options=[
                                        build_option("corr", text("Correlation")),
                                        build_option("count", text("Count")),
                                        build_option("cov", text("Covariance")),
                                        build_option("kurt", text("Kurtosis")),
                                        build_option("max", text("Maximum")),
                                        build_option("mean", text("Mean")),
                                        build_option("median", text("Median")),
                                        build_option("min", text("Minimum")),
                                        build_option("skew", text("Skew")),
                                        build_option(
                                            "std",
                                            text("Standard Deviation"),
                                        ),
                                        build_option("sum", text("Sum")),
                                        build_option("var", text("Variance")),
                                    ],
                                    placeholder=text("Select"),
                                    style=dict(width="inherit"),
                                    value=ext_agg.get("rolling_comp"),
                                ),
                                className="col-md-6 pl-0",
                            ),
                        ],
                        id="rolling-inputs-{}".format(i),
                        style=show_style(
                            ext_agg.get("agg") == "rolling", display_style="inherit"
                        ),
                        className="col-md-6 row p-0",
                    ),
                ],
                className="row pb-3",
            )
        )
    return html.Div(col_inputs, id="extended-agg-body")


def build_modal(ext_aggs, chart_type, y):
    return [
        build_hoverable(
            html.I(
                className="ico-settings pointer",
                id="open-extended-agg-modal",
                style=show_style(chart_type not in NON_EXT_AGGREGATION and len(y)),
            ),
            html.Div(
                html.Span(text("ext_agg_desc")), id="extended-aggregation-tooltip"
            ),
            hover_class="saved-chart-config",
            top="100%",
            additional_classes="mb-auto mt-auto",
        ),
        dcc.Store(id="extended-aggregations", data=ext_aggs),
        dcc.Store(id="prev-open-extended-agg-modal", data=0),
        dcc.Store(id="prev-close-extended-agg-modal", data=0),
        dcc.Store(id="prev-clear-extended-agg-modal", data=0),
        dcc.Store(id="prev-apply-extended-agg-modal", data=0),
        dbc.Modal(
            [
                dbc.ModalHeader(
                    html.Div(
                        [
                            html.Div(
                                text("Extended Aggregations"),
                                className="col mt-auto mb-auto",
                            ),
                            html.Button(
                                html.Span("X"),
                                className="close mr-5",
                                id="close-extended-agg-modal",
                            ),
                        ],
                        className="row",
                    )
                ),
                dbc.ModalBody(build_body(ext_aggs)),
                dbc.ModalFooter(
                    [
                        dbc.Button(
                            text("Clear"),
                            id="clear-extended-agg-modal",
                            className="ml-auto",
                        ),
                        dbc.Button(
                            text("Apply"),
                            id="apply-extended-agg-modal",
                        ),
                    ]
                ),
            ],
            id="extended-agg-modal",
            size="lg",
            centered=True,
        ),
    ]


def init_callbacks(dash_app):
    @dash_app.callback(
        [
            Output("extended-agg-modal", "is_open"),
            Output("extended-aggregations", "data"),
            Output("prev-open-extended-agg-modal", "data"),
            Output("prev-apply-extended-agg-modal", "data"),
            Output("prev-close-extended-agg-modal", "data"),
            Output("prev-clear-extended-agg-modal", "data"),
            Output("extended-agg-errors", "children"),
        ]
        + [Output("col-dropdown-{}".format(i), "value") for i in INPUT_IDS]
        + [Output("agg-dropdown-{}".format(i), "value") for i in INPUT_IDS],
        [
            Input("open-extended-agg-modal", "n_clicks"),
            Input("apply-extended-agg-modal", "n_clicks"),
            Input("close-extended-agg-modal", "n_clicks"),
            Input("clear-extended-agg-modal", "n_clicks"),
        ],
        [
            State("extended-agg-modal", "is_open"),
            State("extended-aggregations", "data"),
            State("input-data", "data"),
            State("prev-open-extended-agg-modal", "data"),
            State("prev-apply-extended-agg-modal", "data"),
            State("prev-close-extended-agg-modal", "data"),
            State("prev-clear-extended-agg-modal", "data"),
        ]
        + [State("col-dropdown-{}".format(i), "value") for i in INPUT_IDS]
        + [State("agg-dropdown-{}".format(i), "value") for i in INPUT_IDS]
        + [State("window-input-{}".format(i), "value") for i in INPUT_IDS]
        + [State("rolling-comp-dropdown-{}".format(i), "value") for i in INPUT_IDS],
    )
    def toggle_modal(
        open_clicks,
        apply_clicks,
        close_clicks,
        clear_clicks,
        is_modal_open,
        curr_ext_aggs,
        inputs,
        prev_open_clicks,
        prev_apply_clicks,
        prev_close_clicks,
        prev_clear_clicks,
        *agg_inputs
    ):
        open_clicks = open_clicks or 0
        apply_clicks = apply_clicks or 0
        close_clicks = close_clicks or 0
        clear_clicks = clear_clicks or 0
        is_open = open_clicks > prev_open_clicks
        is_apply = apply_clicks > prev_apply_clicks
        is_close = close_clicks > prev_close_clicks
        is_clear = clear_clicks > prev_clear_clicks
        agg_inputs = list(agg_inputs)
        col_values = [agg_inputs.pop(0) for _ in INPUT_IDS]
        agg_values = [agg_inputs.pop(0) for _ in INPUT_IDS]
        window_values = [agg_inputs.pop(0) for _ in INPUT_IDS]
        rolling_comp_values = [agg_inputs.pop(0) for _ in INPUT_IDS]

        if is_open or is_apply or is_close or is_clear:
            errors = []
            ext_aggs = curr_ext_aggs if is_close or is_open else []
            final_is_modal_open = not is_modal_open
            if is_open:
                curr_col, curr_agg = (inputs.get(prop) for prop in ["col", "agg"])
                if curr_agg != "raw":
                    for i, sub_col in enumerate(make_list(curr_col)):
                        col_values[i] = sub_col
                        agg_values[i] = curr_agg
                        ext_aggs.append(
                            dict(
                                col=sub_col,
                                agg=curr_agg,
                                window=None,
                                rolling_comp=None,
                            )
                        )
            if is_apply:
                agg_input_iterable = enumerate(
                    zip(col_values, agg_values, window_values, rolling_comp_values), 1
                )
                for i, (col, agg, window, rolling_comp) in agg_input_iterable:
                    if col is None:
                        continue
                    if agg is None:
                        errors.append(
                            "Entry {} is missing an aggregation selection!".format(i)
                        )
                        continue
                    if agg == "rolling":
                        if not window:
                            errors.append(
                                "Entry {} is missing a rolling window!".format(i)
                            )
                            continue
                        if not rolling_comp:
                            errors.append(
                                "Entry {} is missing a rolling computation!".format(i)
                            )
                            continue
                    ext_aggs.append(
                        dict(
                            col=col,
                            agg=agg,
                            window=window,
                            rolling_comp=rolling_comp,
                        )
                    )

                if len(errors):
                    errors.append(
                        'If you wish to not use an extended aggregation please click "Clear".'
                    )
                    errors = build_error(" ".join(errors))
                    final_is_modal_open = True
                else:
                    errors = None

            return (
                final_is_modal_open,
                ext_aggs,
                open_clicks,
                apply_clicks,
                close_clicks,
                clear_clicks,
                errors,
            ) + tuple(col_values + agg_values)
        return (
            is_modal_open,
            curr_ext_aggs,
            open_clicks,
            apply_clicks,
            close_clicks,
            clear_clicks,
            None,
        ) + tuple(col_values + agg_values)

    @dash_app.callback(
        [Output("col-dropdown-{}".format(i), "options") for i in INPUT_IDS],
        Input("extended-agg-modal", "is_open"),
        [State("input-data", "data")],
    )
    def populate_col_dropdowns(is_open, input_data):
        if not is_open:
            raise PreventUpdate
        y = make_list(input_data.get("y"))
        z = make_list(input_data.get("z"))
        col_options = [build_option(sub_col) for sub_col in (y if not len(z) else z)]
        return [col_options for _ in range(10)]

    def toggle_rolling_style(agg):
        return show_style(agg == "rolling", display_style="inherit")

    for i in INPUT_IDS:
        dash_app.callback(
            Output("rolling-inputs-{}".format(i), "style"),
            Input("agg-dropdown-{}".format(i), "value"),
        )(toggle_rolling_style)
