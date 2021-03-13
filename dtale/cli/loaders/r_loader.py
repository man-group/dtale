from six import PY3

from dtale.app import show
from dtale.cli.clickutils import get_loader_options

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "r"
LOADER_PROPS = [
    dict(name="path", help="path to R dataset file"),
    dict(name="dataset", help="the name of the dataset within your file"),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def loader_func(**kwargs):
    if not PY3:
        raise EnvironmentError("In order to use the R you must be on python3!")
    try:
        import rpy2.robjects as ro
        from rpy2.robjects.packages import importr
        from rpy2.robjects import pandas2ri

        from rpy2.robjects.conversion import localconverter
    except ImportError:
        raise ImportError("In order to use the R loader you must install rpy2!")

    pandas2ri.activate()
    base = importr("base")
    path = kwargs.pop("path")
    base.load(path)
    with localconverter(ro.default_converter + pandas2ri.converter):
        dataset = kwargs.pop("dataset", None) or base.ls()[0]
        df = ro.conversion.rpy2py(base.get(dataset))
        return df


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    R dataset implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for R dataset implementation
    """
    r_opts = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in r_opts.values() if f]):

        def _r_loader():
            return loader_func(**r_opts)

        return _r_loader
    return None
