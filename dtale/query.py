from six import PY3

import dtale.global_state as global_state


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


def run_query(df, query, context_vars=None, ignore_empty=False):
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
    :return: filtered dataframe
    """
    if (query or "") == "":
        return df

    # https://stackoverflow.com/a/40083013/12616360 only supporting filter cleanup for python 3+
    if PY3:
        invalid_column_names = [x for x in df.columns.values if not x.isidentifier()]

        # Make replacements in the query and keep track
        # NOTE: This method fails if the frame has columns called REPL_0 etc.
        replacements = dict()
        final_query = str(query)
        for cn in invalid_column_names:
            r = "REPL_{}".format(str(invalid_column_names.index(cn)))
            final_query = final_query.replace(cn, r)
            replacements[cn] = r

        inv_replacements = {replacements[k]: k for k in replacements.keys()}
        df = df.rename(columns=replacements)
        df = df.query(final_query, local_dict=context_vars or {})
        df = df.rename(columns=inv_replacements)
    else:
        df = df.query(query, local_dict=context_vars or {})

    if not len(df) and not ignore_empty:
        raise Exception('query "{}" found no data, please alter'.format(query))
    return df
