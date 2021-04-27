import datetime

import numpy as np
import pandas as pd
import pytest

from tests.dtale import build_data_inst, build_settings, build_dtypes
from tests.dtale.test_views import app


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
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="a", rowIndex=0, updated=2),
        )
        assert "error" not in resp.json
        assert data[c.port]["a"].values[0] == 2


@pytest.mark.unit
def test_edit_float():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="b", rowIndex=0, updated=2.5),
        )
        assert "error" not in resp.json
        assert data[c.port]["b"].values[0] == 2.5


@pytest.mark.unit
def test_edit_date():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="d", rowIndex=0, updated="20000102"),
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
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(
                col="e", rowIndex=0, updated="20000101 11:58:59.999999999"
            ),
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
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="f", rowIndex=0, updated="False"),
        )
        assert "error" not in resp.json
        assert not data[c.port]["f"].values[0]


@pytest.mark.unit
def test_edit_timedelta():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="g", rowIndex=0, updated="0 days 00:09:20"),
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
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="h", rowIndex=0, updated="cbd"),
        )
        assert "error" not in resp.json
        assert data[c.port]["h"].values[0] == "cbd"


@pytest.mark.unit
def test_edit_to_nan():
    from dtale.views import build_dtypes_state, format_data

    df = edit_data()
    df, _ = format_data(df)
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="a", rowIndex=0, updated="nan"),
        )
        assert pd.isnull(data[c.port].a.values[0])
        c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="b", rowIndex=0, updated="inf"),
        )
        assert np.isinf(data[c.port].b.values[0])
