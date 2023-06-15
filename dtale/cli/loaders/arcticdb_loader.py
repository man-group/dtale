from logging import getLogger

import pandas as pd

from dtale.app import show
from dtale.cli.clickutils import get_loader_options

logger = getLogger(__name__)

"""
  IMPORTANT!!! This global variable is required for building any customized CLI loader.
  When find loaders on startup it will search for any modules containing the global variable LOADER_KEY.
"""
NOW = pd.Timestamp("now").strftime("%Y%m%d")
LOADER_KEY = "arcticdb"
LOADER_PROPS = [
    dict(name="uri", help="arctic URI"),
    dict(name="library", help="library within --arcticdb-uri"),
    dict(name="symbol", help="symbol within --arcticdb-library"),
    dict(
        name="start",
        help="start-date of range to load if reading from ChunkStore (EX: {})".format(
            NOW
        ),
    ),
    dict(
        name="end",
        help="end-date of range to load if reading from ChunkStore (EX: {})".format(
            NOW
        ),
    ),
    dict(
        name="use_store",
        help="Use this arcticdb host as the storage mechanism for D-Tale",
        is_flag=True,
    ),
]


# IMPORTANT!!! This function is required if you would like to be able to use this loader from the back-end.
def show_loader(**kwargs):
    return show(data_loader=lambda: loader_func(**kwargs), **kwargs)


def loader_func(**kwargs):
    import dtale.global_state as global_state

    try:
        from arcticdb import Arctic
        from arcticdb.version_store._store import VersionedItem
    except ImportError:
        raise ImportError(
            "In order to use the arcticdb loader you must install arcticdb!"
        )

    read_kwargs = {}
    uri, library, symbol, start, end = (
        kwargs.get(p) for p in ["uri", "library", "symbol", "start", "end"]
    )
    uri = kwargs.get("arcticdb_host") or uri
    if not uri:
        raise ValueError("--arcticdb-uri is a required parameter!")
    if start and end:
        read_kwargs["date_range"] = [pd.Timestamp(start), pd.Timestamp(end)]
    conn = Arctic(uri)

    if kwargs.get("use_store"):
        global_state.use_arcticdb_store(
            **dict(uri=uri, library=library, symbol=symbol, **read_kwargs)
        )

    if global_state.is_arcticdb:
        from dtale.views import startup

        if library and global_state.store.lib.name != library:
            global_state.store.update_library(library)

        if symbol is None:  # select symbol from the UI
            return None

        if library is None and symbol is not None:
            raise ValueError(
                "When trying to load the symbol, {}, a library must be specified!".format(
                    symbol
                )
            )

        startup(data="{}|{}".format(library, symbol))
        return symbol

    if not library:
        raise ValueError(
            "Please specify a value for --arcticdb-library or use --arcticdb-use_store"
        )
    lib = conn.get_library(library)
    data = lib.read(symbol, **read_kwargs)
    if isinstance(data, VersionedItem):
        data = data.data

    return data


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    """
    Arctic implementation of data loader which will return a function if any of the
    `click` options based on LOADER_KEY & LOADER_PROPS have been used, otherwise return None

    :param kwargs: Optional keyword arguments to be passed from `click`
    :return: data loader function for arctic implementation
    """
    arctic_opts = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in arctic_opts.values() if f]):

        def _arctic_loader():
            return loader_func(**arctic_opts)

        return _arctic_loader
    return None
