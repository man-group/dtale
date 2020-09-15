import json

import mock
import numpy as np
import pandas as pd
import pytest
import sklearn as skl
from pkg_resources import parse_version
from six import PY3

from dtale.column_replacements import ColumnReplacement
from tests.dtale.test_views import app

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


def replacements_data():
    return pd.DataFrame.from_dict(
        {
            "a": ["a", "UNknown", "b"],
            "b": ["", " ", " - "],
            "c": [1, "", 3],
            "d": [1.1, np.nan, 3],
            "e": ["a", np.nan, "b"],
        }
    )


def verify_builder(builder, checker):
    checker(builder.build_replacements())
    assert builder.build_code()


@pytest.mark.unit
def test_spaces(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "spaces"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        builder = ColumnReplacement(data_id, "b", replacement_type, {})
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["", np.nan, " - "]),
        )

        builder = ColumnReplacement(data_id, "b", replacement_type, {"value": "blah"})
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["", "blah", " - "]),
        )


@pytest.mark.unit
def test_string(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "strings"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"value": "unknown", "ignoreCase": True, "isChar": False}
        builder = ColumnReplacement(data_id, "a", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["a", np.nan, "b"]),
        )

        cfg = {"value": "unknown", "ignoreCase": False, "isChar": False}
        builder = ColumnReplacement(data_id, "a", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["a", "UNknown", "b"]),
        )

        cfg = {
            "value": "unknown",
            "ignoreCase": True,
            "isChar": False,
            "replace": "missing",
        }
        builder = ColumnReplacement(data_id, "a", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["a", "missing", "b"]),
        )

        cfg = {"value": "-", "ignoreCase": True, "isChar": True}
        builder = ColumnReplacement(data_id, "b", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["", " ", np.nan]),
        )

        cfg = {"value": "-", "ignoreCase": True, "isChar": True, "replace": "missing"}
        builder = ColumnReplacement(data_id, "b", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["", " ", "missing"]),
        )


@pytest.mark.unit
def test_value(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "value"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"value": [dict(value="nan", type="raw", replace="for test")]}
        builder = ColumnReplacement(data_id, "e", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["a", "for test", "b"]),
        )

        cfg = {
            "value": [
                dict(value="nan", type="raw", replace="for test"),
                dict(value="a", type="raw", replace="d"),
            ]
        }
        builder = ColumnReplacement(data_id, "e", replacement_type, cfg)
        verify_builder(
            builder,
            lambda col: unittest.assertEqual(list(col.values), ["d", "for test", "b"]),
        )

        cfg = {"value": [dict(value="nan", type="agg", replace="median")]}
        builder = ColumnReplacement(data_id, "d", replacement_type, cfg)
        verify_builder(
            builder, lambda col: unittest.assertEqual(list(col.values), [1.1, 2.05, 3])
        )


@pytest.mark.skipif(
    parse_version(skl.__version__) < parse_version("0.21.0"),
    reason="requires scikit-learn 0.21.0",
)
def test_iterative_imputers(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "imputer"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"type": "iterative"}
        builder = ColumnReplacement(data_id, "d", replacement_type, cfg)
        verify_builder(
            builder, lambda col: unittest.assertEqual(list(col.values), [1.1, 2.05, 3])
        )


@pytest.mark.skipif(
    parse_version(skl.__version__) < parse_version("0.22.0"),
    reason="requires scikit-learn 0.22.0",
)
def test_knn_imputers(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "imputer"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"type": "knn", "n_neighbors": 3}
        builder = ColumnReplacement(data_id, "d", replacement_type, cfg)
        verify_builder(
            builder, lambda col: unittest.assertEqual(list(col.values), [1.1, 2.05, 3])
        )


@pytest.mark.skipif(
    parse_version(skl.__version__) < parse_version("0.20.0"),
    reason="requires scikit-learn 0.20.0",
)
def test_simple_imputers(unittest):
    df = replacements_data()
    data_id, replacement_type = "1", "imputer"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"type": "simple"}
        builder = ColumnReplacement(data_id, "d", replacement_type, cfg)
        verify_builder(
            builder, lambda col: unittest.assertEqual(list(col.values), [1.1, 2.05, 3])
        )


@pytest.mark.unit
def test_view(unittest):
    from dtale.views import build_dtypes_state

    df = replacements_data()
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/build-replacement/{}".format(c.port),
                query_string=dict(
                    type="not_implemented", name="test", cfg=json.dumps({})
                ),
            )
            response_data = resp.json
            assert (
                response_data["error"]
                == "'not_implemented' replacement not implemented yet!"
            )

            params = dict(
                type="value",
                col="e",
                name="a",
                cfg=json.dumps(
                    {"value": [dict(value="nan", type="raw", replace="for test")]}
                ),
            )
            resp = c.get(
                "/dtale/build-replacement/{}".format(c.port), query_string=params
            )
            response_data = resp.json
            assert response_data["error"] == "A column named 'a' already exists!"

            params = dict(
                type="value",
                col="e",
                name="e2",
                cfg=json.dumps(
                    {"value": [dict(value="nan", type="raw", replace="for test")]}
                ),
            )
            c.get("/dtale/build-replacement/{}".format(c.port), query_string=params)
            unittest.assertEqual(
                list(data[c.port]["e2"].values), ["a", "for test", "b"]
            )
            assert dtypes[c.port][-1]["name"] == "e2"
            assert dtypes[c.port][-1]["dtype"] == "string" if PY3 else "mixed"
            assert not dtypes[c.port][-1]["hasMissing"]

            del params["name"]
            c.get("/dtale/build-replacement/{}".format(c.port), query_string=params)
            unittest.assertEqual(list(data[c.port]["e"].values), ["a", "for test", "b"])
            e_dtype = next((d for d in dtypes[c.port] if d["name"] == "e"))
            assert not e_dtype["hasMissing"]
