import datetime

import mock
import numpy as np
import pandas as pd
import pytest
from six import PY3

from dtale.app import build_app

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack

URL = "http://localhost:40000"
app = build_app(url=URL)


def edit_data():
    df = pd.DataFrame(
        [
            dict(
                a=1,
                b=1.25,
                c="abc",
                d=pd.Timestamp("20000101"),
                e=pd.Timestamp("20000101 11:59:59.999999999"),
                f=True,
                g=datetime.timedelta(seconds=500),
            )
        ]
    )
    df.loc[:, "h"] = pd.Series(["abc"], dtype="category")
    return df


@pytest.mark.unit
def test_edit_int():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/a".format(c.port),
                query_string=dict(rowIndex=0, updated=2),
            )
            assert "error" not in resp.json
            assert data[c.port]["a"].values[0] == 2


@pytest.mark.unit
def test_edit_float():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/b".format(c.port),
                query_string=dict(rowIndex=0, updated=2.5),
            )
            assert "error" not in resp.json
            assert data[c.port]["b"].values[0] == 2.5


@pytest.mark.unit
def test_edit_date():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/d".format(c.port),
                query_string=dict(rowIndex=0, updated="20000102"),
            )
            assert "error" not in resp.json
            assert pd.Timestamp(data[c.port]["d"].values[0]) == pd.Timestamp(
                "2000-01-02 00:00:00"
            )


@pytest.mark.unit
def test_edit_timestamp():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/e".format(c.port),
                query_string=dict(rowIndex=0, updated="20000101 11:58:59.999999999"),
            )
            assert "error" not in resp.json
            assert pd.Timestamp(data[c.port]["e"].values[0]) == pd.Timestamp(
                "2000-01-01 11:58:59.999999999"
            )


@pytest.mark.unit
def test_edit_bool():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/f".format(c.port),
                query_string=dict(rowIndex=0, updated="False"),
            )
            assert "error" not in resp.json
            assert not data[c.port]["f"].values[0]


@pytest.mark.unit
def test_edit_timedelta():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/g".format(c.port),
                query_string=dict(rowIndex=0, updated="0 days 00:09:20"),
            )
            assert "error" not in resp.json
            assert pd.Timedelta(data[c.port]["g"].values[0]) == pd.Timedelta(
                "0 days 00:09:20"
            )


@pytest.mark.unit
def test_edit_string():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            resp = c.get(
                "/dtale/edit-cell/{}/h".format(c.port),
                query_string=dict(rowIndex=0, updated="cbd"),
            )
            assert "error" not in resp.json
            assert data[c.port]["h"].values[0] == "cbd"


@pytest.mark.unit
def test_edit_to_nan():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            settings = {c.port: {"locked": ["a"]}}
            stack.enter_context(mock.patch("dtale.global_state.SETTINGS", settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch("dtale.global_state.DTYPES", dtypes))
            c.get(
                "/dtale/edit-cell/{}/a".format(c.port),
                query_string=dict(rowIndex=0, updated="nan"),
            )
            assert pd.isnull(data[c.port].a.values[0])
            c.get(
                "/dtale/edit-cell/{}/b".format(c.port),
                query_string=dict(rowIndex=0, updated="inf"),
            )
            assert np.isinf(data[c.port].b.values[0])
