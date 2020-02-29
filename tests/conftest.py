import getpass
import unittest as ut

import numpy as np
import pandas as pd
import pytest
from arctic import CHUNK_STORE, Arctic
from six import PY3


def disable_arctic_cache(pymongo_api):
    # sets state to disable list_libraries cache
    # https://github.com/manahl/arctic/blob/master/arctic/_cache.py
    pymongo_api['meta_db']['settings'].insert_one({"type": "cache", "enabled": False, "cache_expiry": 600})


@pytest.fixture(scope="module")
def arctic(mongo_server_module):
    disable_arctic_cache(mongo_server_module.api)
    mongo_server_module.api.drop_database('arctic')
    mongo_server_module.api.drop_database('arctic_{}'.format(getpass.getuser()))
    return Arctic(mongo_server_module.api)


@pytest.fixture(scope="module")
def mongo_host(arctic):
    return arctic.mongo_host


@pytest.fixture(scope="module")
def library_name():
    return 'test.dtale'


@pytest.fixture(scope="module")
def chunkstore_name():
    return 'test.dtale_chunkstore'


@pytest.fixture(scope="module")
def library(library_name, arctic):
    arctic.initialize_library(library_name)
    return arctic.get_library(library_name)


@pytest.fixture(scope="module")
def chunkstore_lib(arctic, chunkstore_name):
    arctic.initialize_library(chunkstore_name, lib_type=CHUNK_STORE)
    return arctic.get_library(chunkstore_name)


@pytest.fixture(scope="module")
def unittest():
    tc = ut.TestCase('__init__')
    tc.longMessage = True
    return tc


@pytest.fixture(scope="module")
def test_data():
    now = pd.Timestamp('20000101')
    return pd.DataFrame(
        [dict(date=now, security_id=i, foo=1, bar=1.5, baz='baz') for i in range(50)],
        columns=['date', 'security_id', 'foo', 'bar', 'baz']
    )


@pytest.fixture(scope="module")
def rolling_data():
    # https://github.com/man-group/dtale/issues/43
    ii = pd.date_range(start='2018-01-01', end='2019-12-01', freq='D')
    ii = pd.Index(ii, name='date')
    n = ii.shape[0]
    c = 5
    data = np.random.random((n, c))
    return pd.DataFrame(data, index=ii)


@pytest.fixture(scope="module")
def builtin_pkg():
    if PY3:
        return 'builtins'
    return '__builtin__'
