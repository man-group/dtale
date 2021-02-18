import numpy as np
import pandas as pd
import pytest

from dtale.column_builders import ColumnBuilder
from tests.dtale.column_builders.test_column_builders import verify_builder
from tests.dtale import build_data_inst


def conversion_data():
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
                "cat_int": "1",
                "cat_bool": "True",
                "cat_str": "a",
            }
        ]
    )
    for c in ["cat_int", "cat_bool", "cat_str"]:
        df.loc[:, c] = df[c].astype("category")
    return df


@pytest.mark.unit
def test_from_string():
    df = conversion_data()
    df.loc[:, "hex_int"] = df["int"].apply(hex)
    df.loc[:, "hex_float"] = df["float"].apply(float.hex)
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "str_num", "to": "int", "from": "str"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1)

    cfg = {"col": "str_num", "to": "float", "from": "str"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1.5)

    cfg = {"col": "hex_int", "to": "int", "from": "str"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1)

    cfg = {"col": "hex_float", "to": "float", "from": "str"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1.5)

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3, "", 5, 6, 7, 8, 9, 10],
            b=[True, True, False, "", "False", True, False, True, False, True],
            c=["1", "00", "1.05", " ", " ", "", "02", "..", "none", "nan"],
        )
    )
    build_data_inst({data_id: df})

    cfg = {"col": "a", "to": "float", "from": "mixed-integer"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 51)
    assert np.isnan(builder.build_column().values[3])

    cfg = {"col": "b", "to": "bool", "from": "mixed-integer"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 5)
    assert np.isnan(builder.build_column().values[3])

    cfg = {"col": "c", "to": "float", "from": "str"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 4.05 and col.isnull().sum() == 6)


@pytest.mark.unit
def test_from_object():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "str_date", "to": "date", "from": "object", "fmt": "%Y%m%d"}
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


@pytest.mark.unit
def test_from_int():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

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

    cfg = {"col": "int", "to": "hex", "from": "int"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "0x1")


@pytest.mark.unit
def test_from_float():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "float", "to": "int", "from": "float"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1)

    cfg = {"col": "float", "to": "str", "from": "float"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "1.5")

    cfg = {"col": "float", "to": "hex", "from": "float"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "0x1.8000000000000p+0")


@pytest.mark.unit
def test_from_date():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "date", "to": "str", "from": "datetime64", "fmt": "%m/%d/%Y"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "01/01/2020")

    cfg = {"col": "date", "to": "int", "from": "datetime64", "unit": "YYYYMMDD"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 20200101)

    cfg = {"col": "date", "to": "int", "from": "datetime64", "unit": "ms"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    # this fails due to local machine timezone. The time here is "Jan 01 2020 05:00:00 GMT+0000"
    verify_builder(builder, lambda col: col.values[0] == 1577854800)


@pytest.mark.unit
def test_from_bool():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "bool", "to": "int", "from": "bool"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1)

    cfg = {"col": "bool", "to": "str", "from": "bool"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "True")


@pytest.mark.unit
def test_from_category():
    df = conversion_data()
    data_id, column_type = "1", "type_conversion"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "cat_int", "to": "int", "from": "category"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == 1)

    cfg = {"col": "cat_bool", "to": "bool", "from": "category"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(
        builder,
        lambda col: isinstance(col.values[0], (np.bool, np.bool_))
        and col.values[0] in [np.bool(True), np.bool_(True)],
    )

    cfg = {"col": "cat_str", "to": "str", "from": "category"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "a")
