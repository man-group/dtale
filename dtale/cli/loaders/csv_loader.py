import pandas as pd

from dtale.app import show
from dtale.cli.clickutils import get_loader_options, handle_path, loader_prop_keys

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "csv"
LOADER_PROPS = [
    dict(name="path", help="path to CSV file"),
    dict(name="proxy", help="proxy URL if you're passing in a URL for --csv-path"),
    dict(
        name="parse_dates",
        help="comma-separated string of column names which should be parsed as dates",
    ),
    dict(name="index_col", help="Column(s) to use as the row labels or the Datafame"),
    dict(name="delimiter", help="Delimiter to use (comma, tab, etc...)"),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def loader_func(**kwargs):
    path = handle_path(kwargs.pop("path"), kwargs)
    return pd.read_csv(
        path, **{k: v for k, v in kwargs.items() if k in loader_prop_keys(LOADER_PROPS)}
    )


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    CSV implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for CSV implementation
    """
    csv_opts = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in csv_opts.values() if f]):

        def _csv_loader():
            csv_arg_parsers = {  # TODO: add additional arg parsers
                "parse_dates": lambda v: v.split(",") if v else None
            }
            kwargs = {
                k: csv_arg_parsers.get(k, lambda v: v)(v) for k, v in csv_opts.items()
            }
            return loader_func(**kwargs)

        return _csv_loader
    return None
