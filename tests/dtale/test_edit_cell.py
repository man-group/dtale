import datetime
import json

import numpy as np
import pandas as pd
import pytest

from dtale.pandas_util import is_pandas3
from tests.dtale import build_data


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
def test_edit_int(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="a", rowIndex=0, updated=2),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert global_state.get_data(client.port)["a"].values[0] == 2


@pytest.mark.unit
def test_edit_float(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="b", rowIndex=0, updated=2.5),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert global_state.get_data(client.port)["b"].values[0] == 2.5


@pytest.mark.unit
def test_edit_date(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="d", rowIndex=0, updated="20000102"),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert pd.Timestamp(
        global_state.get_data(client.port)["d"].values[0]
    ) == pd.Timestamp("2000-01-02 00:00:00")


@pytest.mark.unit
def test_edit_timestamp(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="e", rowIndex=0, updated="20000101 11:58:59.999999999"),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert pd.Timestamp(
        global_state.get_data(client.port)["e"].values[0]
    ) == pd.Timestamp("2000-01-01 11:58:59.999999999")


@pytest.mark.unit
def test_edit_bool(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="f", rowIndex=0, updated="False"),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert not global_state.get_data(client.port)["f"].values[0]


@pytest.mark.unit
def test_edit_timedelta(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="g", rowIndex=0, updated="0 days 00:09:20"),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert pd.Timedelta(
        global_state.get_data(client.port)["g"].values[0]
    ) == pd.Timedelta("0 days 00:09:20")


@pytest.mark.unit
def test_edit_string(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="h", rowIndex=0, updated="cbd"),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    assert global_state.get_data(client.port)["h"].values[0] == "cbd"


@pytest.mark.unit
def test_edit_filtered_string(client):
    from dtale.views import format_data

    df = pd.DataFrame(
        {"a": ["yes", "no", "no", "maybe"], "b": ["AAAA", "bar", "spam", "eggs"]}
    )
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    client.get(
        "/dtale/save-column-filter/{}".format(client.port),
        query_string=dict(
            col="a", cfg=json.dumps({"type": "string", "value": ["maybe"]})
        ),
    )
    resp = client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="b", rowIndex=0, updated=""),
    )
    assert "error" not in resp.json
    import dtale.global_state as global_state

    if is_pandas3():
        assert pd.isna(global_state.get_data(client.port)["b"].values[-1])
    else:
        assert global_state.get_data(client.port)["b"].values[-1] is None


@pytest.mark.unit
def test_edit_to_nan(client):
    from dtale.views import format_data

    df = edit_data()
    df, _ = format_data(df)
    build_data(client.port, df, {"locked": ["a"]})
    import dtale.global_state as global_state

    client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="a", rowIndex=0, updated="nan"),
    )
    assert pd.isnull(global_state.get_data(client.port).a.values[0])
    client.get(
        "/dtale/edit-cell/{}".format(client.port),
        query_string=dict(col="b", rowIndex=0, updated="inf"),
    )
    assert np.isinf(global_state.get_data(client.port).b.values[0])
