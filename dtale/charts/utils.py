import copy

import pandas as pd

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
    run_query,
    triple_quote,
)

YAXIS_CHARTS = ["line", "bar", "scatter"]
ZAXIS_CHARTS = ["heatmap", "3d_scatter", "surface"]
MAX_GROUPS = 30
MAPBOX_TOKEN = None


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

    if chart_type == "treemap":
        treemap_props = ["treemap_value", "treemap_label"]
        return all(inputs.get(p) is not None for p in treemap_props)

    if x is None or not len(y or []):
        return False

    if chart_type in ZAXIS_CHARTS and z is None:
        return False

    if inputs.get("agg") == "rolling" and (
        inputs.get("window") is None or inputs.get("rolling_comp") is None
    ):
        return False
    return True


def build_formatters(df):
    """
    Helper around :meth:`dtale.utils.grid_formatters` that will build a formatter for the data being fed into a chart as
    well as a formatter for the min/max values for each column used in the chart data.

    :param df: dataframe which contains column names and data types for formatters
    :type df: :class:`pandas:pandas.DataFrame`
    :return: json formatters for chart data and min/max values for each column used in the chart
    :rtype: (:class:`dtale.utils.JSONFormatter`, :class:`dtale.utils.JSONFormatter`)
    """
    cols = grid_columns(df)
    data_f = grid_formatter(cols, nan_display=None)
    overrides = {"F": lambda f, i, c: f.add_float(i, c, precision=2)}
    range_f = grid_formatter(cols, overrides=overrides, nan_display=None)
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
            return "{col} != {col}".format(col=col)
        if freq == "WD":
            return "{}.dt.dayofweek == {}".format(col, group_val)
        elif freq == "H2":
            return "{}.dt.hour == {}".format(col, group_val)
        elif freq == "H":
            ts_val = pd.Timestamp(group_val)
            return "{col}.dt.date == '{day}' and {col}.dt.hour == {hour}".format(
                col=col, day=ts_val.strftime("%Y%m%d"), hour=ts_val.hour
            )
        elif freq == "D":
            ts_val = convert_date_val_to_date(group_val)
            return "{col}.dt.date == '{day}'".format(
                col=col, day=ts_val.strftime("%Y%m%d")
            )
        elif freq == "W":
            ts_val = convert_date_val_to_date(group_val)
            return "{col}.dt.year == {year} and {col}.dt.week == {week}".format(
                col=col, year=ts_val.year, week=ts_val.week
            )
        elif freq == "M":
            ts_val = convert_date_val_to_date(group_val)
            return "{col}.dt.year == {year} and {col}.dt.month == {month}".format(
                col=col, year=ts_val.year, month=ts_val.month
            )
        elif freq == "Q":
            ts_val = convert_date_val_to_date(group_val)
            return "{col}.dt.year == {year} and {col}.dt.quarter == {quarter}".format(
                col=col, year=ts_val.year, quarter=ts_val.quarter
            )
        elif freq == "Y":
            ts_val = convert_date_val_to_date(group_val)
            return "{col}.dt.year == {year}".format(col=col, year=ts_val.year)
    if group_val == "nan":
        return "{col} != {col}".format(col=col_def)
    if group_classifier in ["I", "F"]:
        return "{col} == {val}".format(col=col_def, val=group_val)
    if group_classifier == "D":
        group_val = convert_date_val_to_date(group_val).strftime("%Y%m%d")
    return "{col} == '{val}'".format(col=col_def, val=group_val)


def build_group_inputs_filter(df, group_inputs):
    dtypes = get_dtypes(df)

    def _group_filter(group_val):
        for gc, gv in group_val.items():
            classifier = classify_type(dtypes[gc])
            yield group_filter_handler(gc, gv, classifier)

    def _full_filter():
        for group_val in group_inputs:
            group_filter = " and ".join(list(_group_filter(group_val)))
            yield group_filter

    filters = list(_full_filter())
    return "({})".format(") or (".join(filters))


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
    for col in cols:
        if col is not None:
            s, code = freq_handler(col)
            all_data.append(s)
            if code is not None:
                all_code.append(code)
    all_data = pd.concat(all_data, axis=1)
    all_code = ["chart_data = pd.concat(["] + all_code + ["], axis=1)"]
    if len(make_list(kwargs.get("group_val"))):
        filters = build_group_inputs_filter(all_data, kwargs["group_val"])
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
    "{} contains duplicates, please specify group or additional filtering or select 'No Aggregation' from"
    " Aggregation drop-down."
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


def build_agg_data(df, x, y, inputs, agg, z=None, group_col=None, animate_by=None):
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
    :return: dataframe of aggregated data
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    if agg == "raw":
        return df, []
    z_exists = len(make_list(z))
    if agg == "corr":
        if not z_exists:
            raise NotImplementedError(
                "Correlation aggregation is only available for 3-dimensional charts!"
            )
    if agg == "rolling":
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
        return agg_df, code

    idx_cols = make_list(animate_by) + make_list(group_col) + [x]
    agg_cols = make_list(y)
    if z_exists:
        idx_cols += make_list(y)
        agg_cols = make_list(z)

    groups = df.groupby(idx_cols)
    if agg in ["pctsum", "pctct"]:
        func = "sum" if agg == "pctsum" else "size"
        subidx_cols = [c for c in idx_cols if c not in make_list(group_col)]
        groups = getattr(groups[agg_cols], func)()
        groups = groups / getattr(df.groupby(subidx_cols)[agg_cols], func)() * 100
        if len(agg_cols) > 1:
            groups.columns = agg_cols
        elif len(agg_cols) == 1:
            groups.name = agg_cols[0]
        code = (
            "chart_data = chart_data.groupby(['{cols}'])[['{agg_cols}']].{agg}()\n"
            "chart_data = chart_data / chart_data.groupby(['{subidx_cols}']).{agg}()\n"
            "chart_data = chart_data.reset_index()"
        )
        code = code.format(
            cols="', '".join(idx_cols),
            subidx_cols="', '".join(subidx_cols),
            agg_cols="', '".join(make_list(agg_cols)),
            agg=func,
        )
        code = [code]
    else:
        groups = getattr(groups[agg_cols], agg)()
        code = [
            "chart_data = chart_data.groupby(['{cols}'])[['{agg_cols}']].{agg}().reset_index()".format(
                cols="', '".join(idx_cols), agg_cols="', '".join(agg_cols), agg=agg
            )
        ]
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
    return groups.reset_index(), code


def build_base_chart(
    raw_data,
    x,
    y,
    group_col=None,
    group_val=None,
    agg=None,
    allow_duplicates=False,
    return_raw=False,
    unlimited_data=False,
    animate_by=None,
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
    x_col = str("x")
    y_cols = make_list(y)
    z_col = kwargs.get("z")
    z_cols = make_list(z_col)
    sort_cols = y_cols if len(z_cols) else []
    if group_col is not None and len(group_col):
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
        if agg is not None:
            data, agg_code = build_agg_data(
                data,
                x_col,
                y_cols,
                kwargs,
                agg,
                z=z_col,
                group_col=group_col,
                animate_by=animate_by,
            )
            code += agg_code
        MAX_GROUPS = 30
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
                if col in [x_col] + y_cols + z_cols
            },
            max={
                col: fmt(data[col].max(), None)
                for _, col, fmt in range_f.fmts
                if col in [x_col] + y_cols + z_cols
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

                group_filter = " and ".join(list(_group_filter()))
                yield group_filter, data_f.format_lists(grp)

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
    y_cols = [str(y_col) for y_col in y_cols]
    data = data[main_group + y_cols + z_cols]

    data = data.rename(columns={x: x_col})
    main_group = [x_col if c == x else c for c in main_group]
    code.append(
        "chart_data = chart_data.rename(columns={'" + x + "': '" + x_col + "'})"
    )

    if agg is not None:
        data, agg_code = build_agg_data(
            data, x_col, y_cols, kwargs, agg, z=z_col, animate_by=animate_by
        )
        code += agg_code
    data = data.dropna()
    if return_raw:
        return data.rename(columns={x_col: x})
    code.append("chart_data = chart_data.dropna()")

    dupe_cols = main_group + (y_cols if len(z_cols) else [])
    check_exceptions(
        data[dupe_cols].rename(columns={x_col: x}),
        allow_duplicates or agg == "raw",
        unlimited_data=unlimited_data,
        data_limit=40000 if len(z_cols) or animate_by is not None else 15000,
    )
    data_f, range_f = build_formatters(data)

    ret_data = dict(
        min={
            col: fmt(data[col].min(), None)
            for _, col, fmt in range_f.fmts
            if col in [x_col] + y_cols + z_cols
        },
        max={
            col: fmt(data[col].max(), None)
            for _, col, fmt in range_f.fmts
            if col in [x_col] + y_cols + z_cols
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
    group_f, _ = build_formatters(group_vals)
    return group_f.format_dicts(group_vals.itertuples())
