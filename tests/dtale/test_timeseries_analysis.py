import json
import pytest

from six import PY3

from dtale.app import build_app
from tests.dtale.test_views import URL
from tests.dtale import build_data_inst


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_hpfilter(custom_data, ts_analysis_data, unittest):
    import dtale.views as views

    df, _ = views.format_data(ts_analysis_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="not_implemented", cfg=json.dumps({})),
        )
        assert not resp.json["success"]

        cfg = dict(index="date", col="realgdp", lamb=1600)
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="hpfilter", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()), ["cycle", "realgdp", "trend", "x"]
        )

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        cfg = dict(index="date", col="Col1", lamb=1600)
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="hpfilter", cfg=json.dumps(cfg)),
        )
        assert not resp.json["success"]

        cfg["agg"] = "mean"
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="hpfilter", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()), ["Col1", "cycle", "trend", "x"]
        )


@pytest.mark.unit
def test_cffilter(unittest, ts_analysis_data):
    import dtale.views as views

    df, _ = views.format_data(ts_analysis_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        cfg = dict(index="date", col="realgdp", low=6, high=32, drift=True)
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="cffilter", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()), ["cycle", "realgdp", "trend", "x"]
        )


@pytest.mark.unit
def test_bkfilter(unittest, ts_analysis_data):
    import dtale.views as views

    df, _ = views.format_data(ts_analysis_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        cfg = dict(index="date", col="realgdp", low=6, high=32, K=12)
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="bkfilter", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()), ["cycle", "realgdp", "x"]
        )


@pytest.mark.unit
def test_seasonal_decompose(unittest, ts_analysis_data):
    import dtale.views as views

    df, _ = views.format_data(ts_analysis_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        cfg = dict(index="date", col="realgdp", model="additive")
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="seasonal_decompose", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()),
            ["realgdp", "resid", "seasonal", "trend", "x"],
        )


@pytest.mark.skipif(not PY3, reason="requires python 3 or higher")
def test_stl(unittest, ts_analysis_data):
    import dtale.views as views

    df, _ = views.format_data(ts_analysis_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        cfg = dict(index="date", col="realgdp")
        resp = c.get(
            "/dtale/timeseries-analysis/{}".format(c.port),
            query_string=dict(type="stl", cfg=json.dumps(cfg)),
        )
        unittest.assertEqual(
            sorted(resp.json["data"]["all"].keys()),
            ["realgdp", "resid", "seasonal", "trend", "x"],
        )
