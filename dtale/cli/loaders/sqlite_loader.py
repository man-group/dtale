import pandas as pd
import sqlite3

from dtale.app import show
from dtale.cli.clickutils import get_loader_options

"""
  IMPORTANT!!! These global variables are required for building any customized CLI loader.
  When build_loaders runs startup it will search for any modules containing the global variable LOADER_KEY.
"""
LOADER_KEY = "sqlite"
LOADER_PROPS = [
    dict(name="path", help="path to sqlite file"),
    dict(name="table", help="the table to load to D-Tale --sqlite-path"),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def loader_func(**kwargs):
    if "table" not in kwargs:
        raise Exception("You must specify a table name in order to use sqlite loader!")
    path = kwargs.pop("path")
    cnx = sqlite3.connect(path)
    return pd.read_sql_query("SELECT * FROM {}".format(kwargs.pop("table")), cnx)


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    SQLite implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for SQLite implementation
    """
    sqlite_opts = get_loader_options(LOADER_KEY, kwargs)
    if len([f for f in sqlite_opts.values() if f]):

        def _sqlite_loader():
            return loader_func(**sqlite_opts)

        return _sqlite_loader
    return None
