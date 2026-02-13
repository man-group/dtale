import json
import re

import pandas as pd
import pytest

import dtale.global_state as global_state
from dtale.column_filters import (
    ColumnFilter,
    DateFilter,
    MissingOrPopulatedFilter,
    NumericFilter,
    OutlierFilter,
    StringFilter,
    handle_ne,
)
from dtale.pandas_util import check_pandas_version
from dtale.query import run_query



@pytest.mark.unit
def test_numeric():
    assert NumericFilter("foo", "I", None).build_filter() is None
    assert (
        NumericFilter(
            "foo", "I", dict(operand="=", value=None, type="int")
        ).build_filter()
        is None
    )
    assert (
        NumericFilter(
            "foo", "I", dict(operand="<", value=None, type="int")
        ).build_filter()
        is None
    )
    assert (
        NumericFilter("foo", "I", dict(operand="[]", type="int")).build_filter() is None
    )


@pytest.mark.unit
def test_date():
    assert DateFilter("foo", "D", None).build_filter() is None


@pytest.mark.unit
def test_string():
    is_pandas25 = check_pandas_version("0.25.0")

    def build_query(fltr):
        query = fltr.build_filter()["query"]
        if is_pandas25:
            return query
        return query.replace("`", "")

    df = pd.DataFrame(dict(foo=["AAA", "aaa", "ABB", "ACC", "'\"{[\\AA"]))

    cfg = dict(action="equals", operand="=", value=["AAA"], type="string")

    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["operand"] = "ne"
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4

    cfg["value"] = ["AAA", "aaa"]
    cfg["operand"] = "="
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2
    cfg["value"] = ["'\"{[\\AA"]
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["value"] = ["aaa", "'\"{[\\AA"]
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

    if is_pandas25:
        cfg["raw"] = "'"
        cfg["action"] = "startswith"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1

        cfg["raw"] = "AA"
        cfg["action"] = "startswith"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        cfg["operand"] = "ne"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3

        cfg["action"] = "endswith"
        cfg["operand"] = "="
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3

        cfg["caseSensitive"] = True
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        cfg["action"] = "contains"
        cfg["caseSensitive"] = False
        cfg["raw"] = "'\""
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
        cfg["raw"] = "[\\"  # don't parse this as regex
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1

        cfg["raw"] = "A"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 5
        cfg["caseSensitive"] = True
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4
        cfg["raw"] = "D"
        assert (
            len(
                run_query(
                    df, build_query(StringFilter("foo", "S", cfg)), ignore_empty=True
                )
            )
            == 0
        )

        cfg["action"] = "regex"
        cfg["raw"] = "[[A].+A$"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        with pytest.raises(re.error):
            cfg["raw"] = "["
            run_query(df, build_query(StringFilter("foo", "S", cfg)))

        cfg["action"] = "length"
        cfg["raw"] = "3"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4

        df = pd.DataFrame(dict(foo=["a", "aa", "aaa", "aaaa"]))
        cfg["raw"] = "1,3"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3


@pytest.mark.unit
def test_handle_ne():
    assert handle_ne("`foo` == 1", "=") == "`foo` == 1"
    assert handle_ne("`foo` == 1", "ne") == "~(`foo` == 1)"


@pytest.mark.unit
def test_date_filter_build():
    # With start only
    cfg = dict(start="20200101", type="date")
    fltr = DateFilter("date_col", "D", cfg).build_filter()
    assert fltr is not None
    assert ">=" in fltr["query"]
    assert "20200101" in fltr["query"]

    # With end only
    cfg = dict(end="20200201", type="date")
    fltr = DateFilter("date_col", "D", cfg).build_filter()
    assert fltr is not None
    assert "<=" in fltr["query"]
    assert "20200201" in fltr["query"]

    # With both start and end
    cfg = dict(start="20200101", end="20200201", type="date")
    fltr = DateFilter("date_col", "D", cfg).build_filter()
    assert fltr is not None
    assert ">=" in fltr["query"]
    assert "<=" in fltr["query"]
    assert " and " in fltr["query"]

    # With start == end (special case)
    cfg = dict(start="20200101", end="20200101", type="date")
    fltr = DateFilter("date_col", "D", cfg).build_filter()
    assert fltr is not None
    assert "==" in fltr["query"]

    # With no start or end
    cfg = dict(type="date")
    fltr = DateFilter("date_col", "D", cfg).build_filter()
    assert fltr is None


@pytest.mark.unit
def test_numeric_filter_operators():
    df = pd.DataFrame(dict(foo=[1, 2, 3, 4, 5]))

    # Test single value equals
    cfg = dict(operand="=", value=[3], type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert "==" in fltr["query"]
    assert len(run_query(df, fltr["query"])) == 1

    # Test single value not-equals
    cfg = dict(operand="ne", value=[3], type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert "!=" in fltr["query"]
    assert len(run_query(df, fltr["query"])) == 4

    # Test multi value in
    cfg = dict(operand="=", value=[1, 2, 3], type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert "in" in fltr["query"]
    assert len(run_query(df, fltr["query"])) == 3

    # Test multi value not in
    cfg = dict(operand="ne", value=[1, 2, 3], type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert "not in" in fltr["query"]
    assert len(run_query(df, fltr["query"])) == 2

    # Test < operator
    cfg = dict(operand="<", value=3, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 2

    # Test > operator
    cfg = dict(operand=">", value=3, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 2

    # Test <= operator
    cfg = dict(operand="<=", value=3, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 3

    # Test >= operator
    cfg = dict(operand=">=", value=3, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 3

    # Test [] range (inclusive)
    cfg = dict(operand="[]", min=2, max=4, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 3

    # Test () range (exclusive)
    cfg = dict(operand="()", min=2, max=4, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert len(run_query(df, fltr["query"])) == 1

    # Test [] with min == max
    cfg = dict(operand="[]", min=3, max=3, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert "==" in fltr["query"]
    assert len(run_query(df, fltr["query"])) == 1

    # Test unknown operand
    cfg = dict(operand="unknown", type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert fltr is None


@pytest.mark.unit
def test_missing_or_populated_filter():
    # Test missing filter
    cfg = dict(missing=True, type="string")
    fltr = MissingOrPopulatedFilter("foo", "S", cfg).handle_missing_or_populated(None)
    assert fltr is not None
    assert "isnull()" in fltr["query"]
    assert fltr["missing"] is True

    # Test populated filter
    cfg = dict(populated=True, type="string")
    fltr = MissingOrPopulatedFilter("foo", "S", cfg).handle_missing_or_populated(None)
    assert fltr is not None
    assert "~" in fltr["query"]
    assert "isnull()" in fltr["query"]
    assert fltr["populated"] is True

    # Test with no missing/populated (passthrough)
    cfg = dict(type="string")
    fltr = MissingOrPopulatedFilter("foo", "S", cfg).handle_missing_or_populated(
        {"query": "`foo` == 1"}
    )
    assert fltr == {"query": "`foo` == 1"}

    # Test with None cfg
    fltr = MissingOrPopulatedFilter("foo", "S", None).handle_missing_or_populated(None)
    assert fltr is None


@pytest.mark.unit
def test_outlier_filter():
    cfg = dict(query="`foo` > 10", type="outliers")
    fltr = OutlierFilter("foo", "I", cfg).build_filter()
    assert fltr is not None
    assert fltr["query"] == "`foo` > 10"

    # OutlierFilter with no query returns None
    cfg = dict(query=None, type="outliers")
    fltr = OutlierFilter("foo", "I", cfg).build_filter()
    assert fltr is None


@pytest.mark.unit
def test_column_filter_with_data():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(
        {
            "name": ["Alice", "Bob", "Charlie"],
            "age": [25, 30, 35],
            "score": [1.5, 2.5, 3.5],
        }
    )
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_dtypes(data_id, build_dtypes_state(df))

    # Test ColumnFilter for string column
    cfg = json.dumps(dict(action="equals", operand="=", value=["Alice"], type="string"))
    cf = ColumnFilter(data_id, "name", cfg)
    assert cf.classification == "S"
    fltr = cf.builder.build_filter()
    assert fltr is not None

    # Test ColumnFilter for int column
    cfg = json.dumps(dict(operand="=", value=[30], type="int"))
    cf = ColumnFilter(data_id, "age", cfg)
    assert cf.classification == "I"
    fltr = cf.builder.build_filter()
    assert fltr is not None

    # Test ColumnFilter for float column
    cfg = json.dumps(dict(operand=">", value=2.0, type="float"))
    cf = ColumnFilter(data_id, "score", cfg)
    assert cf.classification == "F"
    fltr = cf.builder.build_filter()
    assert fltr is not None


@pytest.mark.unit
def test_column_filter_date():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(
        {"dt": pd.date_range("2020-01-01", periods=5, freq="D"), "val": range(5)}
    )
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_dtypes(data_id, build_dtypes_state(df))

    cfg = json.dumps(dict(start="20200101", end="20200103", type="date"))
    cf = ColumnFilter(data_id, "dt", cfg)
    assert cf.classification == "D"
    fltr = cf.builder.build_filter()
    assert fltr is not None
    assert " and " in fltr["query"]


@pytest.mark.unit
def test_string_filter_missing_and_populated():
    pd.DataFrame(dict(foo=["a", None, "c"]))

    # Test string filter with missing
    cfg = dict(action="equals", operand="=", value=[], missing=True, type="string")
    fltr = StringFilter("foo", "S", cfg).build_filter()
    assert fltr is not None
    assert "isnull()" in fltr["query"]

    # Test string filter with populated
    cfg = dict(action="equals", operand="=", value=[], populated=True, type="string")
    fltr = StringFilter("foo", "S", cfg).build_filter()
    assert fltr is not None
    assert "~" in fltr["query"]

    # Test string filter with None cfg
    fltr = StringFilter("foo", "S", None).build_filter()
    assert fltr is None

    # Test startswith with empty raw
    cfg = dict(action="startswith", operand="=", raw="", type="string")
    fltr = StringFilter("foo", "S", cfg).build_filter()
    assert fltr is None


@pytest.mark.unit
def test_numeric_filter_missing_and_populated():
    # Test numeric filter with missing
    cfg = dict(operand="=", value=None, missing=True, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert fltr is not None
    assert "isnull()" in fltr["query"]

    # Test numeric filter with populated
    cfg = dict(operand="=", value=None, populated=True, type="int")
    fltr = NumericFilter("foo", "I", cfg).build_filter()
    assert fltr is not None
    assert "~" in fltr["query"]
