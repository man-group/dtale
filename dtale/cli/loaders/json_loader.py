import pandas as pd

from dtale.cli.clickutils import get_loader_options

'''
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
'''
LOADER_KEY = 'json'
LOADER_PROPS = [
    dict(name='path', help='path to JSON file or URL to JSON endpoint'),
    dict(name='convert_dates', help='comma-separated string of column names which should be parsed as dates')
]


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    JSON implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for JSON implementation
    """
    json_opts = get_loader_options(LOADER_KEY, kwargs)
    if len([f for f in json_opts.values() if f]):
        def _json_loader():
            json_arg_parsers = {  # TODO: add additional arg parsers
                'parse_dates': lambda v: v.split(',') if v else None
            }
            kwargs = {k: json_arg_parsers.get(k, lambda v: v)(v) for k, v in json_opts.items() if k != 'path'}
            return pd.read_json(json_opts['path'], **kwargs)
        return _json_loader
    return None
