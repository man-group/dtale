import pandas as pd
from pkg_resources import parse_version

import dtale.global_state as global_state


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
    return " and ".join(query_segs)


def run_query(df, query, context_vars=None, ignore_empty=False, pct=100):
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
            return df.sample(frac=pct / 100.0)
        return df

    if (query or "") == "":
        return _load_pct(df)

    is_pandas25 = parse_version(pd.__version__) >= parse_version("0.25.0")
    df = df.query(
        query if is_pandas25 else query.replace("`", ""), local_dict=context_vars or {}
    )

    if not len(df) and not ignore_empty:
        raise Exception('query "{}" found no data, please alter'.format(query))

    return _load_pct(df)
