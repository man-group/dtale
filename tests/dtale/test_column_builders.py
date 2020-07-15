import mock
import numpy as np
import pandas as pd
import pytest
from six import PY3

from dtale.column_builders import ColumnBuilder

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


def verify_builder(builder, checker):
    assert checker(builder.build_column())
    assert builder.build_code()


@pytest.mark.unit
def test_type_conversion(unittest):
    df = pd.DataFrame(
        [
            {
                "str_num": "1.5",
                "str_date": "20200101",
                "str_date2": "1/1/2020",
                "str_bool": "True",
                "int": 1,
                "int_date": 20200101,
                "int_s": 1490195805,
                "float": 1.5,
                "date": pd.Timestamp("20200101"),
                "bool": True,
                "cat_int": 1,
                "cat_bool": "True",
                "cat_str": "a",
            }
        ]
    )
    for c in ["cat_int", "cat_bool", "cat_str"]:
        df.loc[:, c] = df[c].astype("category")
    data_id, column_type = "1", "type_conversion"
    i = 0
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"col": "str_num", "to": "int", "from": "str"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1)

        cfg = {"col": "str_num", "to": "float", "from": "str"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1.5)

        cfg = {"col": "str_date", "to": "date", "from": "object"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: pd.Timestamp(col.values[0]).strftime("%Y%m%d") == "20200101",
        )

        cfg = {"col": "str_date2", "to": "date", "from": "object"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: pd.Timestamp(col.values[0]).strftime("%Y%m%d") == "20200101",
        )

        cfg = {"col": "str_bool", "to": "bool", "from": "object"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0])

        cfg = {"col": "int", "to": "float", "from": "int"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1.0)

        cfg = {"col": "int", "to": "str", "from": "int"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == "1")

        cfg = {"col": "int", "to": "category", "from": "int"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.dtype.name == "category")

        cfg = {"col": "int", "to": "bool", "from": "int"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: isinstance(col.values[0], np.bool_)
            and np.bool_(True) == col.values[0],
        )

        cfg = {"col": "int_date", "to": "date", "from": "int", "unit": "YYYYMMDD"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: pd.Timestamp(col.values[0]).strftime("%Y%m%d") == "20200101",
        )

        cfg = {"col": "int_s", "to": "date", "from": "int", "unit": "s"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: pd.Timestamp(col.values[0]).strftime("%Y%m%d") == "20170322",
        )

        cfg = {"col": "float", "to": "int", "from": "float"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1)

        cfg = {"col": "float", "to": "str", "from": "float"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == "1.5")

        cfg = {"col": "date", "to": "str", "from": "datetime64", "fmt": "%m/%d/%Y"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == "01/01/2020")

        cfg = {"col": "date", "to": "int", "from": "datetime64", "unit": "YYYYMMDD"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 20200101)

        cfg = {"col": "date", "to": "int", "from": "datetime64", "unit": "ms"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1577854800)

        cfg = {"col": "bool", "to": "int", "from": "bool"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1)

        cfg = {"col": "bool", "to": "str", "from": "bool"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == "True")

        cfg = {"col": "cat_int", "to": "int", "from": "category"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == 1)

        cfg = {"col": "cat_bool", "to": "bool", "from": "category"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder,
            lambda col: isinstance(col.values[0], np.bool_)
            and np.bool_(True) == col.values[0],
        )

        cfg = {"col": "cat_str", "to": "str", "from": "category"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.values[0] == "a")


@pytest.mark.unit
def test_transform():
    def _data():
        for i in range(100):
            a = i % 5
            b = i % 3
            c = i % 4
            yield dict(a=a, b=b, c=c, i=i)

    df = pd.DataFrame(list(_data()))

    aggs = [
        "count",
        "nunique",
        "sum",
        "first",
        "last",
        "median",
        "min",
        "max",
        "std",
        "var",
        "mad",
        "prod",
    ]
    data_id, column_type = "1", "transform"
    i = 0
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"col": "i", "group": ["a"], "agg": "mean"}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(
            builder, lambda col: col.values[0] == 47.5 and col.values[-1] == 51.5
        )

        for agg in aggs:
            cfg["agg"] = agg
            builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
            verify_builder(builder, lambda col: len(col[col.isnull()]) == 0)


@pytest.mark.unit
def test_winsorize():
    def _data():
        for i in range(100):
            a = i % 5
            b = i % 3
            c = i % 4
            yield dict(a=a, b=b, c=c, i=i)

    df = pd.DataFrame(list(_data()))
    data_id, column_type = "1", "winsorize"
    i = 0
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"col": "i", "inclusive": [True, False], "limits": [0.1, 0.1]}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.sum() == 4950)

        cfg = {"col": "i", "group": ["b"], "limits": [0.1, 0.1]}
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: col.sum() == 4950)
