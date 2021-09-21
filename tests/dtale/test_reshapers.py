import json
import pandas as pd
import numpy as np
import pytest

import dtale.global_state as global_state

from tests.dtale import build_data_inst, build_settings, build_dtypes
from tests.dtale.test_views import app


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_pivot(custom_data, unittest):
    from dtale.views import build_dtypes_state

    global_state.clear_store()
    with app.test_client() as c:
        data = {c.port: custom_data}
        dtypes = {c.port: build_dtypes_state(custom_data)}
        settings = {c.port: {}}

        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        reshape_cfg = dict(
            index=["date"], columns=["security_id"], values=["Col0"], aggfunc="mean"
        )
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(output="new", type="pivot", cfg=json.dumps(reshape_cfg)),
        )
        response_data = json.loads(resp.data)
        new_key = int(c.port) + 1
        assert response_data["data_id"] == new_key
        assert len(global_state.keys()) == 2
        unittest.assertEqual(
            [d["name"] for d in global_state.get_dtypes(new_key)],
            ["date", "100000", "100001"],
        )
        assert len(global_state.get_data(new_key)) == 365
        assert global_state.get_settings(new_key).get("startup_code") is not None

        resp = c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))
        assert json.loads(resp.data)["success"]
        assert len(global_state.keys()) == 1

        reshape_cfg["columnNameHeaders"] = True
        reshape_cfg["aggfunc"] = "sum"
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg["columnNameHeaders"] = False
        reshape_cfg["values"] = ["Col0", "Col1"]
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_aggregate(custom_data, unittest):
    from dtale.views import build_dtypes_state

    global_state.clear_store()
    with app.test_client() as c:
        data = {c.port: custom_data}
        dtypes = {c.port: build_dtypes_state(custom_data)}
        settings = {c.port: {}}

        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        reshape_cfg = dict(
            index="date",
            agg=dict(type="col", cols={"Col0": ["sum", "mean"], "Col1": ["count"]}),
        )
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="aggregate", cfg=json.dumps(reshape_cfg)
            ),
        )
        response_data = json.loads(resp.data)
        new_key = int(c.port) + 1
        assert response_data["data_id"] == new_key
        assert len(global_state.keys()) == 2
        unittest.assertEqual(
            [d["name"] for d in global_state.get_dtypes(new_key)],
            ["date", "Col0 sum", "Col0 mean", "Col1 count"],
        )
        assert len(global_state.get_data(new_key)) == 365
        assert global_state.get_settings(new_key).get("startup_code") is not None
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg = dict(
            index="date", agg=dict(type="func", func="mean", cols=["Col0", "Col1"])
        )
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="aggregate", cfg=json.dumps(reshape_cfg)
            ),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg = dict(
            index="date", agg=dict(type="func", func="gmean", cols=["Col0", "Col1"])
        )
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="aggregate", cfg=json.dumps(reshape_cfg)
            ),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg = dict(
            index=None, agg=dict(type="func", func="gmean", cols=["Col0", "Col1"])
        )
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="aggregate", cfg=json.dumps(reshape_cfg)
            ),
        )
        response_data = json.loads(resp.data)
        assert response_data["data_id"] == new_key
        assert len(global_state.keys()) == 2
        unittest.assertEqual(
            [d["name"] for d in global_state.get_dtypes(new_key)],
            ["Col0", "Col1"],
        )
        assert len(global_state.get_data(new_key)) == 1
        assert global_state.get_settings(new_key).get("startup_code") is not None
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg = dict(index="date", agg=dict(type="func", func="mean"))
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="aggregate", cfg=json.dumps(reshape_cfg)
            ),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_transpose(custom_data, unittest):
    from dtale.views import build_dtypes_state

    global_state.clear_store()
    with app.test_client() as c:
        data = {c.port: custom_data}
        dtypes = {c.port: build_dtypes_state(custom_data)}
        settings = {c.port: {}}

        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        reshape_cfg = dict(index=["security_id"], columns=["Col0"])
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="transpose", cfg=json.dumps(reshape_cfg)
            ),
        )
        response_data = json.loads(resp.data)
        new_key = int(c.port) + 1
        assert "error" in response_data

        min_date = custom_data["date"].min().strftime("%Y-%m-%d")
        global_state.set_settings(c.port, dict(query="date == '{}'".format(min_date)))
        reshape_cfg = dict(index=["date", "security_id"], columns=["Col0"])
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="transpose", cfg=json.dumps(reshape_cfg)
            ),
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
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))

        reshape_cfg = dict(index=["date", "security_id"])
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="override", type="transpose", cfg=json.dumps(reshape_cfg)
            ),
        )
        response_data = json.loads(resp.data)
        assert response_data["data_id"] == c.port


@pytest.mark.unit
def test_resample(unittest):
    from dtale.views import build_dtypes_state, format_data

    start, end = "2000-10-01 23:30:00", "2000-10-03 00:30:00"
    rng = pd.date_range(start, end, freq="7min")
    ts = pd.Series(np.arange(len(rng)) * 3, index=rng)
    ts2 = pd.Series(np.arange(len(rng)) * 0.32, index=rng)
    df = pd.DataFrame(data={"col1": ts, "col2": ts2})
    df, _ = format_data(df)

    global_state.clear_store()
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        settings = {c.port: {}}

        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        reshape_cfg = dict(index="index", columns=["col1"], freq="17min", agg="mean")
        resp = c.get(
            "/dtale/reshape/{}".format(c.port),
            query_string=dict(
                output="new", type="resample", cfg=json.dumps(reshape_cfg)
            ),
        )

        response_data = json.loads(resp.data)
        new_key = int(c.port) + 1
        assert response_data["data_id"] == new_key
        assert len(global_state.keys()) == 2
        unittest.assertEqual(
            [d["name"] for d in global_state.get_dtypes(new_key)],
            ["index_17min", "col1"],
        )
        assert len(global_state.get_data(new_key)) == 90
        assert global_state.get_settings(new_key).get("startup_code") is not None
        c.get("/dtale/cleanup-datasets", query_string=dict(dataIds=new_key))
