import pandas as pd
from pkg_resources import parse_version

from dtale.app import show
from dtale.cli.clickutils import get_loader_options, handle_path, loader_prop_keys

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "json"
LOADER_PROPS = [
    dict(name="path", help="path to JSON file or URL to JSON endpoint"),
    dict(name="proxy", help="proxy URL if you're passing in a URL for --json-path"),
    dict(
        name="convert_dates",
        help="comma-separated string of column names which should be parsed as dates",
    ),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def is_pandas1():
    return parse_version(pd.__version__) >= parse_version("1.0.0")


def loader_func(**kwargs):
    normalize = kwargs.pop("normalize", False)

    def resp_handler(resp):
        return resp.json() if normalize else resp.text

    path = handle_path(kwargs.pop("path"), kwargs, resp_handler=resp_handler)
    if normalize:
        normalize_func = (
            pd.json_normalize if is_pandas1() else pd.io.json.json_normalize
        )
        return normalize_func(path, **kwargs)
    return pd.read_json(
        path, **{k: v for k, v in kwargs.items() if k in loader_prop_keys(LOADER_PROPS)}
    )


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    JSON implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for JSON implementation
    """
    json_opts = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in json_opts.values() if f]):

        def _json_loader():
            json_arg_parsers = {  # TODO: add additional arg parsers
                "parse_dates": lambda v: v.split(",") if v else None
            }
            kwargs = {
                k: json_arg_parsers.get(k, lambda v: v)(v) for k, v in json_opts.items()
            }
            return loader_func(**kwargs)

        return _json_loader
    return None
