import pandas as pd

import dtale.global_state as global_state

from dtale.pandas_util import check_pandas_version
from dtale.utils import format_data, get_bool_arg


def build_col_key(col):
    # Use backticks for pandas >= 0.25 to handle column names with spaces or protected words
    return "`{}`".format(col)


def build_query(data_id, query=None):
    curr_settings = global_state.get_settings(data_id) or {}
    return inner_build_query(curr_settings, query)


def inner_build_query(settings, query=None):
    query_segs = []
    for p in ["columnFilters", "outlierFilters"]:
        curr_filters = settings.get(p) or {}
        for col, filter_cfg in curr_filters.items():
            query_segs.append(filter_cfg["query"])
    if query not in [None, ""]:
        query_segs.append(query)
    joined_query_segs = " and ".join(query_segs)
    if joined_query_segs and settings.get("invertFilter", False):
        joined_query_segs = "~({})".format(joined_query_segs)
    return joined_query_segs


def load_index_filter(data_id):
    curr_settings = global_state.get_settings(data_id) or {}
    column_filters = curr_settings.get("columnFilters") or {}
    indexes = curr_settings.get("indexes", [])
    for col in indexes:
        cfg = column_filters.get(col)
        if cfg:
            start, end = (cfg.get(p) for p in ["start", "end"])
            if start and end:
                return {"date_range": [pd.Timestamp(start), pd.Timestamp(end)]}
            elif start:
                return {"date_range": [pd.Timestamp(start), None]}
            elif end:
                return {"date_range": [None, pd.Timestamp(end)]}
    return {}


def build_query_builder(data_id):
    from arcticdb import QueryBuilder

    curr_settings = global_state.get_settings(data_id) or {}
    q = QueryBuilder()
    result = inner_build_query_builder(curr_settings, q)
    if result is not None:
        return q[result]
    return None


def inner_build_query_builder(settings, query_builder):
    from dtale.column_filters import ArcticDBColumnFilter

    result = None
    for p in ["columnFilters", "outlierFilters"]:
        curr_filters = settings.get(p) or {}
        filter_items = list(curr_filters.items())
        idx = 0
        if len(filter_items):
            while result is None and idx < len(filter_items):
                col, filter_cfg = filter_items[idx]
                if col in settings.get("indexes", []):
                    idx += 1
                    continue
                fltr = ArcticDBColumnFilter(filter_cfg)
                result = fltr.builder.update_query_builder(query_builder)
                idx += 1
            for col, filter_cfg in filter_items[idx:]:
                if col in settings.get("indexes", []):
                    continue
                fltr = ArcticDBColumnFilter(filter_cfg)
                query_seg = fltr.builder.update_query_builder(query_builder)
                if query_seg is not None:
                    result &= query_seg

    if result is not None and settings.get("invertFilter", False):
        result = ~result
    return result


def run_query(
    df,
    query,
    context_vars=None,
    ignore_empty=False,
    pct=100,
    pct_type="random",
    stratified_group=None,
    highlight_filter=False,
):
    """
    Utility function for running :func:`pandas:pandas.DataFrame.query` . This function contains extra logic to
    handle when column names contain special characters.  Looks like pandas will be handling this in a future
    version: https://github.com/pandas-dev/pandas/issues/27017

    The logic to handle these special characters in the meantime is only available in Python 3+

    :param df: input dataframe
    :type df: :class:`pandas:pandas.DataFrame`
    :param query: query string
    :type query: str
    :param context_vars: dictionary of user-defined variables which can be referenced by name in query strings
    :type context_vars: dict, optional
    :param pct: random percentage of dataframe to load
    :type pct: int, optional
    :param stratified_group: the grouping to use when load a stratified random sample of dataframe
    :type stratified_group: str, optional
    :param highlight_filter: if true, then highlight which rows will be filtered rather than drop them
    :type highlight_filter: boolean, optional
    :return: filtered dataframe
    """

    def _load_pct(df):
        if pct is not None and pct < 100:
            if pct_type == "random":
                return df.sample(frac=pct / 100.0)
            elif pct_type == "stratified":
                sampling_rate = pct / 100.0
                num_rows = int((df.shape[0] * sampling_rate) // 1)
                num_classes = len(df[stratified_group].unique())
                num_rows_per_class = int(max(1, ((num_rows / num_classes) // 1)))
                return df.groupby(stratified_group, group_keys=False).apply(
                    lambda x: x.sample(min(len(x), num_rows_per_class))
                )
            records = int(len(df) * (pct / 100.0))
            return df.head(records) if pct_type == "head" else df.tail(records)

        return df

    if (query or "") == "":
        if highlight_filter:
            return _load_pct(df), []
        return _load_pct(df)

    is_pandas25 = check_pandas_version("0.25.0")
    curr_app_settings = global_state.get_app_settings()
    engine = curr_app_settings.get("query_engine", "python")
    filtered_indexes = []
    if highlight_filter:
        filtered_indexes = set(
            df.query(
                query if is_pandas25 else query.replace("`", ""),
                local_dict=context_vars or {},
                engine=engine,
            ).index
        )
    else:
        df = df.query(
            query if is_pandas25 else query.replace("`", ""),
            local_dict=context_vars or {},
            engine=engine,
        )

    if not len(df) and not ignore_empty:
        raise Exception('query "{}" found no data, please alter'.format(query))

    if highlight_filter:
        return _load_pct(df), filtered_indexes
    return _load_pct(df)


def handle_predefined(data_id, df=None):
    import dtale.predefined_filters as predefined_filters

    df = global_state.get_data(data_id) if df is None else df
    filters = predefined_filters.get_filters()
    if not filters:
        return df

    curr_settings = global_state.get_settings(data_id) or {}
    filter_values = curr_settings.get("predefinedFilters")
    if not filter_values:
        return df

    for f in filters:
        if f.name in filter_values:
            filter_value = filter_values[f.name]
            if (
                filter_value.get("active", True)
                and filter_value.get("value") is not None
            ):
                df = f.handler(df, filter_value["value"])
    return df


def load_filterable_data(data_id, req, query=None, columns=None):
    filtered = get_bool_arg(req, "filtered")
    if global_state.is_arcticdb:
        query_builder = build_query_builder(data_id)
        instance = global_state.store.get(data_id)
        if filtered:
            data = instance.load_data(query_builder=query_builder, columns=columns)
        else:
            data = instance.load_data(columns=columns)
        data, _ = format_data(data)
        return data
    if filtered:
        final_query = query or build_query(data_id, global_state.get_query(data_id))
        return run_query(
            handle_predefined(data_id),
            final_query,
            global_state.get_context_variables(data_id),
            ignore_empty=True,
        )
    return global_state.get_data(data_id)
