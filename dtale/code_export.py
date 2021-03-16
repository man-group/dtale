import dtale.global_state as global_state

from dtale.utils import triple_quote

CHART_EXPORT_CODE = (
    "\n# If you're having trouble viewing your chart in your notebook try passing your 'chart' into this snippet:\n"
    "#\n"
    "# from plotly.offline import iplot, init_notebook_mode\n"
    "#\n"
    "# init_notebook_mode(connected=True)\n"
    "# chart.pop('id', None) # for some reason iplot does not like 'id'\n"
    "# iplot(chart)"
)


def build_code_export(data_id, imports="import pandas as pd\n\n", query=None):
    """
    Helper function for building a string representing the code that was run to get the data you are viewing to that
    point.

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param imports: string representing the imports at the top of the code string
    :type imports: string, optional
    :param query: pandas dataframe query string
    :type query: str, optional
    :return: python code string
    """
    history = global_state.get_history(data_id) or []
    settings = global_state.get_settings(data_id) or {}
    ctxt_vars = global_state.get_context_variables(data_id)

    startup_code = settings.get("startup_code") or ""
    if startup_code and not startup_code.endswith("\n"):
        startup_code += "\n"
    xarray_setup = ""
    if global_state.get_dataset(data_id) is not None:
        xarray_dims = global_state.get_dataset_dim(data_id)
        if len(xarray_dims):
            xarray_setup = (
                "df = ds.sel({selectors}).to_dataframe()\n"
                "df = df.reset_index().drop('index', axis=1, errors='ignore')\n"
                "df = df.set_index(list(ds.dims.keys()))\n"
            ).format(
                selectors=", ".join(
                    "{}='{}'".format(k, v) for k, v in xarray_dims.items()
                )
            )
        else:
            xarray_setup = (
                "df = ds.to_dataframe()\n"
                "df = df.reset_index().drop('index', axis=1, errors='ignore')\n"
                "df = df.set_index(list(ds.dims.keys()))\n"
            )
    startup_str = (
        "# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'\n\n"
        "{imports}"
        "{xarray_setup}"
        "{startup}"
        "if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):\n"
        "\tdf = df.to_frame(index=False)\n\n"
        "# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required\n"
        "df = df.reset_index().drop('index', axis=1, errors='ignore')\n"
        "df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers\n"
    ).format(imports=imports, xarray_setup=xarray_setup, startup=startup_code)
    final_history = [startup_str] + history
    final_query = query
    if final_query is None:
        final_query = settings.get("query")

    if final_query is not None and final_query != "":
        if len(ctxt_vars or {}):
            final_history.append(
                (
                    "\n# this is injecting any context variables you may have passed into 'dtale.show'\n"
                    "import dtale.global_state as dtale_global_state\n"
                    "\n# DISCLAIMER: running this line in a different process than the one it originated will produce\n"
                    "#             differing results\n"
                    "ctxt_vars = dtale_global_state.get_context_variables('{data_id}')\n\n"
                    "df = df.query({query}, local_dict=ctxt_vars)\n"
                ).format(query=triple_quote(final_query), data_id=data_id)
            )
        else:
            final_history.append(
                "df = df.query({})\n".format(triple_quote(final_query))
            )
    elif settings.get("query"):
        final_history.append(
            "df = df.query({})\n".format(triple_quote(settings["query"]))
        )
    if "sort" in settings:
        cols, dirs = [], []
        for col, dir in settings["sort"]:
            cols.append(col)
            dirs.append("True" if dir == "ASC" else "False")
        final_history.append(
            "df = df.sort_values(['{cols}'], ascending=[{dirs}])\n".format(
                cols=", ".join(cols), dirs="', '".join(dirs)
            )
        )
    return final_history
