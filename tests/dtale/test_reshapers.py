import json
import pandas as pd
from pandas.tseries.offsets import Day
import numpy as np
import pytest

import dtale.global_state as global_state
from dtale.pandas_util import is_pandas3

from tests.dtale import build_data


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_pivot(custom_data, unittest, client):
    global_state.clear_store()
    build_data(client.port, custom_data)
    reshape_cfg = dict(
        index=["date"], columns=["security_id"], values=["Col0"], aggfunc="mean"
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="pivot", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "100000", "100001"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None

    resp = client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))
    assert json.loads(resp.data)["success"]
    assert len(global_state.keys()) == 1

    reshape_cfg["columnNameHeaders"] = True
    reshape_cfg["aggfunc"] = "sum"
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="pivot", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "security_id-100000", "security_id-100001"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg["columnNameHeaders"] = False
    reshape_cfg["values"] = ["Col0", "Col1"]
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="pivot", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "Col0 100000", "Col0 100001", "Col1 100000", "Col1 100001"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_aggregate(custom_data, unittest, client):
    global_state.clear_store()
    build_data(client.port, custom_data)
    reshape_cfg = dict(
        index="date",
        agg=dict(type="col", cols={"Col0": ["sum", "mean"], "Col1": ["count"]}),
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "Col0 sum", "Col0 mean", "Col1 count"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(
        index="date", agg=dict(type="func", func="mean", cols=["Col0", "Col1"])
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "Col0", "Col1"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(
        index="date", agg=dict(type="func", func="gmean", cols=["Col0", "Col1"])
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "Col0", "Col1"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(
        index=None, agg=dict(type="func", func="gmean", cols=["Col0", "Col1"])
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)], ["Col0", "Col1"]
    )
    assert len(global_state.get_data(new_key)) == 1
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(index="date", agg=dict(type="func", func="mean", dropna=True))
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["date", "security_id", "int_val", "Col0", "Col1", "Col2", "bool_val"],
    )
    assert len(global_state.get_data(new_key)) == 365
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(
        index="bool_val", agg=dict(type="func", func="count_pct"), dropna=False
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["bool_val", "Count", "Percentage"],
    )
    assert sum(global_state.get_data(new_key)["Percentage"].values) == 100
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
def test_aggregate_str_joiner(unittest, client):
    from dtale.views import format_data

    df = pd.DataFrame([{"a": 1, "b": "foo"}, {"a": 1, "b": "bar"}])
    df, _ = format_data(df)
    global_state.clear_store()
    build_data(client.port, df)
    reshape_cfg = dict(
        index="a", agg=dict(type="col", cols={"b": ["count", "str_joiner"]})
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["a", "b count", "b str_joiner"],
    )
    output = global_state.get_data(new_key)
    assert len(output) == 1
    assert output["b str_joiner"].values[0] == "foo|bar"
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_transpose(custom_data, unittest, client):
    global_state.clear_store()
    build_data(client.port, custom_data)
    global_state.set_app_settings(dict(enable_custom_filters=True))
    reshape_cfg = dict(index=["security_id"], columns=["Col0"])
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="transpose", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert "error" in response_data

    min_date = custom_data["date"].min().strftime("%Y-%m-%d")
    if is_pandas3():
        start = (custom_data["date"].min() - Day()).strftime("%Y-%m-%d")
        end = (custom_data["date"].min() + Day()).strftime("%Y-%m-%d")
        global_state.set_settings(
            client.port, dict(query="date > '{}' and date < '{}'".format(start, end))
        )
    else:
        global_state.set_settings(
            client.port, dict(query="date == '{}'".format(min_date))
        )
    reshape_cfg = dict(index=["date", "security_id"], columns=["Col0"])
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="transpose", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        [
            "index",
            "{} 00:00:00 100000".format(min_date),
            "{} 00:00:00 100001".format(min_date),
        ],
    )
    assert len(global_state.get_data(new_key)) == 1
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    reshape_cfg = dict(index=["date", "security_id"])
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(
            output="override", type="transpose", cfg=json.dumps(reshape_cfg)
        ),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == str(client.port)


@pytest.mark.unit
def test_resample(unittest, client):
    from dtale.views import format_data

    start, end = "2000-10-01 23:30:00", "2000-10-03 00:30:00"
    rng = pd.date_range(start, end, freq="7min")
    ts = pd.Series(np.arange(len(rng)) * 3, index=rng)
    ts2 = pd.Series(np.arange(len(rng)) * 0.32, index=rng)
    df = pd.DataFrame(data={"col1": ts, "col2": ts2})
    df, _ = format_data(df)

    global_state.clear_store()
    build_data(client.port, df)
    reshape_cfg = dict(index="index", columns=["col1"], freq="17min", agg="mean")
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="resample", cfg=json.dumps(reshape_cfg)),
    )

    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    unittest.assertEqual(
        [d["name"] for d in global_state.get_dtypes(new_key)],
        ["index_17min", "col1"],
    )
    assert len(global_state.get_data(new_key)) == 90
    assert global_state.get_settings(new_key).get("startup_code") is not None
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    # Test resample without columns (covers lines 311, 328, 332)
    reshape_cfg = dict(index="index", columns=None, freq="17min", agg="mean")
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="resample", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
def test_aggregate_no_index(unittest, client):
    from dtale.views import format_data

    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6], "c": [7, 8, 9]})
    df, _ = format_data(df)
    global_state.clear_store()
    build_data(client.port, df)

    # Test aggregate without index, func type with cols (covers lines 170-177)
    reshape_cfg = dict(index=None, agg=dict(type="func", func="sum", cols=["a", "b"]))
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    assert len(global_state.keys()) == 2
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

    # Test aggregate without index, func type with gmean (covers gmean path)
    reshape_cfg = dict(index=None, agg=dict(type="func", func="gmean", cols=["a", "b"]))
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    assert response_data["data_id"] == new_key
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
def test_aggregate_no_index_func(unittest, client):
    from dtale.views import format_data

    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    df, _ = format_data(df)
    global_state.clear_store()
    build_data(client.port, df)

    # Test aggregate without index, func type (covers line 93 for PivotBuilder no agg)
    reshape_cfg = dict(index=None, agg=dict(type="func", func="mean", cols=["a", "b"]))
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
def test_data_reshaper_unknown_type():
    """Test that unknown shape type raises NotImplementedError (covers line 39)."""
    with pytest.raises(
        NotImplementedError, match="unknown data re-shaper not implemented"
    ):
        from dtale.data_reshapers import DataReshaper

        DataReshaper("1", "unknown", {})


@pytest.mark.unit
def test_pivot_build_code_no_aggfunc():
    """Test PivotBuilder.build_code without aggfunc (covers data_reshapers.py line 93)."""
    from dtale.data_reshapers import PivotBuilder

    cfg = dict(index="date", columns="category", values=["val"], aggfunc=None)
    builder = PivotBuilder(cfg)
    code = builder.build_code()
    assert "df.pivot(" in code
    assert "index='date'" in code


@pytest.mark.unit
def test_aggregate_no_index_col_type_build_code():
    """Test AggregateBuilder.build_code without index, col type (covers data_reshapers.py lines 245-256)."""
    from dtale.data_reshapers import AggregateBuilder

    cfg = dict(
        index=None,
        agg=dict(type="col", cols={"Col0": ["sum", "mean"], "Col1": ["count"]}),
    )
    builder = AggregateBuilder(cfg)
    code = builder.build_code()
    # code should be a list with aggregate dict and to_frame
    code_str = "\n".join(code) if isinstance(code, list) else code
    assert "aggregate" in code_str
    assert "Col0" in code_str
    assert "Col1" in code_str
    assert "to_frame" in code_str


@pytest.mark.unit
def test_aggregate_no_index_func_build_code():
    """Test AggregateBuilder.build_code without index, func type (covers data_reshapers.py lines 241-243)."""
    from dtale.data_reshapers import AggregateBuilder

    cfg = dict(
        index=None,
        agg=dict(type="func", func="mean"),
    )
    builder = AggregateBuilder(cfg)
    code = builder.build_code()
    code_str = "\n".join(code) if isinstance(code, list) else code
    assert "to_frame" in code_str
    assert "df = df" in code_str


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=100, cols=3)], indirect=True)
def test_aggregate_count_pct_reshape(custom_data, unittest, client):
    """Test aggregate count_pct reshape path (covers data_reshapers.py lines 146-150)."""
    global_state.clear_store()
    build_data(client.port, custom_data)

    reshape_cfg = dict(
        index=["bool_val"], agg=dict(type="func", func="count_pct"), dropna=False
    )
    resp = client.get(
        "/dtale/reshape/{}".format(client.port),
        query_string=dict(output="new", type="aggregate", cfg=json.dumps(reshape_cfg)),
    )
    response_data = json.loads(resp.data)
    new_key = str(client.port + 1)
    assert response_data["data_id"] == new_key
    new_data = global_state.get_data(new_key)
    assert "Count" in new_data.columns
    assert "Percentage" in new_data.columns
    client.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
def test_custom_agg_handler_gmean():
    """Test custom_agg_handler with gmean (covers data_reshapers.py line 108)."""
    from scipy import stats as scipy_stats
    from dtale.data_reshapers import custom_agg_handler

    result = custom_agg_handler("gmean")
    assert result == scipy_stats.gmean


@pytest.mark.unit
def test_custom_str_handler_gmean_and_str_joiner():
    """Test custom_str_handler with gmean and str_joiner (covers data_reshapers.py lines 124, 126)."""
    from dtale.data_reshapers import custom_str_handler

    result = custom_str_handler(["gmean", "str_joiner", "sum"])
    assert result == ["gmean", "'|'.join", "'sum'"]
