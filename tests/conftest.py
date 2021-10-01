import getpass
import os
import random
import string
import unittest as ut

import numpy as np
import pandas as pd
import pytest
from pandas.tseries.offsets import Day
from past.utils import old_div
from six import PY3


def disable_arctic_cache(pymongo_api):
    # sets state to disable list_libraries cache
    # https://github.com/manahl/arctic/blob/master/arctic/_cache.py
    pymongo_api["meta_db"]["settings"].insert_one(
        {"type": "cache", "enabled": False, "cache_expiry": 600}
    )


@pytest.fixture(scope="module")
def arctic(mongo_server_module):
    from arctic import Arctic

    disable_arctic_cache(mongo_server_module.api)
    mongo_server_module.api.drop_database("arctic")
    mongo_server_module.api.drop_database("arctic_{}".format(getpass.getuser()))
    return Arctic(mongo_server_module.api)


@pytest.fixture(scope="module")
def mongo_host(arctic):
    return arctic.mongo_host


@pytest.fixture(scope="module")
def library_name():
    return "test.dtale"


@pytest.fixture(scope="module")
def chunkstore_name():
    return "test.dtale_chunkstore"


@pytest.fixture(scope="module")
def library(library_name, arctic):
    arctic.initialize_library(library_name)
    return arctic.get_library(library_name)


@pytest.fixture(scope="module")
def chunkstore_lib(arctic, chunkstore_name):
    from arctic import CHUNK_STORE

    arctic.initialize_library(chunkstore_name, lib_type=CHUNK_STORE)
    return arctic.get_library(chunkstore_name)


@pytest.fixture(scope="module")
def unittest():
    tc = ut.TestCase("__init__")
    tc.longMessage = True
    return tc


@pytest.fixture(scope="module")
def test_data():
    now = pd.Timestamp("20000101")
    return pd.DataFrame(
        [dict(date=now, security_id=i, foo=1, bar=1.5, baz="baz") for i in range(50)],
        columns=["date", "security_id", "foo", "bar", "baz"],
    )


@pytest.fixture(scope="module")
def rolling_data():
    # https://github.com/man-group/dtale/issues/43
    ii = pd.date_range(start="2018-01-01", end="2019-12-01", freq="D")
    ii = pd.Index(ii, name="date")
    n = ii.shape[0]
    c = 5
    data = np.random.random((n, c))
    return pd.DataFrame(data, index=ii)


@pytest.fixture(scope="module")
def treemap_data():
    volume = [350, 220, 170, 150, 50]
    labels = [
        "Liquid\n volume: 350k",
        "Savoury\n volume: 220k",
        "Sugar\n volume: 170k",
        "Frozen\n volume: 150k",
        "Non-food\n volume: 50k",
    ]
    dfs = []
    for g in ["group1", "group2"]:
        dfs.append(pd.DataFrame(dict(group=g, volume=volume, label=labels)))
    return pd.concat(dfs, ignore_index=True)


@pytest.fixture(scope="module")
def candlestick_data():
    return pd.DataFrame(
        dict(
            x=[pd.Timestamp("20200101"), pd.Timestamp("20200101")],
            symbol=["a", "b"],
            open=[1, 2],
            close=[1, 2],
            high=[1, 2],
            low=[1, 2],
        )
    )


@pytest.fixture(scope="module")
def custom_data(request):
    rows = request.param.get("rows", 100)
    columns = request.param.get("cols", 10)
    no_of_dates = request.param.get("dates", 364)

    now = pd.Timestamp(pd.Timestamp("now").date())
    dates = pd.date_range(now - Day(no_of_dates), now)
    num_of_securities = max(
        old_div(rows, len(dates)), 1
    )  # always have at least one security

    def _add_date(date, security_data):
        return {
            k: date if k == "date" else security_data[k]
            for k in list(security_data.keys()) + ["date"]
        }

    securities = [
        dict(
            security_id=100000 + sec_id,
            int_val=random.randint(1, 100000000000),
            str_val=random.choice(string.ascii_letters) * 5,
        )
        for sec_id in range(num_of_securities)
    ]
    data = pd.concat(
        [pd.DataFrame([_add_date(date, sd) for sd in securities]) for date in dates],
        ignore_index=True,
    )[["date", "security_id", "int_val", "str_val"]]
    col_names = ["Col{}".format(c) for c in range(columns)]
    data = pd.concat(
        [data, pd.DataFrame(np.random.randn(len(data), columns), columns=col_names)],
        axis=1,
    )
    data.loc[data["security_id"] == 100001, "str_val"] = np.nan
    data.loc[:, "bool_val"] = data.index % 2 == 0
    return data


@pytest.fixture(scope="module")
def state_data():
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "data/state-codes.csv"))
    df.loc[:, "val"] = df.index.values
    df.loc[:, "cat"] = np.random.uniform(1, 20, len(df))
    return df


@pytest.fixture(scope="module")
def scattergeo_data():
    return pd.DataFrame(
        {
            "lat": np.random.uniform(-40, 40, 50),
            "lon": np.random.uniform(-40, 40, 50),
            "val": np.random.uniform(1, 20, 50),
            "cat": np.random.randint(0, high=100, size=50),
        }
    )


@pytest.fixture(scope="module")
def network_data():
    return pd.read_csv(os.path.join(os.path.dirname(__file__), "data/network.csv"))


@pytest.fixture(scope="module")
def clustergram_data():
    return pd.read_csv(
        os.path.join(os.path.dirname(__file__), "data/clustergram_mtcars.tsv"),
        sep="	",
        skiprows=4,
    ).set_index("model")


@pytest.fixture(scope="module")
def builtin_pkg():
    if PY3:
        return "builtins"
    return "__builtin__"
