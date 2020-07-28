import dash_html_components as html
import dash_bootstrap_components as dbc
import dash_core_components as dcc

from dtale.utils import dict_merge, classify_type, flatten_lists, make_list


AGGS = dict(
    raw="No Aggregation",
    count="Count",
    nunique="Unique Count",
    sum="Sum",
    mean="Mean",
    rolling="Rolling",
    corr="Correlation",
    first="First",
    last="Last",
    median="Median",
    min="Minimum",
    max="Maximum",
    std="Standard Deviation",
    var="Variance",
    mad="Mean Absolute Deviation",
    prod="Product of All Items",
    pctct="Percentage Count",
    pctsum="Percentage Sum",
)


def show_style(show):
    return {"display": "block" if show else "none"}


def build_input(
    label, input, className="col-auto", label_class="input-group-addon", **kwargs
):
    """
    Helper function to build a standard label/input component in dash.

    :param label: name of the input you are displaying
    :type label: str
    :param input: dash component for storing state
    :param className: style class to be applied to encapsulating div
    :type className: str
    :param kwargs: Optional keyword arguments to be applied to encapsulating div (style, title, id...)
    :type kwargs: dict
    :return: dash components for label/input
    :rtype: :dash:`dash_html_components.Div <dash-html-components/div>`
    """
    return html.Div(
        [
            html.Div(
                [html.Span(label, className=label_class), input],
                className="input-group mr-3",
            )
        ],
        className=className,
        **kwargs
    )


def build_option(value, label=None):
    """
    Returns value/label inputs in a dictionary for use in
    :dash:`dash_core_components.Dropdown <dash-core-components/Dropdown>`
    """
    return {"label": label or value, "value": value}


FREQS = ["H", "H2", "WD", "D", "W", "M", "Q", "Y"]
FREQ_LABELS = dict(
    H="Hourly",
    H2="Hour",
    WD="Weekday",
    W="Weekly",
    M="Monthly",
    Q="Quarterly",
    Y="Yearly",
)


def build_cols(cols, dtypes):
    """
    Helper function to add additional column entries for columns of type datetime so that users can make use of
    different frequencies of dates.  For example, hour, weekday, month, quarter, year

    :param cols: columns in dataframe
    :type cols: list of strings
    :param dtypes: datatypes of columns in dataframe
    :type dtypes: dict
    :return: generator or columns + any additional (datetime column + frequency) options
    """
    for c in cols:
        if classify_type(dtypes[c]) == "D":
            for freq in FREQS:
                if freq in FREQ_LABELS:
                    yield "{}|{}".format(c, freq), "{} ({})".format(
                        c, FREQ_LABELS[freq]
                    )
                else:
                    yield c, c
        else:
            yield c, c


def build_selections(*args):
    """
    simple helper function to build a single level list of values based on variable number of inputs which could be
    equal to None.
    """
    return flatten_lists([[] if a is None else make_list(a) for a in args])


def build_tab(label, value, additional_style=None, **kwargs):
    """
    Builds a :dash:`dash_core_components.Tab <dash-core-components/tab>` with standard styling settings.
    """
    base_style = {"borderBottom": "1px solid #d6d6d6", "padding": "6px"}
    return dcc.Tab(
        label=label,
        value=value,
        style=dict_merge(base_style, {"fontWeight": "bold"}, additional_style or {}),
        disabled_style=dict_merge(
            base_style,
            {
                "fontWeight": "bold",
                "backgroundColor": "LightGray",
                "color": "black",
                "cursor": "not-allowed",
            },
            additional_style or {},
        ),
        selected_style=dict_merge(
            base_style,
            {
                "borderTop": "1px solid #d6d6d6",
                "backgroundColor": "#2a91d1",
                "color": "white",
            },
            additional_style or {},
        ),
        **kwargs
    )


def build_drilldown_modal(idx):
    return dbc.Modal(
        [
            dbc.ModalHeader(
                html.Div(
                    [
                        html.Div(
                            "Chart Drilldown",
                            className="col mt-auto mb-auto",
                            id="drilldown-modal-header-{}".format(idx),
                        ),
                        html.Button(
                            html.Span("X"),
                            className="close mr-5",
                            id="close-drilldown-modal-header-{}".format(idx),
                        ),
                    ],
                    className="row",
                )
            ),
            dbc.ModalBody(
                dcc.Loading(
                    [
                        html.Div(
                            [
                                html.Div(
                                    dcc.Tabs(
                                        id="drilldown-chart-type-{}".format(idx),
                                        value="histogram",
                                        children=[
                                            build_tab(t.capitalize(), t)
                                            for t in ["histogram", "bar"]
                                        ],
                                        style=dict(height="36px"),
                                    ),
                                    className="col-md-4",
                                ),
                                build_input(
                                    "X",
                                    dcc.Dropdown(
                                        id="drilldown-x-dropdown-{}".format(idx),
                                        options=[],
                                        placeholder="Select a column",
                                        value=None,
                                        style=dict(width="inherit"),
                                        className="drilldown-x-dropdown",
                                    ),
                                    id="drilldown-x-input-{}".format(idx),
                                    style=dict(display="none"),
                                ),
                            ],
                            className="row pt-3 pb-5",
                        ),
                        html.Div(id="drilldown-content-{}".format(idx)),
                    ],
                    type="circle",
                )
            ),
            dbc.ModalFooter(
                dbc.Button(
                    "Close",
                    id="close-drilldown-modal-{}".format(idx),
                    className="ml-auto",
                )
            ),
        ],
        id="drilldown-modal-{}".format(idx),
        size="lg",
        centered=True,
        className="drilldown-modal",
    )


CHART_IDX = 0


def reset_charts():
    global CHART_IDX

    CHART_IDX = 0


def graph_wrapper(modal=False, export=False, **kwargs):
    global CHART_IDX

    curr_style = kwargs.pop("style", None) or {}
    if modal or export:
        id = "{}-chart".format("modal" if modal else "export")
        return dcc.Graph(
            id=id, style=dict_merge({"height": "100%"}, curr_style), **kwargs
        )

    CHART_IDX += 1
    graph = dcc.Graph(
        id="chart-{}".format(CHART_IDX),
        style=dict_merge({"height": "100%"}, curr_style),
        **kwargs
    )
    graph.figure["id"] = "chart-figure-{}".format(CHART_IDX)
    click_data_store = dcc.Store(id="chart-click-data-{}".format(CHART_IDX))
    return [graph, click_data_store, build_drilldown_modal(CHART_IDX)]
