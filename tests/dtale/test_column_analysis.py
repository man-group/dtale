import json
import mock
import numpy as np
import os
import pandas as pd
import pytest

import dtale.global_state as global_state

from tests.dtale.test_views import app
from tests import ExitStack
from tests.dtale import build_data_inst, build_settings, build_dtypes

HISTOGRAM_CODE = open(
    os.path.join(os.path.dirname(__file__), "..", "data/histogram_code.txt")
).read()


@pytest.mark.unit
def test_get_column_analysis(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack():
            build_data_inst({c.port: test_data})
            build_dtypes({c.port: views.build_dtypes_state(test_data)})
            build_settings({c.port: {}})
            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(col="foo", filtered="true"),
            )
            response_data = json.loads(response.data)
            expected = dict(
                labels=[
                    "0.6",
                    "0.6",
                    "0.7",
                    "0.7",
                    "0.8",
                    "0.8",
                    "0.9",
                    "0.9",
                    "0.9",
                    "1.0",
                    "1.1",
                    "1.1",
                    "1.1",
                    "1.2",
                    "1.2",
                    "1.3",
                    "1.4",
                    "1.4",
                    "1.5",
                    "1.5",
                ],
                data=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                desc={
                    "count": "50",
                    "std": "0",
                    "min": "1",
                    "max": "1",
                    "50%": "1",
                    "25%": "1",
                    "75%": "1",
                    "mean": "1",
                    "missing_ct": "0",
                    "missing_pct": 0.0,
                    "total_count": "50",
                    "kurt": 0.0,
                    "skew": 0.0,
                },
                chart_type="histogram",
                dtype="int64",
                query="",
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k not in ["code", "cols"]},
                expected,
                "should return 20-bin histogram for foo",
            )
            unittest.assertEqual(response_data["code"], HISTOGRAM_CODE)

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(col="foo", bins=5, filtered="true"),
            )
            response_data = json.loads(response.data)
            expected = dict(
                labels=["0.7", "0.9", "1.1", "1.3", "1.5"],
                data=[0, 0, 50, 0, 0],
                desc={
                    "count": "50",
                    "std": "0",
                    "min": "1",
                    "max": "1",
                    "50%": "1",
                    "25%": "1",
                    "75%": "1",
                    "mean": "1",
                    "missing_ct": "0",
                    "missing_pct": 0.0,
                    "total_count": "50",
                    "kurt": 0.0,
                    "skew": 0.0,
                },
                chart_type="histogram",
                dtype="int64",
                query="",
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k not in ["code", "cols"]},
                expected,
                "should return 5-bin histogram for foo",
            )
            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(col="foo", bins=5, target="baz", filtered="true"),
            )
            response_data = json.loads(response.data)
            assert len(response_data["targets"])
            assert response_data["targets"][0]["target"] == "baz"

            global_state.set_settings(c.port, dict(query="security_id > 10"))
            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(col="foo", bins=5, filtered="true"),
            )
            response_data = json.loads(response.data)
            expected = dict(
                labels=["0.7", "0.9", "1.1", "1.3", "1.5"],
                data=[0, 0, 39, 0, 0],
                desc={
                    "count": "39",
                    "std": "0",
                    "min": "1",
                    "max": "1",
                    "50%": "1",
                    "25%": "1",
                    "75%": "1",
                    "mean": "1",
                    "missing_ct": "0",
                    "missing_pct": 0.0,
                    "total_count": "39",
                    "kurt": 0.0,
                    "skew": 0.0,
                },
                chart_type="histogram",
                dtype="int64",
                query="security_id > 10",
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k not in ["code", "cols"]},
                expected,
                "should return a filtered 5-bin histogram for foo",
            )
            global_state.set_settings(c.port, {})
            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(
                    col="foo", type="value_counts", top=2, filtered="true"
                ),
            )
            response_data = json.loads(response.data)
            assert response_data["chart_type"] == "value_counts"

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(
                    col="foo",
                    type="value_counts",
                    ordinalCol="bar",
                    ordinalAgg="mean",
                    filtered="true",
                ),
            )
            response_data = json.loads(response.data)
            assert "ordinal" in response_data

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(
                    col="foo",
                    type="value_counts",
                    ordinalCol="bar",
                    ordinalAgg="pctsum",
                    filtered="true",
                ),
            )
            response_data = json.loads(response.data)
            assert "ordinal" in response_data

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(
                    col="bar",
                    type="categories",
                    categoryCol="foo",
                    categoryAgg="mean",
                    filtered="true",
                ),
            )
            response_data = json.loads(response.data)
            assert "count" in response_data

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(
                    col="bar",
                    type="categories",
                    categoryCol="foo",
                    categoryAgg="pctsum",
                    filtered="true",
                ),
            )
            response_data = json.loads(response.data)
            assert "count" in response_data

    with app.test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: test_data})
            stack.enter_context(
                mock.patch(
                    "numpy.histogram",
                    mock.Mock(side_effect=Exception("histogram failure")),
                )
            )

            response = c.get(
                "/dtale/column-analysis/{}".format(c.port),
                query_string=dict(col="foo", filtered="true"),
            )
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data["error"],
                "histogram failure",
                "should handle histogram exception",
            )


@pytest.mark.unit
def test_get_column_analysis_word_value_count(unittest):
    df = pd.DataFrame(dict(a=["a b c", "d e f", "g h i"], b=[3, 4, 5]))
    with app.test_client() as c:
        build_data_inst({c.port: df})
        settings = {c.port: {}}
        build_settings(settings)
        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(col="a", type="word_value_counts"),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["labels"], ["a", "b", "c", "d", "e", "f", "g", "h", "i"]
        )
        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(
                col="a",
                type="word_value_counts",
                ordinalCol="b",
                ordinalAgg="mean",
                cleaner="underscore_to_space",
            ),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data["ordinal"], [3, 3, 3, 4, 4, 4, 5, 5, 5])

        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(
                col="a",
                type="word_value_counts",
                ordinalCol="b",
                ordinalAgg="pctsum",
            ),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["ordinal"],
            [
                0.083333,
                0.083333,
                0.083333,
                0.111111,
                0.111111,
                0.111111,
                0.138889,
                0.138889,
                0.138889,
            ],
        )


@pytest.mark.unit
def test_get_column_analysis_kde():
    import dtale.views as views

    df = pd.DataFrame(dict(a=np.random.randn(100)))
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        settings = {c.port: {}}
        build_settings(settings)
        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(col="a", type="histogram", bins=50),
        )
        response_data = json.loads(response.data)
        assert len(response_data["kde"]) == 51


@pytest.mark.unit
def test_get_column_analysis_geolocation(unittest):
    df = pd.DataFrame(dict(a=[1, 2, 3], b=[3, 4, 5]))
    with app.test_client() as c:
        build_data_inst({c.port: df})
        settings = {c.port: {}}
        build_settings(settings)
        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(col="a", type="geolocation", latCol="a", lonCol="b"),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data["lat"], [1, 2, 3])
        unittest.assertEqual(response_data["lon"], [3, 4, 5])


@pytest.mark.unit
def test_get_column_analysis_qq():
    import dtale.views as views

    df = pd.DataFrame(dict(a=np.random.normal(loc=20, scale=5, size=100)))
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        settings = {c.port: {}}
        build_settings(settings)
        response = c.get(
            "/dtale/column-analysis/{}".format(c.port),
            query_string=dict(col="a", type="qq"),
        )
        response_data = json.loads(response.data)
        assert all(len(response_data[prop]) == 100 for prop in ["x", "y", "x2", "y2"])
