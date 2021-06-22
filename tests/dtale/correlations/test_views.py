import numpy as np
import pandas as pd
import json
import platform
import pytest

from pkg_resources import parse_version

from dtale.charts.utils import CHART_POINTS_LIMIT

from tests.dtale.test_views import app, build_ts_data
from tests.dtale import build_data_inst, build_settings, build_dtypes

CORRELATIONS_CODE = """# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import numpy as np
import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

corr_cols = [
\t'security_id', 'foo', 'bar'
]
corr_data = df[corr_cols]
corr_data = np.corrcoef(corr_data.values, rowvar=False)
corr_data = pd.DataFrame(corr_data, columns=[corr_cols], index=[corr_cols])
corr_data.index.name = str('column')
corr_data = corr_data.reset_index()"""


@pytest.mark.unit
def test_correlation_analysis(unittest, rolling_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(rolling_data)
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        response = c.get("/dtale/corr-analysis/{}".format(c.port))
        response_data = json.loads(response.data)
        ranks = response_data["ranks"]
        corrs = response_data["corrs"]
        assert len(ranks) == 5
        assert all(r["column"] in corrs for r in ranks)
        assert all(r["missing"] == 0 for r in ranks)


@pytest.mark.unit
def test_get_correlations(unittest, test_data, rolling_data):
    import dtale.views as views

    with app.test_client() as c:
        test_data, _ = views.format_data(test_data)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get("/dtale/correlations/{}".format(c.port))
        response_data = json.loads(response.data)
        expected = dict(
            data=[
                dict(column="security_id", security_id=1.0, foo=None, bar=None),
                dict(column="foo", security_id=None, foo=None, bar=None),
                dict(column="bar", security_id=None, foo=None, bar=None),
            ],
            dates=[],
            pps=None,
            dummyColMappings={},
            strings=["baz"],
        )
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return correlations",
        )
        unittest.assertEqual(response_data["code"], CORRELATIONS_CODE)

        response = c.get(
            "/dtale/correlations/{}".format(c.port),
            query_string={"encodeStrings": True},
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data["dummyColMappings"], {"baz": ["baz_baz"]})

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        settings = {c.port: {"query": "missing_col == 'blah'"}}
        build_settings(settings)
        response = c.get("/dtale/correlations/{}".format(c.port))
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle correlations exception",
        )

    with app.test_client() as c:
        test_data.loc[test_data.security_id == 1, "bar"] = np.nan
        test_data2 = test_data.copy()
        test_data2.loc[:, "date"] = pd.Timestamp("20000102")
        test_data = pd.concat([test_data, test_data2], ignore_index=True)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get("/dtale/correlations/{}".format(c.port))
        response_data = json.loads(response.data)
        expected = dict(
            data=[
                dict(column="security_id", security_id=1.0, foo=None, bar=None),
                dict(column="foo", security_id=None, foo=None, bar=None),
                dict(column="bar", security_id=None, foo=None, bar=None),
            ],
            dates=[dict(name="date", rolling=False)],
            pps=None,
            dummyColMappings={},
            strings=["baz"],
        )
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return correlations",
        )

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        response = c.get("/dtale/correlations/{}".format(c.port))
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["dates"],
            [dict(name="date", rolling=True)],
            "should return correlation date columns",
        )


@pytest.mark.skipif(
    parse_version(platform.python_version()) < parse_version("3.6.0"),
    reason="requires python 3.6 or higher",
)
def test_get_pps_matrix(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        test_data, _ = views.format_data(test_data)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get("/dtale/correlations/{}?pps=true".format(c.port))
        response_data = response.json
        expected = [
            {"bar": 1, "column": "bar", "foo": 0, "security_id": 0},
            {"bar": 0, "column": "foo", "foo": 1, "security_id": 0},
            {"bar": 0, "column": "security_id", "foo": 0, "security_id": 1},
        ]
        unittest.assertEqual(
            response_data["data"],
            expected,
            "should return scores",
        )
        pps_val = next(
            (
                p
                for p in response_data["pps"]
                if p["y"] == "security_id" and p["x"] == "foo"
            ),
            None,
        )
        expected = {
            "baseline_score": 12.5,
            "case": "regression",
            "is_valid_score": "True",
            "metric": "mean absolute error",
            "model": "DecisionTreeRegressor()",
            "model_score": 12.635071,
            "ppscore": 0,
            "x": "foo",
            "y": "security_id",
        }
        unittest.assertEqual(pps_val, expected, "should return PPS information")
        assert "import ppscore" in response_data["code"]
        assert "corr_data = ppscore.matrix(corr_data)" in response_data["code"]


CORRELATIONS_TS_CODE = """# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

corr_ts = df.groupby('date')['foo', 'bar'].corr(method='pearson')
corr_ts.index.names = ['date', 'column']
corr_ts = corr_ts[corr_ts.column == 'foo'][['date', 'bar']]

corr_ts.columns = ['date', 'corr']"""


@pytest.mark.unit
def test_get_correlations_ts(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(
        build_ts_data(size=50), columns=["date", "security_id", "foo", "bar"]
    )
    test_data.loc[:, "baz"] = "baz"

    no_pps = parse_version(platform.python_version()) < parse_version("3.6.0")

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(dateCol="date", cols=json.dumps(["foo", "bar"]))
        response = c.get(
            "/dtale/correlations-ts/{}".format(c.port), query_string=params
        )
        response_data = json.loads(response.data)
        expected = {
            "data": {
                "all": {
                    "x": [
                        "2000-01-01",
                        "2000-01-02",
                        "2000-01-03",
                        "2000-01-04",
                        "2000-01-05",
                    ],
                    "corr": [1.0, 1.0, 1.0, 1.0, 1.0],
                }
            },
            "max": {"corr": 1.0, "x": "2000-01-05"},
            "min": {"corr": 1.0, "x": "2000-01-01"},
            "pps": None
            if no_pps
            else {
                "baseline_score": 12.5,
                "case": "regression",
                "is_valid_score": True,
                "metric": "mean absolute error",
                "model": "DecisionTreeRegressor()",
                "model_score": 0.0,
                "ppscore": 1.0,
                "x": "foo",
                "y": "bar",
            },
            "success": True,
        }
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return timeseries correlation",
        )
        unittest.assertEqual(response_data["code"], CORRELATIONS_TS_CODE)

        params["cols"] = json.dumps(["foo", "baz_baz"])
        params["dummyCols"] = json.dumps(["baz"])
        response = c.get(
            "/dtale/correlations-ts/{}".format(c.port), query_string=params
        )
        response_data = json.loads(response.data)
        assert response_data["success"]

        params["cols"] = json.dumps(["foo", "bar"])
        del params["dummyCols"]
        params["rolling"] = False
        params["rollingWindow"] = 4
        params["minPeriods"] = 4
        response = c.get(
            "/dtale/correlations-ts/{}".format(c.port), query_string=params
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["data"]["all"]["x"], ["2000-01-04", "2000-01-05"]
        )

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(
            dateCol="date",
            cols=json.dumps(["0", "1"]),
            rolling=True,
            rollingWindow="4",
        )
        response = c.get(
            "/dtale/correlations-ts/{}".format(c.port), query_string=params
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["success"], True, "should return rolling correlation"
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        settings = {c.port: {"query": "missing_col == 'blah'"}}
        build_settings(settings)
        response = c.get("/dtale/correlations-ts/{}".format(c.port))
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle correlations exception",
        )


SCATTER_CODE = """# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

scatter_data = df[df['date'] == '2000-01-01']
scatter_data = scatter_data['foo', 'bar'].dropna(how='any')
scatter_data['_corr_index'] = scatter_data.index
s0 = scatter_data['foo']
s1 = scatter_data['bar']
pearson = s0.corr(s1, method='pearson')
spearman = s0.corr(s1, method='spearman')

import ppscore

pps = ppscore.score(data, 'foo', 'bar')
only_in_s0 = len(scatter_data[scatter_data['foo'].isnull()])
only_in_s1 = len(scatter_data[scatter_data['bar'].isnull()])"""


@pytest.mark.unit
def test_get_scatter(unittest, rolling_data):
    import dtale.views as views

    no_pps = parse_version(platform.python_version()) < parse_version("3.6.0")
    test_data = pd.DataFrame(
        build_ts_data(), columns=["date", "security_id", "foo", "bar"]
    )
    test_data.loc[:, "baz"] = "baz"
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        params = dict(dateCol="date", cols=json.dumps(["foo", "bar"]), index=0)
        response = c.get("/dtale/scatter/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = dict(
            y="bar",
            stats={
                "pearson": 0.9999999999999999,
                "correlated": 5,
                "only_in_s0": 0,
                "only_in_s1": 0,
                "spearman": 0.9999999999999999,
                "pps": None
                if no_pps
                else {
                    "baseline_score": 1.2,
                    "case": "regression",
                    "is_valid_score": True,
                    "metric": "mean absolute error",
                    "model": "DecisionTreeRegressor()",
                    "model_score": 1.0,
                    "ppscore": 0.16666666666666663,
                    "x": "foo",
                    "y": "bar",
                },
            },
            data={
                "all": {
                    "bar": [0, 1, 2, 3, 4],
                    "_corr_index": [0, 1, 2, 3, 4],
                    "x": [0, 1, 2, 3, 4],
                }
            },
            max={"bar": 4, "_corr_index": 4, "x": 4},
            min={"bar": 0, "_corr_index": 0, "x": 0},
            x="foo",
            date=" for 2000-01-01",
        )
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return scatter",
        )
        unittest.assertEqual(response_data["code"], SCATTER_CODE)

        params["cols"] = json.dumps(["foo", "baz_baz"])
        params["dummyCols"] = json.dumps(["baz"])
        response = c.get("/dtale/scatter/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["data"]["all"]["baz_baz"], ["1", "1", "1", "1", "1"]
        )

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(
            dateCol="date",
            cols=json.dumps(["0", "1"]),
            index=699,
            rolling=True,
            window="4",
        )
        response = c.get("/dtale/scatter/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert len(response_data["data"]["all"]["1"]) == 4
        assert sorted(response_data["data"]["all"]) == ["1", "_corr_index", "date", "x"]
        unittest.assertEqual(
            sorted(response_data["data"]["all"]["date"]),
            ["2019-11-28", "2019-11-29", "2019-11-30", "2019-12-01"],
            "should return scatter",
        )

    test_data = pd.DataFrame(
        build_ts_data(size=15001, days=1), columns=["date", "security_id", "foo", "bar"]
    )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        params = dict(dateCol="date", cols=json.dumps(["foo", "bar"]), date="20000101")
        response = c.get("/dtale/scatter/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = dict(
            stats={
                "correlated": 15001,
                "only_in_s0": 0,
                "only_in_s1": 0,
                "pearson": 1.0,
                "pps": None
                if no_pps
                else {
                    "baseline_score": 3736.0678,
                    "case": "regression",
                    "is_valid_score": True,
                    "metric": "mean absolute error",
                    "model": "DecisionTreeRegressor()",
                    "model_score": 2.2682,
                    "ppscore": 0.9993928911033145,
                    "x": "foo",
                    "y": "bar",
                },
                "spearman": 1.0,
            },
            error="Dataset exceeds 15,000 records, cannot render scatter. Please apply filter...",
            traceback=CHART_POINTS_LIMIT,
        )
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return scatter",
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        settings = {c.port: {"query": "missing_col == 'blah'"}}
        build_settings(settings)
        params = dict(dateCol="date", cols=json.dumps(["foo", "bar"]), date="20000101")
        response = c.get("/dtale/scatter/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle correlations exception",
        )
