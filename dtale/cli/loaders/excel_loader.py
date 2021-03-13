import pandas as pd

from dtale.app import show
from dtale.cli.clickutils import get_loader_options, handle_path, loader_prop_keys

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "excel"
LOADER_PROPS = [
    dict(name="path", help="path to Excel (.xls,xlsx) file"),
    dict(name="proxy", help="proxy URL if you're passing in a URL for --excel-path"),
    dict(
        name="parse_dates",
        help="comma-separated string of column names which should be parsed as dates",
    ),
    dict(name="index_col", help="Column(s) to use as the row labels or the Datafame"),
    dict(name="sheet", help="Name of the sheet to load from your Excel file"),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def load_file(sheet_name=None, **kwargs):
    path = kwargs.pop("path")
    engine = "xlrd" if path.endswith("xls") else "openpyxl"
    path = handle_path(path, kwargs)
    dfs = pd.read_excel(
        path,
        sheet_name=sheet_name,
        engine=engine,
        **{k: v for k, v in kwargs.items() if k in loader_prop_keys(LOADER_PROPS)}
    )
    if dfs is None or not len(dfs):
        raise Exception("Failed to load Excel file. Returned no data.")
    return dfs


def loader_func(**kwargs):
    sheet_name = kwargs.pop("sheet", None)
    dfs = load_file(sheet_name=sheet_name, **kwargs)
    if sheet_name:
        if sheet_name not in dfs:
            raise Exception(
                "Excel file loaded but there was no sheet named '{}'.".format(
                    sheet_name
                )
            )
        return dfs[sheet_name]
    # this is required because there is no support for loading multiple datasets at once from the CLI
    # I can add this later...
    return dfs[list(dfs.keys())[0]]


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    Excel implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for CSV implementation
    """
    excel_opts = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in excel_opts.values() if f]):

        def _excel_loader():
            excel_arg_parsers = {  # TODO: add additional arg parsers
                "parse_dates": lambda v: v.split(",") if v else None
            }
            kwargs = {
                k: excel_arg_parsers.get(k, lambda v: v)(v)
                for k, v in excel_opts.items()
            }
            return loader_func(**kwargs)

        return _excel_loader
    return None
