import copy

import numpy as np
import pandas as pd

import dtale.global_state as global_state
from dtale.column_analysis import handle_cleaners
from dtale.query import build_col_key, run_query
from dtale.utils import (
    ChartBuildingError,
    classify_type,
    find_dtype,
    find_dtype_formatter,
    flatten_lists,
    get_dtypes,
    grid_columns,
    grid_formatter,
    json_int,
    make_list,
    triple_quote,
)

YAXIS_CHARTS = ["line", "bar", "scatter"]
ZAXIS_CHARTS = ["heatmap", "3d_scatter", "surface"]
NON_EXT_AGGREGATION = ZAXIS_CHARTS + ["treemap", "maps"]
ANIMATION_CHARTS = ["line"]
ANIMATE_BY_CHARTS = ["bar", "3d_scatter", "heatmap", "maps"]
MAX_GROUPS = 30
MAPBOX_TOKEN = None
AGGS = dict(
    raw="No Aggregation",
    count="Count",
    nunique="Unique Count",
    sum="Sum",
    mean="Mean",
    rolling="Rolling",
    corr="Correlation",
    first="Keep First",
    last="Keep Last",
    drop_duplicates="Remove Duplicates",
    median="Median",
    min="Minimum",
    max="Maximum",
    std="Standard Deviation",
    var="Variance",
    mad="Mean Absolute Deviation",
    prod="Product of All Items",
    pctct="Count (Percentage)",
    pctsum="Percentage Sum",
)
INDEX_COL = "__index__"

CHART_POINTS_LIMIT = (
    "In order to adjust the limitation on the amount of points in charts please update your startup code that "
    "loads the dataframe to D-Tale and add these lines of code before calling 'dtale.show':\n\n"
    "import dtale.global_state as global_state\n\n"
    "global_state.set_chart_settings({'scatter_points': 15000, '3d_points': 40000})\n\n"
    "You could also add the following properties to your global configuration file:\n\n"
    "[charts]\n"
    "scatter_points = 20000\n\n"
    "Documentation on global configurations can be found here:\n"
    "https://github.com/man-group/dtale/blob/master/docs/CONFIGURATION.md"
)


def get_mapbox_token():
    global MAPBOX_TOKEN

    return MAPBOX_TOKEN


def set_mapbox_token(token):
    global MAPBOX_TOKEN

    MAPBOX_TOKEN = token


def valid_chart(chart_type=None, x=None, y=None, z=None, **inputs):
    """
    Helper function to determine based on inputs (chart_type, x, y, z...) whether a chart can be build or not.
    For example, charts must have an x & y value and for 3-dimensional charts they must have a Z-Axis as well.

    :param chart_type: type of chart to build (line, bar, scatter, pie, heatmap, wordcloud, 3dscatter, surface)
    :type chart_type: str, optional
    :param x: column to use for the X-Axis
    :type x: str, optional
    :param y: columns to use for the Y-Axes
    :type y: list of str, optional
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param inputs: keyword arguments containing
    :return: `True` if executed from test, `False` otherwise
    :rtype: bool
    """
    if chart_type == "maps":
        map_type = inputs.get("map_type")
        if map_type == "choropleth" and all(
            inputs.get(p) is not None for p in ["loc_mode", "loc", "map_val"]
        ):
            if inputs.get("loc_mode") == "geojson-id" and any(
                inputs.get(p) is None for p in ["geojson", "featureidkey"]
            ):
                return False
            return True
        elif map_type in ["scattergeo", "mapbox"] and all(
            inputs.get(p) is not None for p in ["lat", "lon"]
        ):
            return True
        return False

    if chart_type == "candlestick":
        cs_props = ["cs_x", "cs_open", "cs_close", "cs_high", "cs_low"]
        return all(inputs.get(p) is not None for p in cs_props)

    if chart_type in ["treemap", "funnel"]:
        chart_props = ["{}_value", "{}_label"]
        return all(inputs.get(p.format(chart_type)) is not None for p in chart_props)

    if chart_type == "clustergram":
        if (
            inputs.get("clustergram_value") is None
            or inputs.get("clustergram_label") is None
        ):
            return False
        if len(make_list(inputs["clustergram_value"])) == 0:
            return False
        return True

    if not x:
        return False

    if not y:
        return chart_type == "wordcloud" and inputs.get("agg") == "count"

    if chart_type in ZAXIS_CHARTS and z is None:
        return False

    if (
        len(inputs.get("extended_aggregation", [])) == 0
        and inputs.get("agg") == "rolling"
        and (inputs.get("window") is None or inputs.get("rolling_comp") is None)
    ):
        return False
    return True


def build_formatters(df, nan_display=None):
    """
    Helper around :meth:`dtale.utils.grid_formatters` that will build a formatter for the data being fed into a chart as
    well as a formatter for the min/max values for each column used in the chart data.

    :param df: dataframe which contains column names and data types for formatters
    :type df: :class:`pandas:pandas.DataFrame`
    :return: json formatters for chart data and min/max values for each column used in the chart
    :rtype: (:class:`dtale.utils.JSONFormatter`, :class:`dtale.utils.JSONFormatter`)
    """
    cols = grid_columns(df)
    data_f = grid_formatter(cols, nan_display=nan_display)
    overrides = {"F": lambda f, i, c: f.add_float(i, c, precision=2)}
    range_f = grid_formatter(cols, overrides=overrides, nan_display=nan_display)
    return data_f, range_f


def date_freq_handler(df):
    """
    This returns a column definition handler which returns a series based on the specs from the front-end.
    Column definitions can be a column name 'Col1' or a column name with a frequency 'Col1|M' for
    columns which are of type datetime.

    :Example:
        Col1 -> returns series for Col1
        Col1|M -> returns series for Col1 in monthly format with name 'Col1|M'

    :param df: dataframe whose data needs to be checked
    :type df: :class:`pandas:pandas.DataFrame`
    :return: handler function
    :rtype: func
    """
    dtypes = get_dtypes(df)
    orig_idx = df.index

    def _handler(col_def):
        col_def_segs = col_def.split("|")
        if len(col_def_segs) > 1 and classify_type(dtypes[col_def_segs[0]]) == "D":
            col, freq = col_def_segs
            if freq == "WD":
                code = "df.set_index('{col}').index.dayofweek.values"
                freq_grp = df.set_index(col).index.dayofweek.values
            elif freq == "H2":
                code = "df.set_index('{col}').index.hour.values"
                freq_grp = df.set_index(col).index.hour.values
            else:
                code = "df.set_index('{col}').index.to_period('{freq}').to_timestamp(how='end').values"
                freq_grp = (
                    df.set_index(col)
                    .index.to_period(freq)
                    .to_timestamp(how="end")
                    .values
                )
            code = "\tpd.Series(" + code + ", index=df.index, name='{col_def}'),"
            freq_grp = pd.Series(freq_grp, index=orig_idx, name=col_def)
            return freq_grp, code.format(col=col, freq=freq, col_def=col_def)
        else:
            return df[col_def], "\tdf['{col_def}'],".format(col_def=col_def)

    return _handler


def convert_date_val_to_date(group_val):
    if isinstance(group_val, int):
        return pd.Timestamp(group_val, unit="ms")
    return pd.Timestamp(group_val)


def group_filter_handler(col_def, group_val, group_classifier):
    col_def_segs = col_def.split("|")
    if len(col_def_segs) > 1:
        col, freq = col_def_segs
        if group_val == "nan":
            return "{col} != {col}".format(col=build_col_key(col)), "{}: NaN".format(
                col
            )
        if freq == "WD":
            return (
                "{}.dt.dayofweek == {}".format(build_col_key(col), group_val),
                "{}.dt.dayofweek: {}".format(col, group_val),
            )
        elif freq == "H2":
            return (
                "{}.dt.hour == {}".format(build_col_key(col), group_val),
                "{}.dt.hour: {}".format(col, group_val),
            )
        elif freq == "H":
            ts_val = pd.Timestamp(group_val)
            day = ts_val.strftime("%Y%m%d")
            hour = ts_val.hour
            return (
                "{col}.dt.date == '{day}' and {col}.dt.hour == {hour}".format(
                    col=build_col_key(col), day=day, hour=hour
                ),
                "{col}.dt.date: {day}, {col}.dt.hour: {hour}".format(
                    col=col, day=day, hour=hour
                ),
            )
        elif freq == "D":
            ts_val = convert_date_val_to_date(group_val)
            day = ts_val.strftime("%Y%m%d")
            return (
                "{col}.dt.date == '{day}'".format(col=build_col_key(col), day=day),
                "{}.dt.date: {}".format(col, day),
            )
        elif freq == "W":
            ts_val = convert_date_val_to_date(group_val)
            return (
                "{col}.dt.year == {year} and {col}.dt.week == {week}".format(
                    col=build_col_key(col), year=ts_val.year, week=ts_val.week
                ),
                "{col}.dt.year: {year}, {col}.dt.week: {week}".format(
                    col=col, year=ts_val.year, week=ts_val.week
                ),
            )
        elif freq == "M":
            ts_val = convert_date_val_to_date(group_val)
            return (
                "{col}.dt.year == {year} and {col}.dt.month == {month}".format(
                    col=build_col_key(col), year=ts_val.year, month=ts_val.month
                ),
                "{col}.dt.year: {year}, {col}.dt.month: {month}".format(
                    col=col, year=ts_val.year, month=ts_val.month
                ),
            )
        elif freq == "Q":
            ts_val = convert_date_val_to_date(group_val)
            return (
                "{col}.dt.year == {year} and {col}.dt.quarter == {quarter}".format(
                    col=build_col_key(col), year=ts_val.year, quarter=ts_val.quarter
                ),
                "{col}.dt.year: {year}, {col}.dt.quarter: {quarter}".format(
                    col=col, year=ts_val.year, quarter=ts_val.quarter
                ),
            )
        elif freq == "Y":
            ts_val = convert_date_val_to_date(group_val)
            return (
                "{col}.dt.year == {year}".format(
                    col=build_col_key(col), year=ts_val.year
                ),
                "{}.dt.year: {}".format(col, ts_val.year),
            )
    if group_val == "nan":
        return "{col} != {col}".format(col=build_col_key(col_def)), "{}: NaN".format(
            col_def
        )
    if group_classifier in ["I", "F", "B"]:
        return (
            "{col} == {val}".format(col=build_col_key(col_def), val=group_val),
            "{}: {}".format(col_def, group_val),
        )
    if group_classifier == "D":
        group_val = convert_date_val_to_date(group_val).strftime("%Y%m%d")
    return (
        "{col} == '{val}'".format(col=build_col_key(col_def), val=group_val),
        "{}: {}".format(col_def, group_val),
    )


def build_group_inputs_filter(df, group_inputs):
    dtypes = get_dtypes(df)

    def _group_filter(group_val):
        for gc, gv in group_val.items():
            classifier = classify_type(dtypes[gc])
            yield group_filter_handler(gc, gv, classifier)

    def _full_filter():
        for group_val in group_inputs:
            filter_vals, label_vals = [], []
            for fv, lv in _group_filter(group_val):
                filter_vals.append(fv)
                label_vals.append(lv)
            yield " and ".join(filter_vals), ", ".join(label_vals)

    full_filters, full_labels = [], []
    for ff, fl in _full_filter():
        full_filters.append(ff)
        full_labels.append(fl)
    return ("({})".format(") or (".join(full_filters)), ", ".join(full_labels))


def retrieve_chart_data(df, *args, **kwargs):
    """
    Retrieves data from a dataframe for x, y, z & group inputs complete with date frequency
    formatting (:meth:`dtale.charts.utils.date_freq_handler`) if specified

    :param df: dataframe that contains data for chart
    :type df: :class:`pandas:pandas.DataFrame`
    :param args: columns to use
    :type args: iterable of str
    :return: dataframe of data required for chart construction
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    freq_handler = date_freq_handler(df)
    cols = flatten_lists([make_list(a) for a in args])
    all_code = []
    all_data = []

    if INDEX_COL in cols:
        cols = [col for col in cols if col != INDEX_COL]
        all_data.append(pd.Series(df.index, index=df.index, name="__index__"))
        all_code.append(
            "\tpd.Series(df.index, index=df.index, name='{}'),".format(INDEX_COL)
        )

    for col in cols:
        if col is not None:
            s, code = freq_handler(col)
            all_data.append(s)
            if code is not None:
                all_code.append(code)
    all_data = pd.concat(all_data, axis=1)
    all_code = ["chart_data = pd.concat(["] + all_code + ["], axis=1)"]
    if len(make_list(kwargs.get("group_val"))):
        filters, labels = build_group_inputs_filter(all_data, kwargs["group_val"])
        all_data = run_query(all_data, filters)
        all_code.append(
            "chart_data = chart_data.query({})".format(triple_quote(filters))
        )
    return all_data, all_code


def check_all_nan(df, cols=None):
    """
    Checker function to test whether all data within a column of a dataframe is :attr:`numpy:numpy.nan`

    :param df: dataframe whose data needs to be checked
    :type df: :class:`pandas:pandas.DataFrame`
    :param cols: columns to test
    :type cols: list of str
    :raises Exception: if all data within a column is :attr:`numpy:numpy.nan`
    """
    for col in cols or df.columns:
        if df[col].isnull().all():
            raise Exception('All data for column "{}" is NaN!'.format(col))


DUPES_MSG = (
    "The grouping [{}] contains duplicates, please specify group or additional filtering or select 'No Aggregation' "
    "from Aggregation drop-down."
)
LIMIT_MSG = "Dataset exceeds {} records, cannot render. Please apply filter..."


def check_exceptions(
    df,
    allow_duplicates,
    unlimited_data=False,
    data_limit=15000,
    limit_msg=LIMIT_MSG,
    dupes_msg=DUPES_MSG,
):
    """
    Checker function to test the output of any chart aggregations to see if it is one of the following:
        - too large to be rendered by web client
        - contains duplicate data points which can't be rendered (ex: multiple points for a single point on the x-axis
          of a bar chart within the same series)

    :param df: dataframe whose data needs to be checked
    :type df: :class:`pandas:pandas.DataFrame`
    :param allow_duplicates: flag to allow duplicates to be ignored (usually for scatter plots)
    :type allow_duplicates: bool
    :param data_limit: maximum rows allowed for chart rendering (default: 15,000)
    :type data_limit: int, optional
    :param limit_msg: error message template
    :type limit_msg: str, optional
    :raises Exception: if any failure condition is met
    """
    if not allow_duplicates and any(df.duplicated()):
        raise ChartBuildingError(dupes_msg.format(", ".join(df.columns)))
    if not unlimited_data and len(df) > data_limit:
        raise ChartBuildingError(limit_msg.format(data_limit))


def build_aggs(y, z=None, agg=None, extended_aggregation=[]):
    z_exists = len(make_list(z))
    agg_cols = make_list(y)
    if z_exists:
        agg_cols = make_list(z)

    aggs = {}
    if not len(extended_aggregation or []):
        aggs[agg] = agg_cols
    else:
        for ext_agg in extended_aggregation:
            aggs[ext_agg["agg"]] = aggs.get(ext_agg["agg"], []) + [ext_agg["col"]]
    return aggs


def build_agg_data(
    df,
    x,
    y,
    inputs,
    agg,
    z=None,
    group_col=None,
    animate_by=None,
    extended_aggregation=[],
):
    """
    Builds aggregated data when an aggregation (sum, mean, max, min...) is selected from the front-end.

    :param df: dataframe that contains data for chart
    :type df: :class:`pandas:pandas.DataFrame`
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param inputs: additional chart configurations (chart_type, group, rolling_win, rolling_comp...)
    :type inputs: dict
    :param agg: points to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :type agg: str
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param group_col: column to use for grouping
    :type group_col: str, optional
    :param animate_by: column to use for break up data into frames for animation
    :type animate_by: str, optional
    :param extended_aggregation: list of configurations that point to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :type extended_aggregation: list, optional
    :return: dataframe of aggregated data
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    z_exists = len(make_list(z))
    idx_cols = make_list(animate_by) + make_list(group_col) + [x]
    agg_cols = make_list(y)
    if z_exists:
        idx_cols += make_list(y)
        agg_cols = make_list(z)

    is_agg = not len(extended_aggregation or [])
    if is_agg and agg == "raw":
        return df, [], agg_cols

    if is_agg and agg == "corr":
        if not z_exists:
            raise NotImplementedError(
                "Correlation aggregation is only available for 3-dimensional charts!"
            )
    if is_agg and agg == "rolling":
        if z_exists:
            raise NotImplementedError(
                "Rolling computations have not been implemented for 3-dimensional charts!"
            )
        window, comp = map(inputs.get, ["rolling_win", "rolling_comp"])
        agg_df = df.set_index(x).rolling(window=window)
        agg_df = pd.DataFrame({c: getattr(agg_df[c], comp)() for c in y})
        agg_df = agg_df.reset_index()
        code = [
            "chart_data = chart_data.set_index('{x}').rolling(window={window})".format(
                x=x, window=window
            ),
            "chart_data = pd.DataFrame({'"
            + ", ".join(
                ["'{c}': chart_data['{c}'].{comp}()".format(c=c, comp=comp) for c in y]
            )
            + "})",
            "chart_data = chart_data.reset_index()",
        ]
        return agg_df, code, y

    aggs = build_aggs(y, z, agg, extended_aggregation)

    if "drop_duplicates" in aggs:
        groups = [
            df[idx_cols + [col]].drop_duplicates() for col in aggs["drop_duplicates"]
        ]
        if len(groups) == 1:
            groups = groups[0]
            code = "chart_data = chart_data[['{}']].drop_duplicates()".format(
                "','".join(idx_cols + aggs["drop_duplicates"])
            )
        else:
            groups = pd.merge(*groups, on=idx_cols, how="outer")
            code = (
                "idx_cols = ['{}']\n"
                "agg_cols = ['{}']\n"
                "chart_data = pd.merge(\n"
                "\t*[chart_data[idx_cols + [col]].drop_duplicates() for col in agg_cols],\n"
                "\ton=idx_cols,\n"
                "\thow='outer'\n"
                ")"
            ).format("','".join(idx_cols), "','".join(aggs["drop_duplicates"]))
        group_cols = [
            "{}|drop_duplicates".format(col) for col in aggs["drop_duplicates"]
        ]
        groups.columns = idx_cols + group_cols
    else:
        groups = df.groupby(idx_cols)
        groups, code, group_cols = compute_aggs(df, groups, aggs, idx_cols, group_col)

    if animate_by is not None:
        full_idx = pd.MultiIndex.from_product(
            [df[c].unique() for c in idx_cols], names=idx_cols
        )
        groups = groups.reindex(full_idx).fillna(0)
        code += [
            "idx_cols = ['{cols}']".format(cols="', '".join(idx_cols)),
            "full_idx = pd.MultiIndex.from_product([df[c].unique() for c in idx_cols], names=idx_cols)"
            "chart_data = chart_data.reindex(full_idx).fillna(0)",
        ]
    if groups.index.name != "index":
        return groups.reset_index(), code, group_cols
    return groups, code, group_cols


def build_final_cols(y, z, agg, extended_aggregation):
    if not len(extended_aggregation or []):
        z = make_list(z)
        cols = y if not len(z) else z
        if agg is not None and agg != "raw":
            return ["{}|{}".format(col, agg) for col in cols]
        return cols
    return [
        "{}|{}".format(ext_agg["col"], ext_agg["agg"])
        for ext_agg in extended_aggregation
    ]


def parse_final_col(final_col):
    y_segs = final_col.split("|")
    if y_segs[-1] in AGGS:
        return "|".join(y_segs[:-1]), y_segs[-1]
    return final_col, None


def compute_aggs(df, groups, aggs, idx_cols, group_col):
    all_code = []
    all_calculated_aggs = []
    all_calculated_cols = []
    for curr_agg, curr_agg_cols in aggs.items():
        chart_data_key = "chart_data_{}".format(curr_agg)
        if curr_agg in ["pctsum", "pctct"]:
            func = "sum" if curr_agg == "pctsum" else "size"
            subidx_cols = [c for c in idx_cols if c not in make_list(group_col)]
            calc_group = getattr(groups[curr_agg_cols], func)()
            calc_group = (
                calc_group
                / getattr(df.groupby(subidx_cols)[curr_agg_cols], func)()
                * 100
            )
            if isinstance(calc_group, pd.Series):
                calc_group.name = curr_agg_cols[0]
                calc_group = calc_group.to_frame()

            if len(curr_agg_cols) > 1:
                groups.columns = curr_agg_cols
            elif len(curr_agg_cols) == 1:
                groups.name = curr_agg_cols[0]
            code = (
                "{chart_data} = chart_data.groupby(['{cols}'])[['{agg_cols}']].{agg}()\n"
                "{chart_data} = {chart_data} / {chart_data}.groupby(['{subidx_cols}']).{agg}()"
            )
            code = code.format(
                cols="', '".join(idx_cols),
                subidx_cols="', '".join(subidx_cols),
                agg_cols="', '".join(make_list(curr_agg_cols)),
                agg=func,
                chart_data=chart_data_key,
            )
            all_code.append(code)
        elif curr_agg in ["first", "last"]:
            agg_func = "head" if curr_agg == "first" else "tail"

            def _build_first_last():
                for col in curr_agg_cols:
                    yield groups[[col]].apply(
                        lambda x: getattr(
                            x.sort_values(by=col, ascending=True), agg_func
                        )(1)
                    ).reset_index(-1, drop=True)

            calc_group = pd.concat(list(_build_first_last()), axis=1)
            all_code += [
                (
                    "groups = chart_data.groupby(['{cols}'])\n"
                    "\ndef _build_first_last():\n"
                    "\tfor col in ['{agg_cols}']:\n"
                    "\t\tyield groups[[col]].apply(\n"
                    "\t\t\tlambda x: x.sort_values(by=col, ascending=True).{agg_func}(1)\n"
                    "\t\t)\n\n"
                    "{chart_data} = pd.DataFrame(list(_build_first_last()), columns=['{agg_cols}'])"
                ).format(
                    cols="', '".join(idx_cols),
                    agg_cols="', '".join(curr_agg_cols),
                    agg_func=agg_func,
                    chart_data=chart_data_key,
                )
            ]
        else:
            calc_group = getattr(groups[curr_agg_cols], curr_agg)()
            all_code += [
                "{chart_data} = chart_data.groupby(['{cols}'])[['{agg_cols}']].{agg}()".format(
                    cols="', '".join(idx_cols),
                    agg_cols="', '".join(curr_agg_cols),
                    agg=curr_agg,
                    chart_data=chart_data_key,
                )
            ]
        final_cols = ["{}|{}".format(col, curr_agg) for col in calc_group.columns]
        all_code.append(
            "{chart_data}.columns = ['{cols}']".format(
                chart_data=chart_data_key, cols="','".join(final_cols)
            )
        )
        calc_group.columns = final_cols
        all_calculated_aggs.append(calc_group)
        all_calculated_cols += final_cols

    if len(all_calculated_aggs) > 1:
        all_code.append(
            "chart_data = pd.concat([{chart_data}], axis=1).reset_index()".format(
                chart_data=", ".join(["chart_data_{}".format(k) for k in aggs])
            )
        )
        return pd.concat(all_calculated_aggs, axis=1), all_code, all_calculated_cols
    all_code.append(
        "chart_data = chart_data_{}.reset_index()".format(list(aggs.keys())[0])
    )
    return all_calculated_aggs[0], all_code, all_calculated_cols


def build_base_chart(
    raw_data,
    x,
    y,
    group_col=None,
    group_type=None,
    group_val=None,
    bins_val=None,
    bin_type=None,
    agg=None,
    extended_aggregation=[],
    allow_duplicates=False,
    return_raw=False,
    unlimited_data=False,
    animate_by=None,
    cleaners=[],
    **kwargs
):
    """
    Helper function to return data for 'chart-data' & 'correlations-ts' endpoints.  Will return a dictionary of
    dictionaries (one for each series) which contain the data for the x & y axes of the chart as well as the minimum &
    maximum of all the series for the y-axis.  If there is only one series (no group_col specified) the only key in the
    dictionary of series data will be 'all' otherwise the keys will be the values of the groups.

    :param raw_data: dataframe to be used for chart
    :type raw_data: :class:`pandas:pandas.DataFrame`
    :param x: column to be used as x-axis of chart
    :type x: str
    :param y: column to be used as y-axis of chart
    :type y: list of strings
    :param group: comma-separated string of columns to group chart data by
    :type group: str, optional
    :param agg: points to a specific function that can be applied to
                        :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                        median, min, max, std, var, mad, prod, sum
    :type agg: str, optional
    :param extended_aggregation: list of configurations that point to a specific function that can be applied to
                        :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                        median, min, max, std, var, mad, prod, sum
    :type agg: list, optional
    :param allow_duplicates: flag to allow duplicates to be ignored (usually for scatter plots)
    :type allow_duplicates: bool, optional
    :return: dict
    """
    group_fmt_overrides = {
        "I": lambda v, as_string: json_int(v, as_string=as_string, fmt="{}")
    }
    data, code = retrieve_chart_data(
        raw_data, x, y, kwargs.get("z"), group_col, animate_by, group_val=group_val
    )
    cleaners = cleaners or []
    if len(cleaners):
        for col in data.columns:
            if classify_type(find_dtype(data[col])) == "S":
                code.append("s = chart_data['{}']".format(col))
                cleaned_col, cleaned_code = handle_cleaners(
                    data[col], ",".join(cleaners)
                )
                data.loc[:, col] = cleaned_col
                code += cleaned_code
                code.append("chart_data.loc[:, '{}'] = s".format(col))

    x_col = str("x")
    if x is None:
        x = x_col
        data.loc[:, x_col] = range(
            1, len(data) + 1
        )  # sequential integers: 1, 2, ..., N
    y_cols = make_list(y)

    z_col = kwargs.get("z")
    z_cols = make_list(z_col)
    y_cols = [str(col) for col in y_cols]
    is_z = len(z_cols) > 0
    y_group_cols = y_cols if is_z else []
    sort_cols = y_group_cols
    final_cols = y_cols + z_cols
    if group_col is not None and len(group_col):
        for col in make_list(group_col):
            classifier = classify_type(find_dtype(data[col]))
            if classifier == "F" or (classifier == "I" and group_type == "bins"):
                if bin_type == "width":
                    data.loc[:, col] = pd.qcut(
                        data[col], q=bins_val, duplicates="drop"
                    ).astype("str")
                    code.append(
                        (
                            "chart_data.loc[:, '{col}'] = pd.qcut(chart_data['{col}'], q={bins}, duplicates=\"drop\")"
                        ).format(col=col, bins=bins_val)
                    )
                else:
                    bins_data = data[col].dropna()
                    npt = len(bins_data)
                    equal_freq_bins = np.interp(
                        np.linspace(0, npt, bins_val + 1),
                        np.arange(npt),
                        np.sort(bins_data),
                    )
                    data.loc[:, col] = pd.cut(
                        data[col], bins=equal_freq_bins, duplicates="drop"
                    ).astype("str")
                    code.append(
                        (
                            "bins_data = data['{col}'].dropna()\n"
                            "npt = len(bins_data)\n"
                            "equal_freq_bins = np.interp(np.linspace(0, npt, {bins}), np.arange(npt), "
                            "np.sort(bins_data))\n"
                            "chart_data.loc[:, '{col}'] = pd.cut(chart_data['{col}'], bins=equal_freq_bins, "
                            'duplicates="drop")'
                        ).format(col=col, bins=bins_val + 1)
                    )

        main_group = group_col
        if animate_by is not None:
            main_group = [animate_by] + main_group
        sort_cols = main_group + [x] + sort_cols
        data = data.sort_values(sort_cols)
        code.append(
            "chart_data = chart_data.sort_values(['{cols}'])".format(
                cols="', '".join(sort_cols)
            )
        )
        check_all_nan(data)
        data = data.rename(columns={x: x_col})
        code.append(
            "chart_data = chart_data.rename(columns={'" + x + "': '" + x_col + "'})"
        )

        if agg is not None or len(extended_aggregation):
            data, agg_code, final_cols = build_agg_data(
                data,
                x_col,
                y_cols,
                kwargs,
                agg,
                z=z_col,
                group_col=group_col,
                animate_by=animate_by,
                extended_aggregation=extended_aggregation,
            )
            code += agg_code

        group_vals = data[group_col].drop_duplicates()
        if len(group_vals) > MAX_GROUPS:
            dtypes = get_dtypes(group_vals)
            group_fmts = {
                c: find_dtype_formatter(dtypes[c], overrides=group_fmt_overrides)
                for c in group_col
            }

            group_f, _ = build_formatters(group_vals)
            group_vals = group_f.format_lists(group_vals)
            group_vals = pd.DataFrame(group_vals, columns=group_col)
            msg = (
                "Group ({}) contains more than {} unique values, more groups than that will make the chart unreadable. "
                'You can choose specific groups to display from then "Group(s)" dropdown above. The available group(s) '
                "are listed below:\n\n{}"
            ).format(
                ", ".join(group_col), MAX_GROUPS, group_vals.to_string(index=False)
            )
            raise ChartBuildingError(msg, group_vals.to_string(index=False))

        data = data.dropna()
        if return_raw:
            return data.rename(columns={x_col: x})
        code.append("chart_data = chart_data.dropna()")
        data_f, range_f = build_formatters(data)
        ret_data = dict(
            data={},
            min={
                col: fmt(data[col].min(), None)
                for _, col, fmt in range_f.fmts
                if col in [x_col] + final_cols
            },
            max={
                col: fmt(data[col].max(), None)
                for _, col, fmt in range_f.fmts
                if col in [x_col] + final_cols
            },
        )

        dtypes = get_dtypes(data)
        group_fmts = {
            c: find_dtype_formatter(dtypes[c], overrides=group_fmt_overrides)
            for c in group_col
        }

        def _load_groups(df):
            for group_val, grp in df.groupby(group_col):

                def _group_filter():
                    for gv, gc in zip(make_list(group_val), group_col):
                        classifier = classify_type(dtypes[gc])
                        yield group_filter_handler(
                            gc, group_fmts[gc](gv, as_string=True), classifier
                        )

                final_group_filter, final_group_label = [], []
                for gf, gl in _group_filter():
                    final_group_filter.append(gf)
                    final_group_label.append(gl)
                group_filter = " and ".join(final_group_filter)
                group_label = "({})".format(", ".join(final_group_label))
                data = data_f.format_lists(grp)
                data["_filter_"] = group_filter
                yield group_label, data

        if animate_by is not None:
            frame_fmt = find_dtype_formatter(
                dtypes[animate_by], overrides=group_fmt_overrides
            )
            ret_data["frames"] = []
            for frame_key, frame in data.sort_values(animate_by).groupby(animate_by):
                ret_data["frames"].append(
                    dict(
                        data=dict(_load_groups(frame)),
                        name=frame_fmt(frame_key, as_string=True),
                    )
                )
            ret_data["data"] = copy.deepcopy(ret_data["frames"][-1]["data"])
        else:
            ret_data["data"] = dict(_load_groups(data))
        return ret_data, code

    main_group = [x]
    if animate_by is not None:
        main_group = [animate_by] + main_group
    sort_cols = main_group + sort_cols
    data = data.sort_values(sort_cols)
    code.append(
        "chart_data = chart_data.sort_values(['{cols}'])".format(
            cols="', '".join(sort_cols)
        )
    )
    check_all_nan(data)
    data = data[main_group + final_cols]

    data = data.rename(columns={x: x_col})
    main_group = [x_col if c == x else c for c in main_group]
    code.append(
        "chart_data = chart_data.rename(columns={'" + x + "': '" + x_col + "'})"
    )

    # convert booleans into integers for aggregation
    for col in z_cols or y_cols:
        classifier = classify_type(find_dtype(data[col]))
        if classifier == "B":
            data.loc[:, col] = data[col].astype("int")

    if agg is not None or len(extended_aggregation):
        data, agg_code, final_cols = build_agg_data(
            data,
            x_col,
            y_cols,
            kwargs,
            agg,
            z=z_col,
            animate_by=animate_by,
            extended_aggregation=extended_aggregation,
        )
        code += agg_code
    data = data.dropna()

    if return_raw:
        return data.rename(columns={x_col: x})
    code.append("chart_data = chart_data.dropna()")

    dupe_cols = main_group + y_group_cols
    data_limit = global_state.get_chart_settings()[
        "3d_points" if is_z or animate_by is not None else "scatter_points"
    ]
    check_exceptions(
        data[dupe_cols].rename(columns={x_col: x}),
        allow_duplicates or agg in ["raw", "drop_duplicates"],
        unlimited_data=unlimited_data,
        data_limit=data_limit,
    )
    data_f, range_f = build_formatters(data)

    ret_data = dict(
        min={
            col: fmt(data[col].min(), None)
            for _, col, fmt in range_f.fmts
            if col in [x_col] + y_group_cols + final_cols
        },
        max={
            col: fmt(data[col].max(), None)
            for _, col, fmt in range_f.fmts
            if col in [x_col] + y_group_cols + final_cols
        },
    )
    if animate_by is not None:
        frame_fmt = find_dtype_formatter(
            find_dtype(data[animate_by]), overrides=group_fmt_overrides
        )
        ret_data["frames"] = []
        for frame_key, frame in data.sort_values(animate_by).groupby(animate_by):
            ret_data["frames"].append(
                dict(
                    data={str("all"): data_f.format_lists(frame)},
                    name=frame_fmt(frame_key, as_string=True),
                )
            )
        ret_data["data"] = copy.deepcopy(ret_data["frames"][-1]["data"])
    else:
        ret_data["data"] = {str("all"): data_f.format_lists(data)}
    return ret_data, code


WEEKDAY_MAP = {
    idx: day
    for idx, day in enumerate(["Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun"])
}


def weekday_tick_handler(col_data, col):
    """
    Output handler for datetime data which needs to be returned as weekdays.  If the column definition ends with '|WD'
    then the integer values in 'data' will be mapped to their standard weekday test (Mon, Tues, Wed, Thur, Fri, Sat,
    Sun)

    :param col_data: iterable of values within column
    :type col_data: list
    :param col: column definition
    :type col: str
    :return: formatted column data
    :rtype: list
    """
    if col.endswith("|WD"):
        return [WEEKDAY_MAP[d] for d in col_data]
    return col_data


def find_group_vals(df, group_cols):
    group_vals, _ = retrieve_chart_data(df, group_cols)
    group_vals = group_vals.drop_duplicates().sort_values(group_cols)
    group_f, _ = build_formatters(group_vals, nan_display="NaN")
    return group_f.format_dicts(group_vals.itertuples())
