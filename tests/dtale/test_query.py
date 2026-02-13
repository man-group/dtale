# -*- coding: utf-8 -*-
import pandas as pd
import pytest
from six import PY3

import dtale.global_state as global_state
import dtale.query as query
from dtale.pandas_util import check_pandas_version



@pytest.mark.unit
def test_run_query():
    df = pd.DataFrame([dict(a=1, b=2, c=3), dict(a=2, b=3, c=4), dict(a=3, b=4, c=5)])

    with pytest.raises(Exception):
        query.run_query(df, "a == 4")

    assert len(query.run_query(df, "`a` in @a", {"a": [1, 2, 3]})) == 3

    if PY3 and check_pandas_version("0.25.0"):
        df = pd.DataFrame(
            [
                {"a.b": 1, "b": 2, "c": 3},
                {"a.b": 2, "b": 3, "c": 4},
                {"a.b": 3, "b": 4, "c": 5},
            ]
        )
        assert len(query.run_query(df, "`a.b` == 1")) == 1


@pytest.mark.unit
def test_run_query_empty_query():
    df = pd.DataFrame([dict(a=1, b=2), dict(a=2, b=3), dict(a=3, b=4)])

    # Empty query should return full dataframe
    result = query.run_query(df, "")
    assert len(result) == 3

    result = query.run_query(df, None)
    assert len(result) == 3


@pytest.mark.unit
def test_run_query_highlight_filter():
    df = pd.DataFrame([dict(a=1, b=2), dict(a=2, b=3), dict(a=3, b=4)])

    # highlight_filter with empty query
    result, filtered = query.run_query(df, "", highlight_filter=True)
    assert len(result) == 3
    assert filtered == []

    # highlight_filter with actual query
    result, filtered = query.run_query(df, "`a` > 1", highlight_filter=True)
    assert len(result) == 3  # full df returned
    assert len(filtered) == 2  # indexes of matching rows


@pytest.mark.unit
def test_run_query_pct_random():
    df = pd.DataFrame({"a": range(100), "b": range(100)})
    result = query.run_query(df, "", pct=50, pct_type="random")
    assert len(result) == 50


@pytest.mark.unit
def test_run_query_pct_head():
    df = pd.DataFrame({"a": range(100), "b": range(100)})
    result = query.run_query(df, "", pct=10, pct_type="head")
    assert len(result) == 10
    assert list(result["a"]) == list(range(10))


@pytest.mark.unit
def test_run_query_pct_tail():
    df = pd.DataFrame({"a": range(100), "b": range(100)})
    result = query.run_query(df, "", pct=10, pct_type="tail")
    assert len(result) == 10
    assert list(result["a"]) == list(range(90, 100))


@pytest.mark.unit
def test_run_query_pct_stratified():
    df = pd.DataFrame({"a": range(100), "group": ["A"] * 50 + ["B"] * 50})
    result = query.run_query(
        df, "", pct=20, pct_type="stratified", stratified_group="group"
    )
    assert len(result) <= 20


@pytest.mark.unit
def test_run_query_ignore_empty():
    df = pd.DataFrame([dict(a=1, b=2)])
    # Without ignore_empty, should raise
    with pytest.raises(Exception):
        query.run_query(df, "`a` == 999")

    # With ignore_empty, should return empty df
    result = query.run_query(df, "`a` == 999", ignore_empty=True)
    assert len(result) == 0


@pytest.mark.unit
def test_build_col_key():
    assert query.build_col_key("foo") == "`foo`"
    assert query.build_col_key("col with spaces") == "`col with spaces`"


@pytest.mark.unit
def test_build_query():
    data_id = global_state.new_data_inst()
    global_state.set_settings(
        data_id, {"columnFilters": {"foo": {"query": "`foo` == 1"}}}
    )
    assert query.build_query(data_id) == "`foo` == 1"


@pytest.mark.unit
def test_build_query_with_custom_query():
    data_id = global_state.new_data_inst()
    global_state.set_settings(
        data_id, {"columnFilters": {"foo": {"query": "`foo` == 1"}}}
    )
    result = query.build_query(data_id, query="`bar` > 2")
    assert "`foo` == 1" in result
    assert "`bar` > 2" in result
    assert " and " in result


@pytest.mark.unit
def test_inner_build_query():
    # Test with column filters and outlier filters
    settings = {
        "columnFilters": {"foo": {"query": "`foo` == 1"}},
        "outlierFilters": {"bar": {"query": "`bar` > 5"}},
    }
    result = query.inner_build_query(settings)
    assert "`foo` == 1" in result
    assert "`bar` > 5" in result

    # Test with invertFilter
    settings["invertFilter"] = True
    result = query.inner_build_query(settings)
    assert result.startswith("~(")
    assert result.endswith(")")

    # Test with empty filters
    result = query.inner_build_query({})
    assert result == ""


@pytest.mark.unit
def test_inner_build_query_with_query_param():
    settings = {"columnFilters": {"foo": {"query": "`foo` == 1"}}}
    result = query.inner_build_query(settings, query="`bar` > 2")
    assert "`foo` == 1 and `bar` > 2" == result


@pytest.mark.unit
def test_load_index_filter():
    data_id = global_state.new_data_inst()

    # No settings — should return empty dict
    result = query.load_index_filter(data_id)
    assert result == {}

    # Settings with indexes but no matching column filter
    global_state.set_settings(data_id, {"indexes": ["date"], "columnFilters": {}})
    result = query.load_index_filter(data_id)
    assert result == {}

    # Settings with start and end
    global_state.set_settings(
        data_id,
        {
            "indexes": ["date"],
            "columnFilters": {"date": {"start": "20200101", "end": "20200201"}},
        },
    )
    result = query.load_index_filter(data_id)
    assert "date_range" in result
    assert len(result["date_range"]) == 2
    assert result["date_range"][0] == pd.Timestamp("20200101")
    assert result["date_range"][1] == pd.Timestamp("20200201")

    # Settings with only start
    global_state.set_settings(
        data_id,
        {
            "indexes": ["date"],
            "columnFilters": {"date": {"start": "20200101"}},
        },
    )
    result = query.load_index_filter(data_id)
    assert "date_range" in result
    assert result["date_range"][0] == pd.Timestamp("20200101")
    assert result["date_range"][1] is None

    # Settings with only end
    global_state.set_settings(
        data_id,
        {
            "indexes": ["date"],
            "columnFilters": {"date": {"end": "20200201"}},
        },
    )
    result = query.load_index_filter(data_id)
    assert "date_range" in result
    assert result["date_range"][0] is None
    assert result["date_range"][1] == pd.Timestamp("20200201")


@pytest.mark.unit
def test_handle_predefined():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)

    # No predefined filters — should return df unchanged
    result = query.handle_predefined(data_id)
    assert len(result) == 3

    # With explicit df argument
    result = query.handle_predefined(data_id, df=df)
    assert len(result) == 3


@pytest.mark.unit
def test_load_filterable_data():
    from flask import Flask

    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_settings(data_id, {})

    app = Flask(__name__)
    with app.test_request_context("/?filtered=false"):
        from flask import request

        result = query.load_filterable_data(data_id, request)
        assert len(result) == 3

    with app.test_request_context("/?filtered=true"):
        from flask import request

        result = query.load_filterable_data(data_id, request)
        assert len(result) == 3
