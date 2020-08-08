import pandas as pd

from dtale.app import show
from dtale.cli.clickutils import get_loader_options, loader_prop_keys

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "parquet"
LOADER_PROPS = [
    dict(name="path", help="path to parquet file or URL to parquet endpoint"),
    dict(name="engine", help="parquet library to use"),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def loader_func(**kwargs):
    try:
        import pyarrow  # noqa: F401
    except ImportError:
        try:
            import fastparquet  # noqa: F401
        except ImportError:
            raise ImportError(
                "In order to use the parquet loader you must install either pyarrow or fastparquet!"
            )

    path = kwargs.pop("path")
    return pd.read_parquet(
        path, **{k: v for k, v in kwargs.items() if k in loader_prop_keys(LOADER_PROPS)}
    )


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    JSON implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for Parquet implementation
    """
    parquet_opts = get_loader_options(LOADER_KEY, kwargs)
    if len([f for f in parquet_opts.values() if f]):

        def _json_loader():
            parquet_arg_parsers = {}  # TODO: add additional arg parsers
            kwargs = {
                k: parquet_arg_parsers.get(k, lambda v: v)(v)
                for k, v in parquet_opts.items()
            }
            return loader_func(**kwargs)

        return _json_loader
    return None
