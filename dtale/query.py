import pandas as pd
from pkg_resources import parse_version

import dtale.global_state as global_state

from dtale.utils import get_bool_arg


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


def run_query(
    df, query, context_vars=None, ignore_empty=False, pct=100, pct_type="random"
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
    :return: filtered dataframe
    """

    def _load_pct(df):
        if pct is not None and pct < 100:
            if pct_type == "random":
                return df.sample(frac=pct / 100.0)
            records = int(len(df) * (pct / 100.0))
            return df.head(records) if pct_type == "head" else df.tail(records)

        return df

    if (query or "") == "":
        return _load_pct(df)

    is_pandas25 = parse_version(pd.__version__) >= parse_version("0.25.0")
    curr_app_settings = global_state.get_app_settings()
    engine = curr_app_settings.get("query_engine", "python")
    df = df.query(
        query if is_pandas25 else query.replace("`", ""),
        local_dict=context_vars or {},
        engine=engine,
    )

    if not len(df) and not ignore_empty:
        raise Exception('query "{}" found no data, please alter'.format(query))

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


def load_filterable_data(data_id, req, query=None):
    filtered = get_bool_arg(req, "filtered")
    curr_settings = global_state.get_settings(data_id) or {}
    if filtered:
        final_query = query or build_query(data_id, curr_settings.get("query"))
        return run_query(
            handle_predefined(data_id),
            final_query,
            global_state.get_context_variables(data_id),
            ignore_empty=True,
        )
    return global_state.get_data(data_id)
