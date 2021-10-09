import json
from builtins import str

import mock
import numpy as np
import os
import dtale.global_state as global_state
import pandas as pd
import pandas.util.testing as pdt
import platform
import pytest
from pandas.tseries.offsets import Day
from six import PY3

from dtale.app import build_app
from dtale.utils import DuplicateDataError
from tests import ExitStack
from tests.dtale import build_data_inst, build_settings, build_dtypes


URL = "http://localhost:40000"
app = build_app(url=URL)


@pytest.mark.unit
def test_head_endpoint():
    import dtale.views as views

    build_data_inst({"1": None, "2": None})
    assert views.head_endpoint() == "main/1"
    assert views.head_endpoint("test_popup") == "popup/test_popup/1"

    global_state.clear_store()
    assert views.head_endpoint() == "popup/upload"


@pytest.mark.unit
def test_startup(unittest):
    import dtale.views as views
    import dtale.global_state as global_state

    global_state.clear_store()

    instance = views.startup(URL)
    assert instance._data_id == 1

    with pytest.raises(views.NoDataLoadedException) as error:
        views.startup(URL, data_loader=lambda: None)
    assert "No data has been loaded into this D-Tale session!" in str(
        error.value.args[0]
    )

    with pytest.raises(BaseException) as error:
        views.startup(URL, "bad type")
    assert (
        "data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex"
        in str(error.value)
    )

    test_data = pd.DataFrame([dict(date=pd.Timestamp("now"), security_id=1, foo=1.5)])
    test_data = test_data.set_index(["date", "security_id"])
    instance = views.startup(
        URL, data_loader=lambda: test_data, sort=[("security_id", "ASC")]
    )

    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            columnFormats=None,
            locked=["date", "security_id"],
            precision=2,
            sortInfo=[("security_id", "ASC")],
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
        ),
        "should lock index columns",
    )

    test_data = test_data.reset_index()
    with pytest.raises(DuplicateDataError):
        views.startup(URL, data=test_data, ignore_duplicate=False)

    range_highlights = {
        "foo": {
            "active": True,
            "equals": {
                "active": True,
                "value": 3,
                "color": {"r": 255, "g": 245, "b": 157, "a": 1},
            },  # light yellow
            "greaterThan": {
                "active": True,
                "value": 3,
                "color": {"r": 80, "g": 227, "b": 194, "a": 1},
            },  # mint green
            "lessThan": {
                "active": True,
                "value": 3,
                "color": {"r": 245, "g": 166, "b": 35, "a": 1},
            },  # orange
        }
    }
    instance = views.startup(
        URL,
        data=test_data,
        ignore_duplicate=True,
        allow_cell_edits=False,
        precision=6,
        range_highlights=range_highlights,
    )
    pdt.assert_frame_equal(instance.data, test_data)
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=False,
            columnFormats=None,
            locked=[],
            precision=6,
            rangeHighlight=range_highlights,
            backgroundMode=None,
            verticalHeaders=False,
        ),
        "no index = nothing locked",
    )

    test_data = pd.DataFrame([dict(date=pd.Timestamp("now"), security_id=1)])
    test_data = test_data.set_index("security_id").date
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            columnFormats=None,
            locked=["security_id"],
            precision=2,
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
        ),
        "should lock index columns",
    )

    test_data = pd.DatetimeIndex([pd.Timestamp("now")], name="date")
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            locked=[],
            precision=2,
            columnFormats=None,
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
        ),
        "should lock index columns",
    )

    test_data = pd.MultiIndex.from_arrays([[1, 2], [3, 4]], names=("a", "b"))
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            locked=[],
            precision=2,
            columnFormats=None,
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
        ),
        "should lock index columns",
    )

    test_data = pd.DataFrame(
        [
            dict(date=pd.Timestamp("now"), security_id=1, foo=1.0, bar=2.0),
            dict(date=pd.Timestamp("now"), security_id=1, foo=2.0, bar=np.inf),
        ],
        columns=["date", "security_id", "foo", "bar"],
    )
    instance = views.startup(URL, data_loader=lambda: test_data)
    unittest.assertEqual(
        {
            "name": "bar",
            "dtype": "float64",
            "index": 3,
            "visible": True,
            "hasMissing": 0,
            "hasOutliers": 0,
            "lowVariance": False,
            "unique_ct": 2,
            "kurt": "nan",
            "skew": "nan",
            "coord": None,
        },
        next(
            (
                dt
                for dt in global_state.get_dtypes(instance._data_id)
                if dt["name"] == "bar"
            ),
            None,
        ),
    )

    test_data = pd.DataFrame([dict(a=1, b=2)])
    test_data = test_data.rename(columns={"b": "a"})
    with pytest.raises(Exception) as error:
        views.startup(URL, data_loader=lambda: test_data)
    assert "data contains duplicated column names: a" in str(error)

    test_data = pd.DataFrame([dict(a=1, b=2)])
    test_data = test_data.set_index("a")
    views.startup(URL, data=test_data, inplace=True, drop_index=True)
    assert "a" not in test_data.columns

    test_data = np.array([1, 2, 3])
    instance = views.startup(URL, data_loader=lambda: test_data)
    unittest.assertEqual(list(instance.data.iloc[:, 0].tolist()), test_data.tolist())

    test_data = np.ndarray(shape=(2, 2), dtype=float, order="F")
    instance = views.startup(URL, data_loader=lambda: test_data)
    unittest.assertEqual(instance.data.values.tolist(), test_data.tolist())

    test_data = [1, 2, 3]
    instance = views.startup(URL, data_loader=lambda: test_data, ignore_duplicate=True)
    unittest.assertEqual(instance.data.iloc[:, 0].tolist(), test_data)

    test_data = dict(a=[1, 2, 3], b=[4, 5, 6])
    instance = views.startup(URL, data_loader=lambda: test_data, ignore_duplicate=True)
    unittest.assertEqual(instance.data["a"].values.tolist(), test_data["a"])
    unittest.assertEqual(instance.data["b"].values.tolist(), test_data["b"])

    test_data = dict(a=1, b=2, c=3)
    instance = views.startup(URL, data_loader=lambda: test_data, ignore_duplicate=True)
    unittest.assertEqual(
        sorted(instance.data["index"].values.tolist()), sorted(test_data.keys())
    )
    unittest.assertEqual(
        sorted(instance.data["0"].values.tolist()), sorted(test_data.values())
    )

    test_data = pd.DataFrame(
        dict(
            a=["{}".format(i) for i in range(10)],
            b=["{}".format(i % 2) for i in range(10)],
        )
    )
    instance = views.startup(
        URL,
        data_loader=lambda: test_data,
        ignore_duplicate=True,
        optimize_dataframe=True,
    )
    unittest.assertEqual(
        list(instance.data.dtypes.apply(lambda x: x.name).values),
        ["object", "category"],
    )

    if PY3:
        s_int = pd.Series([1, 2, 3, 4, 5], index=list("abcde"), dtype=pd.Int64Dtype())
        s2_int = s_int.reindex(["a", "b", "c", "f", "u"])
        ints = pd.Series([1, 2, 3, 4, 5], index=list("abcfu"))
        test_data = pd.DataFrame(dict(na=s2_int, int=ints))
        test_data.loc[:, "unsigned_int"] = pd.to_numeric(
            test_data["int"], downcast="unsigned"
        )
        instance = views.startup(
            URL,
            data_loader=lambda: test_data,
            ignore_duplicate=True,
        )

        unittest.assertEqual(
            {
                "coord": None,
                "dtype": "Int64",
                "hasMissing": 2,
                "hasOutliers": 0,
                "index": 1,
                "kurt": "nan",
                "lowVariance": False,
                "max": 3,
                "min": 1,
                "name": "na",
                "skew": 0.0,
                "unique_ct": 3,
                "visible": True,
                "outlierRange": {"lower": 0.0, "upper": 4.0},
            },
            global_state.get_dtypes(instance._data_id)[1],
        )

        unittest.assertEqual(
            {
                "dtype": "uint8",
                "hasMissing": 0,
                "hasOutliers": 0,
                "index": 3,
                "name": "unsigned_int",
                "unique_ct": 5,
                "visible": True,
            },
            global_state.get_dtypes(instance._data_id)[-1],
        )


@pytest.mark.unit
def test_formatting_complex_data(unittest):
    from dtale.views import format_data

    data = [[1, 2, 3], {1: "a", 2: "b", 3: "c"}, [1]]
    df, _ = format_data(pd.DataFrame({"foo": data}))
    unittest.assertEqual(
        list(df["foo"].values), ["[1, 2, 3]", "{1: 'a', 2: 'b', 3: 'c'}", "[1]"]
    )

    data = [1, 2, [3]]
    df, _ = format_data(pd.DataFrame({"foo": data}))
    unittest.assertEqual(list(df["foo"].values), ["1", "2", "[3]"])


@pytest.mark.unit
def test_in_ipython_frontend(builtin_pkg):
    import dtale.views as views

    orig_import = __import__

    mock_ipython = mock.Mock()

    class zmq(object):
        __name__ = "zmq"

        def __init__(self):
            pass

    mock_ipython.get_ipython = lambda: zmq()

    def import_mock(name, *args, **kwargs):
        if name == "IPython":
            return mock_ipython
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        assert views.in_ipython_frontend()

    def import_mock(name, *args, **kwargs):
        if name == "IPython":
            raise ImportError()
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        assert not views.in_ipython_frontend()


@pytest.mark.unit
def test_shutdown(unittest):
    with app.test_client() as c:
        try:
            c.get("/shutdown")
            unittest.fail()
        except:  # noqa
            pass
        mock_shutdown = mock.Mock()
        resp = c.get(
            "/shutdown", environ_base={"werkzeug.server.shutdown": mock_shutdown}
        ).data
        assert "Server shutting down..." in str(resp)
        mock_shutdown.assert_called()


@pytest.mark.unit
def test_get_send_file_max_age():
    with app.app_context():
        assert app.get_send_file_max_age("test") in [43200, None]
        assert 60 == app.get_send_file_max_age("dist/test.js")


@pytest.mark.unit
def test_processes(test_data, unittest):
    global_state.clear_store()
    from dtale.views import build_dtypes_state

    now = pd.Timestamp("20180430 12:36:44").tz_localize("US/Eastern")

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: build_dtypes_state(test_data)})
        global_state.set_metadata(c.port, dict(start=now))
        global_state.set_name(c.port, "foo")

        response = c.get("/dtale/processes")
        response_data = json.loads(response.data)
        unittest.assertEqual(
            [
                {
                    "rows": 50,
                    "name": u"foo",
                    "ts": 1525106204000,
                    "start": "12:36:44 PM",
                    "names": u"date,security_id,foo,bar,baz",
                    "data_id": str(c.port),
                    "columns": 5,
                    "mem_usage": 4600 if PY3 else 4000,
                }
            ],
            response_data["data"],
        )

        response = c.get("/dtale/process-keys")
        response_data = response.json
        assert response_data["data"][0]["id"] == str(c.port)

    global_state.clear_store()
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: build_dtypes_state(test_data)})
        global_state.set_metadata(c.port, {})
        response = c.get("/dtale/processes")
        response_data = json.loads(response.data)
        assert "error" in response_data


@pytest.mark.unit
def test_update_settings(test_data, unittest):
    settings = json.dumps(dict(locked=["a", "b"]))

    with app.test_client() as c:
        with ExitStack() as stack:
            global_state.set_data(c.port, test_data)
            mock_render_template = stack.enter_context(
                mock.patch(
                    "dtale.views.render_template",
                    mock.Mock(return_value=json.dumps(dict(success=True))),
                )
            )
            response = c.get(
                "/dtale/update-settings/{}".format(c.port),
                query_string=dict(settings=settings),
            )
            assert response.status_code == 200, "should return 200 response"

            c.get("/dtale/main/{}".format(c.port))
            _, kwargs = mock_render_template.call_args
            unittest.assertEqual(
                kwargs["settings"], settings, "settings should be retrieved"
            )

    settings = "a"
    with app.test_client() as c:
        with ExitStack() as stack:
            global_state.set_data(c.port, None)
            response = c.get(
                "/dtale/update-settings/{}".format(c.port),
                query_string=dict(settings=settings),
            )
            assert response.status_code == 200, "should return 200 response"
            response_data = json.loads(response.data)
            assert "error" in response_data


@pytest.mark.unit
def test_update_formats():
    from dtale.views import build_dtypes_state

    settings = dict()
    df = pd.DataFrame([dict(a=1, b=2)])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        response = c.get(
            "/dtale/update-formats/{}".format(c.port),
            query_string=dict(
                all=False, col="a", format=json.dumps(dict(fmt="", style={}))
            ),
        )
        assert response.status_code == 200, "should return 200 response"
        assert "a" in global_state.get_settings(c.port)["columnFormats"]

        c.get(
            "/dtale/update-formats/{}".format(c.port),
            query_string=dict(
                all=True,
                col="a",
                format=json.dumps(dict(fmt="", style={})),
                nanDisplay=None,
            ),
        )
        assert "b" in global_state.get_settings(c.port)["columnFormats"]
        assert "nan" in global_state.get_settings(c.port)["nanDisplay"]

    with app.test_client() as c:
        global_state.set_dtypes(c.port, None)
        response = c.get(
            "/dtale/update-formats/{}".format(c.port),
            query_string=dict(
                all=True, col="a", format=json.dumps(dict(fmt="", style={}))
            ),
        )
        assert "error" in response.json


@pytest.mark.unit
def test_update_column_position():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    tests = [
        ("front", 0),
        ("front", 0),
        ("left", 0),
        ("back", -1),
        ("back", -1),
        ("left", -2),
        ("right", -1),
        ("right", -1),
    ]
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        for action, col_idx in tests:
            c.get(
                "/dtale/update-column-position/{}".format(c.port),
                query_string=dict(action=action, col="c"),
            )
            assert global_state.get_data(c.port).columns[col_idx] == "c"
            assert global_state.get_dtypes(c.port)[col_idx]["name"] == "c"

        resp = c.get("/dtale/update-column-position/-1")
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_update_locked(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        settings = {c.port: dict(locked=[])}
        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)

        c.get(
            "/dtale/update-locked/{}".format(c.port),
            query_string=dict(action="lock", col="c"),
        )
        unittest.assertEqual(["c"], global_state.get_settings(c.port)["locked"])
        assert global_state.get_data(c.port).columns[0] == "c"
        assert global_state.get_dtypes(c.port)[0]["name"] == "c"

        c.get(
            "/dtale/update-locked/{}".format(c.port),
            query_string=dict(action="lock", col="c"),
        )
        unittest.assertEqual(["c"], global_state.get_settings(c.port)["locked"])
        assert global_state.get_data(c.port).columns[0] == "c"
        assert global_state.get_dtypes(c.port)[0]["name"] == "c"

        c.get(
            "/dtale/update-locked/{}".format(c.port),
            query_string=dict(action="unlock", col="c"),
        )
        unittest.assertEqual([], global_state.get_settings(c.port)["locked"])
        assert global_state.get_data(c.port).columns[0] == "c"
        assert global_state.get_dtypes(c.port)[0]["name"] == "c"

        resp = c.get("/dtale/update-locked/-1")
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_delete_cols():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        delete_cols = ["a", "b"]
        c.get(
            "/dtale/delete-col/{}".format(c.port),
            query_string=dict(cols=json.dumps(delete_cols)),
        )
        assert (
            len(
                [
                    col
                    for col in global_state.get_data(c.port).columns
                    if col in delete_cols
                ]
            )
            == 0
        )
        assert (
            next(
                (
                    dt
                    for dt in global_state.get_dtypes(c.port)
                    if dt["name"] in delete_cols
                ),
                None,
            )
            is None
        )
        assert len(global_state.get_settings(c.port)["locked"]) == 0

        resp = c.get("/dtale/delete-col/-1", query_string=dict(cols=json.dumps(["d"])))
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_rename_col():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        c.get(
            "/dtale/rename-col/{}".format(c.port),
            query_string=dict(col="a", rename="d"),
        )
        assert "a" not in global_state.get_data(c.port).columns
        assert (
            next(
                (dt for dt in global_state.get_dtypes(c.port) if dt["name"] == "a"),
                None,
            )
            is None
        )
        assert len(global_state.get_settings(c.port)["locked"]) == 1

        resp = c.get(
            "/dtale/rename-col/{}".format(c.port),
            query_string=dict(col="d", rename="b"),
        )
        assert "error" in json.loads(resp.data)

        resp = c.get("/dtale/rename-col/-1", query_string=dict(col="d", rename="b"))
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_outliers(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame.from_dict(
        {
            "a": [1, 2, 3, 4, 1000, 5, 3, 5, 55, 12, 13, 10000, 221, 12, 2000],
            "b": list(range(15)),
            "c": ["a"] * 15,
        }
    )
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get("/dtale/outliers/{}".format(c.port), query_string=dict(col="a"))
        resp = json.loads(resp.data)
        unittest.assertEqual(resp["outliers"], [1000, 10000, 2000])
        c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="a", cfg=json.dumps(dict(type="outliers", query=resp["query"]))
            ),
        )
        resp = c.get("/dtale/outliers/{}".format(c.port), query_string=dict(col="a"))
        resp = json.loads(resp.data)
        assert resp["queryApplied"]
        c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(col="a", cfg=json.dumps(dict(type="outliers"))),
        )
        resp = c.get("/dtale/outliers/{}".format(c.port), query_string=dict(col="a"))
        resp = json.loads(resp.data)
        assert not resp["queryApplied"]
        resp = c.get("/dtale/outliers/{}".format(c.port), query_string=dict(col="b"))
        resp = json.loads(resp.data)
        unittest.assertEqual(resp["outliers"], [])
        resp = c.get("/dtale/outliers/{}".format(c.port), query_string=dict(col="c"))
        resp = json.loads(resp.data)
        assert resp["outliers"] == []


@pytest.mark.unit
def test_toggle_outlier_filter(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame.from_dict(
        {
            "a": [1, 2, 3, 4, 1000, 5, 3, 5, 55, 12, 13, 10000, 221, 12, 2000],
            "b": list(range(15)),
            "c": ["a"] * 15,
        }
    )
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/toggle-outlier-filter/{}".format(c.port), query_string=dict(col="a")
        )
        resp = resp.get_json()
        assert resp["outlierFilters"]["a"]["query"] == "`a` > 339.75"
        assert (
            global_state.get_settings(c.port)["outlierFilters"]["a"]["query"]
            == "`a` > 339.75"
        )
        resp = c.get(
            "/dtale/toggle-outlier-filter/{}".format(c.port), query_string=dict(col="a")
        )
        resp = resp.get_json()
        assert "a" not in resp["outlierFilters"]
        assert "a" not in global_state.get_settings(c.port)["outlierFilters"]


@pytest.mark.unit
def test_update_visibility(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst({c.port: df})
        build_dtypes(dtypes)
        c.post(
            "/dtale/update-visibility/{}".format(c.port),
            data=dict(visibility=json.dumps({"a": True, "b": True, "c": False})),
        )
        unittest.assertEqual(
            [True, True, False],
            [col["visible"] for col in global_state.get_dtypes(c.port)],
        )
        c.post("/dtale/update-visibility/{}".format(c.port), data=dict(toggle="c"))
        unittest.assertEqual(
            [True, True, True],
            [col["visible"] for col in global_state.get_dtypes(c.port)],
        )

        resp = c.post("/dtale/update-visibility/-1", data=dict(toggle="foo"))
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_build_column():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3, d=pd.Timestamp("20200101"))])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="not_implemented", name="test", cfg=json.dumps({})),
        )
        response_data = json.loads(resp.data)
        assert (
            response_data["error"]
            == "'not_implemented' column builder not implemented yet!"
        )

        resp = c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", cfg=json.dumps({})),
        )
        response_data = json.loads(resp.data)
        assert response_data["error"] == "'name' is required for new column!"

        cfg = dict(left=dict(col="a"), right=dict(col="b"), operation="sum")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="sum", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["sum"].values[0] == 3
        assert global_state.get_dtypes(c.port)[-1]["name"] == "sum"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "int64"

        resp = c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="sum", cfg=json.dumps(cfg)),
        )
        response_data = json.loads(resp.data)
        assert response_data["error"] == "A column named 'sum' already exists!"

        cfg = dict(left=dict(col="a"), right=dict(col="b"), operation="difference")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="diff", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["diff"].values[0] == -1
        assert global_state.get_dtypes(c.port)[-1]["name"] == "diff"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "int64"
        cfg = dict(left=dict(col="a"), right=dict(col="b"), operation="multiply")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="mult", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["mult"].values[0] == 2
        assert global_state.get_dtypes(c.port)[-1]["name"] == "mult"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "int64"
        cfg = dict(left=dict(col="a"), right=dict(col="b"), operation="divide")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="div", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["div"].values[0] == 0.5
        assert global_state.get_dtypes(c.port)[-1]["name"] == "div"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "float64"
        cfg = dict(left=dict(col="a"), right=dict(val=100), operation="divide")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="div2", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["div2"].values[0] == 0.01
        assert global_state.get_dtypes(c.port)[-1]["name"] == "div2"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "float64"
        cfg = dict(left=dict(val=100), right=dict(col="b"), operation="divide")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="numeric", name="div3", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["div3"].values[0] == 50
        assert global_state.get_dtypes(c.port)[-1]["name"] == "div3"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "float64"

        cfg = dict(col="d", property="weekday")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="datetime", name="datep", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["datep"].values[0] == 2
        assert global_state.get_dtypes(c.port)[-1]["name"] == "datep"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "int64"

        for p in ["minute", "hour", "time", "date", "month", "quarter", "year"]:
            c.get(
                "/dtale/build-column/{}".format(c.port),
                query_string=dict(
                    type="datetime",
                    name=p,
                    cfg=json.dumps(dict(col="d", property=p)),
                ),
            )

        cfg = dict(col="d", conversion="month_end")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="datetime", name="month_end", cfg=json.dumps(cfg)),
        )
        assert (
            pd.Timestamp(data[c.port]["month_end"].values[0]).strftime("%Y%m%d")
            == "20200131"
        )
        assert global_state.get_dtypes(c.port)[-1]["name"] == "month_end"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "datetime64[ns]"

        for conv in [
            "month_start",
            "quarter_start",
            "quarter_end",
            "year_start",
            "year_end",
        ]:
            c.get(
                "/dtale/build-column/{}".format(c.port),
                query_string=dict(
                    type="datetime",
                    name=conv,
                    cfg=json.dumps(dict(col="d", conversion=conv)),
                ),
            )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = json.loads(response.data)
        assert response_data["success"]

        for dt in ["float", "int", "string", "date", "bool", "choice"]:
            c.get(
                "/dtale/build-column/{}".format(c.port),
                query_string=dict(
                    type="random",
                    name="random_{}".format(dt),
                    cfg=json.dumps(dict(type=dt)),
                ),
            )

        cfg = dict(type="string", chars="ABCD")
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(
                type="random", name="random_string2", cfg=json.dumps(cfg)
            ),
        )

        cfg = dict(type="date", timestamps=True, businessDay=True)
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="random", name="random_date2", cfg=json.dumps(cfg)),
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = json.loads(response.data)
        assert response_data["success"]


@pytest.mark.unit
def test_build_column_apply_all():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3, d=pd.Timestamp("20200101"))])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        cfg = {"col": "a", "to": "float", "from": "int64", "applyAllType": True}
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="type_conversion", name="test", cfg=json.dumps(cfg)),
        )
        assert all(
            data[c.port].dtypes[col].name == "float64" for col in ["a", "b", "c"]
        )


@pytest.mark.unit
def test_build_column_bins():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(np.random.randn(100, 3), columns=["a", "b", "c"])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        cfg = dict(col="a", operation="cut", bins=4)
        resp = c.get(
            "/dtale/bins-tester/{}".format(c.port),
            query_string=dict(type="bins", cfg=json.dumps(cfg)),
        )
        resp = resp.get_json()
        assert len(resp["data"]) == 4
        assert len(resp["labels"]) == 4
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="bins", name="cut", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["cut"].values[0] is not None
        assert global_state.get_dtypes(c.port)[-1]["name"] == "cut"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "string"

        cfg = dict(col="a", operation="cut", bins=4, labels="foo,bar,biz,baz")
        resp = c.get(
            "/dtale/bins-tester/{}".format(c.port),
            query_string=dict(type="bins", cfg=json.dumps(cfg)),
        )
        resp = resp.get_json()
        assert len(resp["data"]) == 4
        assert resp["labels"] == ["foo", "bar", "biz", "baz"]
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="bins", name="cut2", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["cut2"].values[0] in [
            "foo",
            "bar",
            "biz",
            "baz",
        ]
        assert global_state.get_dtypes(c.port)[-1]["name"] == "cut2"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "string"

        cfg = dict(col="a", operation="qcut", bins=4)
        resp = c.get(
            "/dtale/bins-tester/{}".format(c.port),
            query_string=dict(type="bins", cfg=json.dumps(cfg)),
        )
        resp = resp.get_json()
        assert len(resp["data"]) == 4
        assert len(resp["labels"]) == 4
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="bins", name="qcut", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["qcut"].values[0] is not None
        assert global_state.get_dtypes(c.port)[-1]["name"] == "qcut"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "string"

        cfg = dict(col="a", operation="qcut", bins=4, labels="foo,bar,biz,baz")
        resp = c.get(
            "/dtale/bins-tester/{}".format(c.port),
            query_string=dict(type="bins", cfg=json.dumps(cfg)),
        )
        resp = resp.get_json()
        assert len(resp["data"]) == 4
        assert resp["labels"] == ["foo", "bar", "biz", "baz"]
        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="bins", name="qcut2", cfg=json.dumps(cfg)),
        )
        assert global_state.get_data(c.port)["qcut2"].values[0] in [
            "foo",
            "bar",
            "biz",
            "baz",
        ]
        assert global_state.get_dtypes(c.port)[-1]["name"] == "qcut2"
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "string"


@pytest.mark.unit
def test_cleanup_error(unittest):
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.cleanup", mock.Mock(side_effect=Exception)
                )
            )
            resp = c.get("/dtale/cleanup-datasets", query_string=dict(dataIds="1"))
            assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_dtypes(test_data):
    from dtale.views import build_dtypes_state, format_data

    test_data = test_data.copy()
    test_data.loc[:, "mixed_col"] = 1
    test_data.loc[0, "mixed_col"] = "x"

    with app.test_client() as c:
        with ExitStack():
            build_data_inst({c.port: test_data})
            build_dtypes({c.port: build_dtypes_state(test_data)})
            response = c.get("/dtale/dtypes/{}".format(c.port))
            response_data = json.loads(response.data)
            assert response_data["success"]

            for col in test_data.columns:
                response = c.get(
                    "/dtale/describe/{}".format(c.port), query_string=dict(col=col)
                )
                response_data = json.loads(response.data)
                assert response_data["success"]

    lots_of_groups = pd.DataFrame([dict(a=i, b=1) for i in range(150)])
    with app.test_client() as c:
        with ExitStack():
            build_data_inst({c.port: lots_of_groups})
            build_dtypes({c.port: build_dtypes_state(lots_of_groups)})
            response = c.get("/dtale/dtypes/{}".format(c.port))
            response_data = json.loads(response.data)
            assert response_data["success"]

            response = c.get(
                "/dtale/describe/{}".format(c.port), query_string=dict(col="a")
            )
            response_data = json.loads(response.data)
            uniq_key = list(response_data["uniques"].keys())[0]
            assert response_data["uniques"][uniq_key]["top"]
            assert response_data["success"]

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.global_state.get_dtypes", side_effect=Exception)
            )
            response = c.get("/dtale/dtypes/{}".format(c.port))
            response_data = json.loads(response.data)
            assert "error" in response_data

            response = c.get(
                "/dtale/describe/{}".format(c.port), query_string=dict(col="foo")
            )
            response_data = json.loads(response.data)
            assert "error" in response_data

    df = pd.DataFrame(
        [
            dict(date=pd.Timestamp("now"), security_id=1, foo=1.0, bar=2.0),
            dict(date=pd.Timestamp("now"), security_id=1, foo=2.0, bar=np.inf),
        ],
        columns=["date", "security_id", "foo", "bar"],
    )
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: df})
            build_dtypes({c.port: build_dtypes_state(df)})
            response = c.get(
                "/dtale/describe/{}".format(c.port), query_string=dict(col="bar")
            )
            response_data = json.loads(response.data)
            assert response_data["describe"]["min"] == "2"
            assert response_data["describe"]["max"] == "inf"

            global_state.set_settings(c.port, dict(query="security_id == 1"))
            response = c.get(
                "/dtale/describe/{}".format(c.port),
                query_string=dict(col="foo", filtered="true"),
            )
            response_data = json.loads(response.data)
            assert response_data["describe"]["min"] == "1"
            assert response_data["describe"]["max"] == "2"


@pytest.mark.unit
def test_variance(unittest):
    from dtale.views import build_dtypes_state, format_data

    global_state.clear_store()
    with open(
        os.path.join(os.path.dirname(__file__), "..", "data/test_variance.json"), "r"
    ) as f:
        expected = f.read()
        expected = json.loads(expected)

    def _df():
        for i in range(2500):
            yield dict(i=i, x=i % 5)

    df = pd.DataFrame(list(_df()))
    df.loc[:, "low_var"] = 2500
    df.loc[0, "low_var"] = 1
    df, _ = format_data(df)

    with app.test_client() as c:
        build_data_inst({c.port: df})
        dtypes = build_dtypes_state(df)
        assert next((dt for dt in dtypes if dt["name"] == "low_var"), None)[
            "lowVariance"
        ]
        build_dtypes({c.port: dtypes})
        response = c.get(
            "/dtale/variance/{}".format(c.port), query_string=dict(col="x")
        )
        major, minor, revision = [int(i) for i in platform.python_version_tuple()]
        if major == 3 and minor > 6:
            expected["x"]["check2"]["val1"]["val"] = 0
            expected["x"]["check2"]["val2"]["val"] = 1
        response_data = json.loads(response.data)
        del response_data["code"]
        unittest.assertEqual(response_data, expected["x"])

        response = c.get(
            "/dtale/variance/{}".format(c.port), query_string=dict(col="low_var")
        )
        response_data = json.loads(response.data)
        del response_data["code"]
        unittest.assertEqual(response_data, expected["low_var"])


@pytest.mark.unit
def test_test_filter(test_data):
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="date == date"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="foo == 1"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="date == '20000101'"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="baz == 'baz'"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="bar > 1.5"),
        )
        response_data = json.loads(response.data)
        assert not response_data["success"]
        assert response_data["error"] == 'query "bar > 1.5" found no data, please alter'

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="foo2 == 1"),
        )
        response_data = json.loads(response.data)
        assert "error" in response_data

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query=None, save="true"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]
    if PY3:
        df = pd.DataFrame([dict(a=1)])
        df["a.b"] = 2
        with app.test_client() as c:
            build_data_inst({c.port: df})
            response = c.get(
                "/dtale/test-filter/{}".format(c.port),
                query_string=dict(query="a.b == 2"),
            )
            response_data = json.loads(response.data)
            assert not response_data["success"]


@pytest.mark.unit
def test_get_data(unittest, test_data):
    import dtale.views as views
    import dtale.global_state as global_state

    with app.test_client() as c:
        test_data, _ = views.format_data(test_data)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get("/dtale/data/{}".format(c.port))
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data,
            {},
            'if no "ids" parameter an empty dict should be returned',
        )

        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(ids=json.dumps(["1"])),
        )
        response_data = json.loads(response.data)
        expected = dict(
            total=50,
            final_query="",
            results={
                "1": dict(
                    date="2000-01-01",
                    security_id=1,
                    dtale_index=1,
                    foo=1,
                    bar=1.5,
                    baz="baz",
                )
            },
            columns=[
                dict(dtype="int64", name="dtale_index", visible=True),
                dict(
                    dtype="datetime64[ns]",
                    name="date",
                    index=0,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    unique_ct=1,
                    kurt=0,
                    skew=0,
                ),
                dict(
                    dtype="int64",
                    name="security_id",
                    max=49,
                    min=0,
                    index=1,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    lowVariance=False,
                    outlierRange={"lower": -24.5, "upper": 73.5},
                    unique_ct=50,
                    kurt=-1.2,
                    skew=0,
                    coord=None,
                ),
                dict(
                    dtype="int64",
                    name="foo",
                    min=1,
                    max=1,
                    index=2,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    lowVariance=False,
                    outlierRange={"lower": 1.0, "upper": 1.0},
                    unique_ct=1,
                    kurt=0,
                    skew=0,
                    coord=None,
                ),
                dict(
                    dtype="float64",
                    name="bar",
                    min=1.5,
                    max=1.5,
                    index=3,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    lowVariance=False,
                    outlierRange={"lower": 1.5, "upper": 1.5},
                    unique_ct=1,
                    kurt=0,
                    skew=0,
                    coord=None,
                ),
                dict(
                    dtype="string",
                    name="baz",
                    index=4,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    unique_ct=1,
                ),
            ],
        )
        unittest.assertEqual(response_data, expected, "should return data at index 1")

        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(ids=json.dumps(["1-2"])),
        )
        response_data = json.loads(response.data)
        expected = {
            "1": dict(
                date="2000-01-01",
                security_id=1,
                dtale_index=1,
                foo=1,
                bar=1.5,
                baz="baz",
            ),
            "2": dict(
                date="2000-01-01",
                security_id=2,
                dtale_index=2,
                foo=1,
                bar=1.5,
                baz="baz",
            ),
        }
        unittest.assertEqual(
            response_data["results"], expected, "should return data at indexes 1-2"
        )

        params = dict(ids=json.dumps(["1"]), sort=json.dumps([["security_id", "DESC"]]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = {
            "1": dict(
                date="2000-01-01",
                security_id=48,
                dtale_index=1,
                foo=1,
                bar=1.5,
                baz="baz",
            )
        }
        unittest.assertEqual(
            response_data["results"],
            expected,
            "should return data at index 1 w/ sort",
        )
        unittest.assertEqual(
            global_state.get_settings(c.port),
            {"sortInfo": [["security_id", "DESC"]]},
            "should update settings",
        )

        params = dict(ids=json.dumps(["1"]), sort=json.dumps([["security_id", "ASC"]]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = {
            "1": dict(
                date="2000-01-01",
                security_id=1,
                dtale_index=1,
                foo=1,
                bar=1.5,
                baz="baz",
            )
        }
        unittest.assertEqual(
            response_data["results"],
            expected,
            "should return data at index 1 w/ sort",
        )
        unittest.assertEqual(
            global_state.get_settings(c.port),
            {"sortInfo": [["security_id", "ASC"]]},
            "should update settings",
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = json.loads(response.data)
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="security_id == 1", save="true"),
        )
        response_data = json.loads(response.data)
        assert response_data["success"]
        unittest.assertEqual(
            global_state.get_settings(c.port)["query"],
            "security_id == 1",
            "should update settings",
        )

        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = {
            "0": dict(
                date="2000-01-01",
                security_id=1,
                dtale_index=0,
                foo=1,
                bar=1.5,
                baz="baz",
            )
        }
        unittest.assertEqual(
            response_data["results"],
            expected,
            "should return data at index 1 w/ sort",
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = json.loads(response.data)
        assert response_data["success"]

        global_state.get_settings(c.port)["query"] = "security_id == 50"
        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert len(response_data["results"]) == 0

        global_state.get_settings(c.port)["invertFilter"] = True
        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert len(response_data["results"]) == 1

        global_state.get_settings(c.port)["invertFilter"] = False

        response = c.get("/dtale/data-export/{}".format(c.port))
        assert response.content_type == "text/csv"

        response = c.get(
            "/dtale/data-export/{}".format(c.port), query_string=dict(tsv="true")
        )
        assert response.content_type == "text/tsv"

        response = c.get("/dtale/data-export/a", query_string=dict(tsv="true"))
        response_data = json.loads(response.data)
        assert "error" in response_data

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        build_settings({c.port: dict(query="missing_col == 'blah'")})
        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(ids=json.dumps(["0"])),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle data exception",
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(ids=json.dumps(["1"])),
        )
        assert response.status_code == 200

        tmp = global_state.get_data(c.port).copy()
        tmp["biz"] = 2.5
        global_state.set_data(c.port, tmp)
        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(ids=json.dumps(["1"])),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["results"],
            {
                "1": dict(
                    date="2000-01-01",
                    security_id=1,
                    dtale_index=1,
                    foo=1,
                    bar=1.5,
                    baz="baz",
                    biz=2.5,
                )
            },
            "should handle data updates",
        )
        unittest.assertEqual(
            global_state.get_dtypes(c.port)[-1],
            dict(
                index=5,
                name="biz",
                dtype="float64",
                min=2.5,
                max=2.5,
                visible=True,
                hasMissing=0,
                hasOutliers=0,
                lowVariance=False,
                outlierRange={"lower": 2.5, "upper": 2.5},
                unique_ct=1,
                kurt=0,
                skew=0,
                coord=None,
            ),
            "should update dtypes on data structure change",
        )


def build_ts_data(size=5, days=5):
    start = pd.Timestamp("20000101")
    for d in pd.date_range(start, start + Day(days - 1)):
        for i in range(size):
            yield dict(date=d, security_id=i, foo=i, bar=i)


@pytest.mark.unit
def test_get_chart_data(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(
        build_ts_data(size=50), columns=["date", "security_id", "foo", "bar"]
    )
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(x="date", y=json.dumps(["security_id"]), agg="count")
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        expected = {
            u"data": {
                u"all": {
                    u"x": [
                        "2000-01-01",
                        "2000-01-02",
                        "2000-01-03",
                        "2000-01-04",
                        "2000-01-05",
                    ],
                    u"security_id|count": [50, 50, 50, 50, 50],
                }
            },
            u"max": {"security_id|count": 50, "x": "2000-01-05"},
            u"min": {"security_id|count": 50, "x": "2000-01-01"},
            u"success": True,
        }
        unittest.assertEqual(
            {k: v for k, v in response_data.items() if k != "code"},
            expected,
            "should return chart data",
        )

    test_data.loc[:, "baz"] = "baz"

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(
            x="date",
            y=json.dumps(["security_id"]),
            group=json.dumps(["baz"]),
            agg="mean",
        )
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert response_data["min"]["security_id|mean"] == 24.5
        assert response_data["max"]["security_id|mean"] == 24.5
        series_key = "(baz: baz)"
        assert response_data["data"][series_key]["x"][-1] == "2000-01-05"
        assert len(response_data["data"][series_key]["security_id|mean"]) == 5
        assert sum(response_data["data"][series_key]["security_id|mean"]) == 122.5

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(
            x="date",
            y=json.dumps(["0"]),
            agg="rolling",
            rollingWin=10,
            rollingComp="count",
        )
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert response_data["success"]

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(x="baz", y=json.dumps(["foo"]))
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert response_data["error"] == (
            "The grouping [baz] contains duplicates, please specify group or additional filtering or select "
            "'No Aggregation' from Aggregation drop-down."
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(
            x="date", y=json.dumps(["foo"]), group=json.dumps(["security_id"])
        )
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        assert "Group (security_id) contains more than 30 unique values" in str(
            response_data["error"]
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        response = c.get(
            "/dtale/chart-data/{}".format(c.port),
            query_string=dict(query="missing_col == 'blah'"),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle data exception",
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        response = c.get(
            "/dtale/chart-data/{}".format(c.port),
            query_string=dict(query="security_id == 51"),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            'query "security_id == 51" found no data, please alter',
        )

    df = pd.DataFrame([dict(a=i, b=np.nan) for i in range(100)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(x="a", y=json.dumps(["b"]), allowDupes=True)
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data["error"], 'All data for column "b" is NaN!')

    df = pd.DataFrame([dict(a=i, b=i) for i in range(15500)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(x="a", y=json.dumps(["b"]), allowDupes=True)
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data["error"],
            "Dataset exceeds 15000 records, cannot render. Please apply filter...",
        )


@pytest.mark.unit
def test_code_export():
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch(
                    "dtale.views.build_code_export", mock.Mock(side_effect=Exception())
                )
            )
            response = c.get("/dtale/code-export/{}".format(c.port))
            assert "error" in json.loads(response.data)

        with ExitStack() as stack:
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.get_data",
                    mock.Mock(
                        return_value={c.port: pd.DataFrame([dict(a=1), dict(a=2)])}
                    ),
                )
            )
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.get_settings",
                    mock.Mock(return_value={c.port: {"query": "a in @a"}}),
                )
            )
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.get_context_variables",
                    mock.Mock(return_value={c.port: {"a": [1, 2]}}),
                )
            )
            stack.enter_context(
                mock.patch(
                    "dtale.views.build_code_export", mock.Mock(side_effect=Exception())
                )
            )
            response = c.get("/dtale/code-export/{}".format(c.port))
            assert "error" in json.loads(response.data)

        with ExitStack() as stack:
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.get_data",
                    mock.Mock(
                        return_value={c.port: pd.DataFrame([dict(a=1), dict(a=2)])}
                    ),
                )
            )
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.get_settings",
                    mock.Mock(return_value={c.port: {"query": "a == 1"}}),
                )
            )
            response = c.get("/dtale/code-export/{}".format(c.port))
            assert json.loads(response.data)["success"]


@pytest.mark.unit
def test_version_info():
    with app.test_client() as c:
        with mock.patch(
            "dtale.cli.clickutils.pkg_resources.get_distribution",
            mock.Mock(side_effect=Exception("blah")),
        ):
            response = c.get("version-info")
            assert "unknown" in str(response.data)


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_chart_exports(custom_data, state_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        build_data_inst({c.port: custom_data})
        build_dtypes({c.port: views.build_dtypes_state(custom_data)})
        params = dict(chart_type="invalid")
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "application/json"

        params = dict(
            chart_type="line",
            x="date",
            y=json.dumps(["Col0"]),
            agg="sum",
            query="Col5 == 50",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "application/json"

        params = dict(chart_type="bar", x="date", y=json.dumps(["Col0"]), agg="sum")
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(chart_type="line", x="date", y=json.dumps(["Col0"]), agg="sum")
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(chart_type="scatter", x="Col0", y=json.dumps(["Col1"]))
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        params["trendline"] = "ols"
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(
            chart_type="3d_scatter",
            x="date",
            y=json.dumps(["security_id"]),
            z="Col0",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(
            chart_type="surface", x="date", y=json.dumps(["security_id"]), z="Col0"
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(
            chart_type="pie",
            x="security_id",
            y=json.dumps(["Col0"]),
            agg="sum",
            query="security_id >= 100000 and security_id <= 100010",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        params = dict(
            chart_type="heatmap", x="date", y=json.dumps(["security_id"]), z="Col0"
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

        del params["x"]
        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "application/json"

    with app.test_client() as c:
        build_data_inst({c.port: state_data})
        build_dtypes({c.port: views.build_dtypes_state(state_data)})
        params = dict(
            chart_type="maps",
            map_type="choropleth",
            loc_mode="USA-states",
            loc="Code",
            map_val="val",
            agg="raw",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"

    df = pd.DataFrame(
        {
            "lat": np.random.uniform(-40, 40, 50),
            "lon": np.random.uniform(-40, 40, 50),
            "val": np.random.randint(0, high=100, size=50),
        }
    )
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(
            chart_type="maps",
            map_type="scattergeo",
            lat="lat",
            lon="lon",
            map_val="val",
            scope="world",
            agg="raw",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/chart-csv-export/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/csv"


@pytest.mark.skipif(not PY3, reason="requires python 3 or higher")
def test_chart_exports_funnel(treemap_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        build_data_inst({c.port: treemap_data})
        build_dtypes({c.port: views.build_dtypes_state(treemap_data)})

        params = dict(
            chart_type="funnel",
            agg="mean",
            funnel_value="volume",
            funnel_label="label",
            funnel_group=json.dumps(["group"]),
            funnel_stacked=False,
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"


@pytest.mark.skipif(not PY3, reason="requires python 3 or higher")
def test_chart_exports_clustergram(clustergram_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        df, _ = views.format_data(clustergram_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))

        params = dict(
            chart_type="clustergram",
            clustergram_value=json.dumps(["_all_columns_"]),
            clustergram_label="model",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_chart_png_export(custom_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: custom_data})
            build_dtypes({c.port: views.build_dtypes_state(custom_data)})
            write_image_mock = stack.enter_context(
                mock.patch(
                    "dtale.dash_application.charts.write_image", mock.MagicMock()
                )
            )

            params = dict(
                chart_type="heatmap",
                x="date",
                y=json.dumps(["security_id"]),
                z="Col0",
                export_type="png",
            )
            c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
            assert write_image_mock.called


@pytest.mark.unit
def test_main():
    import dtale.views as views

    global_state.clear_store()
    test_data = pd.DataFrame(
        build_ts_data(), columns=["date", "security_id", "foo", "bar"]
    )
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        global_state.set_name(c.port, "test_name")
        build_settings({c.port: dict(locked=[])})
        response = c.get("/dtale/main/{}".format(c.port))
        assert "<title>D-Tale (test_name)</title>" in str(response.data)
        response = c.get("/dtale/iframe/{}".format(c.port))
        assert "<title>D-Tale (test_name)</title>" in str(response.data)
        response = c.get(
            "/dtale/popup/test/{}".format(c.port), query_string=dict(col="foo")
        )
        assert "<title>D-Tale (test_name) - Test (col: foo)</title>" in str(
            response.data
        )
        response = c.get(
            "/dtale/popup/reshape/{}".format(c.port), query_string=dict(col="foo")
        )
        assert "<title>D-Tale (test_name) - Summarize Data (col: foo)</title>" in str(
            response.data
        )
        response = c.get(
            "/dtale/popup/filter/{}".format(c.port), query_string=dict(col="foo")
        )
        assert "<title>D-Tale (test_name) - Custom Filter (col: foo)</title>" in str(
            response.data
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        build_settings({c.port: dict(locked=[])})
        response = c.get("/dtale/main/{}".format(c.port))
        assert "<title>D-Tale</title>" in str(response.data)


@pytest.mark.unit
def test_view_by_name():
    import dtale.views as views

    global_state.clear_store()
    test_data = pd.DataFrame(
        build_ts_data(), columns=["date", "security_id", "foo", "bar"]
    )
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        global_state.set_name(c.port, "test_name")
        build_settings({c.port: dict(locked=[])})
        response = c.get("/dtale/main/name/{}".format("test_name"))
        assert "<title>D-Tale (test_name)</title>" in str(response.data)

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        global_state.set_name(c.port, "test_name2")
        build_settings({c.port: dict(locked=[])})
        response = c.get("/dtale/main/name/{}".format("test_name2"))
        assert "<title>D-Tale (test_name2)</title>" in str(response.data)


@pytest.mark.unit
def test_200():
    paths = [
        "/dtale/main/{port}",
        "/dtale/iframe/{port}",
        "/dtale/popup/test/{port}",
        "site-map",
        "version-info",
        "health",
        "/dtale/charts/{port}",
        "/dtale/charts/popup/{port}",
        "/dtale/code-popup",
        "/dtale/popup/upload",
        "/missing-js",
        "/dtale/static/images/fire.jpg",
        "/dtale/static/images/projections/miller.png",
        "/dtale/static/images/map_type/choropleth.png",
        "/dtale/static/maps/usa_110m.json",
        "/dtale/network/{port}",
        "/dtale/calculation/skew",
        "/dtale/calculation/kurtosis",
    ]
    with app.test_client() as c:
        build_data_inst({c.port: None})
        for path in paths:
            final_path = path.format(port=c.port)
            response = c.get(final_path)
            assert response.status_code == 200, "{} should return 200 response".format(
                final_path
            )
    with app.test_client(app_root="/test_route") as c:
        build_data_inst({c.port: None})
        for path in paths:
            final_path = path.format(port=c.port)
            response = c.get(final_path)
            assert response.status_code == 200, "{} should return 200 response".format(
                final_path
            )


@pytest.mark.unit
def test_302():
    import dtale.views as views

    df = pd.DataFrame([1, 2, 3])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        for path in [
            "/",
            "/dtale",
            "/dtale/main",
            "/dtale/iframe",
            "/dtale/popup/test",
            "/favicon.ico",
            "/dtale/iframe/popup/upload",
            "/dtale/iframe/popup/describe/{}".format(c.port),
        ]:
            response = c.get(path)
            assert response.status_code == 302, "{} should return 302 response".format(
                path
            )
    with app.test_client() as c:
        build_data_inst({c.port: df})
        for path in ["/"]:
            response = c.get(path)
            assert response.status_code == 302, "{} should return 302 response".format(
                path
            )


@pytest.mark.unit
def test_missing_js():
    with app.test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: pd.DataFrame([1, 2, 3])})
            stack.enter_context(mock.patch("os.listdir", mock.Mock(return_value=[])))
            response = c.get("/")
            assert response.status_code == 302


@pytest.mark.unit
def test_404():
    response = app.test_client().get("/dtale/blah")
    assert response.status_code == 404
    # make sure custom 404 page is returned
    assert (
        "The page you were looking for <code>/dtale/blah</code> does not exist."
        in str(response.data)
    )


@pytest.mark.unit
def test_500():
    with app.test_client() as c:
        with ExitStack() as stack:
            build_data_inst({1: pd.DataFrame([1, 2, 3, 4, 5])})
            stack.enter_context(
                mock.patch(
                    "dtale.views.render_template",
                    mock.Mock(side_effect=Exception("Test")),
                )
            )
            for path in [
                "/dtale/main/1",
            ]:
                response = c.get(path)
                assert response.status_code == 500
                assert "<h1>Internal Server Error</h1>" in str(response.data)


@pytest.mark.unit
def test_jinja_output():
    import dtale.views as views

    df = pd.DataFrame([1, 2, 3])
    df, _ = views.format_data(df)
    url = "http://localhost.localdomain:40000"
    with build_app(url=url).test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})
            response = c.get("/dtale/main/{}".format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)
            response = c.get("/dtale/charts/{}".format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)

    with build_app(url=url).test_client() as c:
        with ExitStack() as stack:
            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})
            build_settings({c.port: {}})
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.APP_SETTINGS",
                    {"github_fork": True},
                )
            )
            response = c.get("/dtale/main/{}".format(c.port))
            assert 'span id="forkongithub"' in str(response.data)


@pytest.mark.unit
def test_build_context_variables():
    import dtale.views as views
    import dtale.global_state as global_state

    data_id = "1"
    global_state.new_data_inst(data_id)
    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {1: "foo"})
    assert "context variables must be a valid string" in str(error.value)

    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {"#!f_o#o": "bar"})
    assert "context variables can only contain letters, digits, or underscores" in str(
        error.value
    )

    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {"_foo": "bar"})
    assert "context variables can not start with an underscore" in str(error.value)

    # verify that pre-existing variables are not dropped when new ones are added
    global_state.set_context_variables(
        data_id, views.build_context_variables(data_id, {"1": "cat"})
    )
    global_state.set_context_variables(
        data_id, views.build_context_variables(data_id, {"2": "dog"})
    )
    assert (global_state.get_context_variables(data_id)["1"] == "cat") & (
        global_state.get_context_variables(data_id)["2"] == "dog"
    )
    # verify that new values will replace old ones if they share the same name
    global_state.set_context_variables(
        data_id, views.build_context_variables(data_id, {"1": "cat"})
    )
    global_state.set_context_variables(
        data_id, views.build_context_variables(data_id, {"1": "dog"})
    )
    assert global_state.get_context_variables(data_id)["1"] == "dog"


@pytest.mark.unit
def test_get_filter_info(unittest):
    with app.test_client() as c:
        data_id = 1
        context_vars = {
            "1": ["cat", "dog"],
            "2": 420346,
            "3": pd.Series(range(1000)),
            "4": "A" * 2000,
        }
        expected_return_value = [
            dict(name=k, value=str(v)[:1000]) for k, v in context_vars.items()
        ]
        build_data_inst({data_id: None})
        global_state.set_context_variables(data_id, context_vars)
        response = c.get("/dtale/filter-info/{}".format(data_id))
        response_data = json.loads(response.data)
        assert response_data["success"]
        unittest.assertEqual(
            response_data["contextVars"],
            expected_return_value,
            "should match expected",
        )

    with app.test_client() as c:
        global_state.set_context_variables(data_id, None)
        response = c.get("/dtale/filter-info/{}".format(data_id))
        response_data = json.loads(response.data)
        unittest.assertEqual(len(response_data["contextVars"]), 0)


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_get_column_filter_data(unittest, custom_data):
    import dtale.views as views

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})

        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="bool_val"),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(
            response_data,
            {
                u"hasMissing": False,
                u"uniques": [u"False", u"True"],
                u"success": True,
            },
        )
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="str_val"),
        )
        response_data = json.loads(response.data)
        assert response_data["hasMissing"]
        assert all(k in response_data for k in [u"hasMissing", u"uniques", u"success"])
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="int_val"),
        )
        response_data = json.loads(response.data)
        assert not response_data["hasMissing"]
        assert all(
            k in response_data
            for k in [u"max", u"hasMissing", u"uniques", u"success", u"min"]
        )
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port), query_string=dict(col="Col0")
        )
        response_data = json.loads(response.data)
        assert not response_data["hasMissing"]
        assert all(k in response_data for k in ["max", "hasMissing", "success", u"min"])
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port), query_string=dict(col="date")
        )
        response_data = json.loads(response.data)
        assert not response_data["hasMissing"]
        assert all(k in response_data for k in ["max", "hasMissing", "success", u"min"])

        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="missing_col"),
        )
        response_data = json.loads(response.data)
        assert not response_data["success"]

    # mixed data test
    df = pd.DataFrame.from_dict(
        {
            "a": ["a", "UNknown", "b"],
            "b": ["", " ", " - "],
            "c": [1, "", 3],
            "d": [1.1, np.nan, 3],
            "e": ["a", np.nan, "b"],
        }
    )
    df, _ = views.format_data(df)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port), query_string=dict(col="c")
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(sorted(response_data["uniques"]), ["", "1", "3"])


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_get_async_column_filter_data(unittest, custom_data):
    import dtale.views as views

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        str_val = df.str_val.values[0]
        response = c.get(
            "/dtale/async-column-filter-data/{}".format(c.port),
            query_string=dict(col="str_val", input=df.str_val.values[0]),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data, [dict(value=str_val)])

        int_val = df.int_val.values[0]
        response = c.get(
            "/dtale/async-column-filter-data/{}".format(c.port),
            query_string=dict(col="int_val", input=str(df.int_val.values[0])),
        )
        response_data = json.loads(response.data)
        unittest.assertEqual(response_data, [dict(value=int_val)])


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_save_column_filter(unittest, custom_data):
    import dtale.views as views

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        settings = {c.port: {}}
        build_settings(settings)
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="bool_val", cfg=json.dumps({"type": "string", "value": ["False"]})
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["bool_val"],
            {
                "query": "`bool_val` == False",
                "value": ["False"],
                "action": "equals",
                "caseSensitive": False,
                "operand": "=",
                "raw": None,
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="str_val", cfg=json.dumps({"type": "string", "value": ["a", "b"]})
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["str_val"],
            {
                "query": "`str_val` in ('a', 'b')",
                "value": ["a", "b"],
                "action": "equals",
                "caseSensitive": False,
                "operand": "=",
                "raw": None,
            },
        )
        for col, f_type in [
            ("bool_val", "string"),
            ("int_val", "int"),
            ("date", "date"),
        ]:
            response = c.get(
                "/dtale/save-column-filter/{}".format(c.port),
                query_string=dict(
                    col=col, cfg=json.dumps({"type": f_type, "missing": True})
                ),
            )
            col_cfg = json.loads(response.data)["currFilters"][col]
            assert col_cfg["query"] == u"`{col}`.isnull()".format(col=col)
            assert col_cfg["missing"]

        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(col="bool_val", cfg=None),
        )
        response_data = json.loads(response.data)
        assert "error" in response_data

        for operand in ["=", "<", ">", "<=", ">="]:
            response = c.get(
                "/dtale/save-column-filter/{}".format(c.port),
                query_string=dict(
                    col="int_val",
                    cfg=json.dumps({"type": "int", "operand": operand, "value": "5"}),
                ),
            )
            query = "`int_val` {} 5".format("==" if operand == "=" else operand)
            unittest.assertEqual(
                json.loads(response.data)["currFilters"]["int_val"],
                {u"query": query, u"value": "5", "operand": operand},
            )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps({"type": "int", "operand": "=", "value": ["5", "4"]}),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {u"query": "`int_val` in (5, 4)", u"value": ["5", "4"], "operand": "="},
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps(
                    {"type": "int", "operand": "[]", "min": "4", "max": "5"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {
                u"query": "`int_val` >= 4 and `int_val` <= 5",
                "min": "4",
                "max": "5",
                "operand": "[]",
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps(
                    {"type": "int", "operand": "()", "min": "4", "max": "5"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {
                u"query": "`int_val` > 4 and `int_val` < 5",
                "min": "4",
                "max": "5",
                "operand": "()",
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps(
                    {"type": "int", "operand": "()", "min": "4", "max": None}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {u"query": "`int_val` > 4", "min": "4", "operand": "()"},
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps(
                    {"type": "int", "operand": "()", "min": None, "max": "5"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {u"query": "`int_val` < 5", "max": "5", "operand": "()"},
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps(
                    {"type": "int", "operand": "()", "min": "4", "max": "4"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["int_val"],
            {u"query": "`int_val` == 4", "min": "4", "max": "4", "operand": "()"},
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="date",
                cfg=json.dumps(
                    {"type": "date", "start": "20000101", "end": "20000101"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["date"],
            {
                u"query": "`date` == '20000101'",
                "start": "20000101",
                "end": "20000101",
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="date",
                cfg=json.dumps(
                    {"type": "date", "start": "20000101", "end": "20000102"}
                ),
            ),
        )
        unittest.assertEqual(
            json.loads(response.data)["currFilters"]["date"],
            {
                u"query": "`date` >= '20000101' and `date` <= '20000102'",
                "start": "20000101",
                "end": "20000102",
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="date", cfg=json.dumps({"type": "date", "missing": False})
            ),
        )
        assert "date" not in json.loads(response.data)["currFilters"]

        assert settings[c.port].get("query") is None

        response = c.get("/dtale/move-filters-to-custom/{}".format(c.port))
        assert response.json["success"]
        assert response.json["settings"].get("query") is not None


@pytest.mark.unit
def test_build_dtypes_state(test_data):
    import dtale.views as views

    state = views.build_dtypes_state(test_data.set_index("security_id").T)
    assert all("min" not in r and "max" not in r for r in state)


@pytest.mark.unit
def test_update_theme():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {"theme": "light"}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-theme", query_string={"theme": "dark"})
            assert app_settings["theme"] == "dark"
            response = c.get("/dtale/main/{}".format(c.port))
            assert '<body class="dark-mode"' in str(response.data)


@pytest.mark.unit
def test_update_query_engine():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {"query_engine": "python"}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-query-engine", query_string={"engine": "numexpr"})
            assert app_settings["query_engine"] == "numexpr"


@pytest.mark.unit
def test_update_pin_menu():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {"pin_menu": False}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-pin-menu", query_string={"pinned": True})
            assert app_settings["pin_menu"]


@pytest.mark.unit
def test_update_language():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {"language": "en"}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-language", query_string={"language": "cn"})
            assert app_settings["language"] == "cn"


@pytest.mark.unit
def test_update_max_column_width():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-maximum-column-width", query_string={"width": 100})
            assert app_settings["max_column_width"] == 100


@pytest.mark.unit
def test_update_max_row_height():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3, 4, 5]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            app_settings = {}
            stack.enter_context(
                mock.patch("dtale.global_state.APP_SETTINGS", app_settings)
            )

            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})

            c.get("/dtale/update-maximum-row-height", query_string={"height": 100})
            assert app_settings["max_row_height"] == 100


@pytest.mark.unit
def test_load_filtered_ranges(unittest):
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        settings = {c.port: dict(query="a > 1")}
        build_settings(settings)
        response = c.get("/dtale/load-filtered-ranges/{}".format(c.port))
        ranges = response.json
        assert ranges["ranges"]["a"]["max"] == 3 and ranges["overall"]["min"] == 2
        assert ranges["query"] == settings[c.port]["filteredRanges"]["query"]
        assert ranges["dtypes"]["a"]["max"] == 3 and ranges["dtypes"]["a"]["min"] == 2

        response = c.get("/dtale/load-filtered-ranges/{}".format(c.port))
        unittest.assertEqual(ranges, response.json)

        del settings[c.port]["query"]
        response = c.get("/dtale/load-filtered-ranges/{}".format(c.port))
        assert not len(response.json)


@pytest.mark.unit
def test_build_column_text():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.post(
            "/dtale/build-column-copy/{}".format(c.port),
            data={"columns": json.dumps(["a"])},
        )
        assert resp.data == b"1\n2\n3\n"


@pytest.mark.unit
def test_build_row_text():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.post(
            "/dtale/build-row-copy/{}".format(c.port),
            data={"start": 1, "end": 2, "columns": json.dumps(["a"])},
        )
        assert resp.data == b"1\n2\n"
        resp = c.post(
            "/dtale/build-row-copy/{}".format(c.port),
            data={"rows": json.dumps([1]), "columns": json.dumps(["a"])},
        )
        assert resp.data == b"2\n"


@pytest.mark.unit
def test_sorted_sequential_diffs():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/sorted-sequential-diffs/{}".format(c.port),
            query_string=dict(col="a", sort="ASC"),
        )
        data = resp.json
        assert data["min"] == "1"
        assert data["max"] == "1"

        resp = c.get(
            "/dtale/sorted-sequential-diffs/{}".format(c.port),
            query_string=dict(col="a", sort="DESC"),
        )
        data = resp.json
        assert data["min"] == "-1"
        assert data["max"] == "-1"


@pytest.mark.unit
def test_drop_filtered_rows():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        settings = {c.port: {"query": "a == 1"}}
        build_settings(settings)
        c.get("/dtale/drop-filtered-rows/{}".format(c.port))
        assert len(global_state.get_data(c.port)) == 1
        assert global_state.get_settings(c.port)["query"] == ""


@pytest.mark.unit
def test_save_range_highlights():
    with build_app(url=URL).test_client() as c:
        settings = {c.port: {}}
        build_settings(settings)
        range_highlights = {
            "foo": {
                "active": True,
                "equals": {
                    "active": True,
                    "value": 3,
                    "color": {"r": 255, "g": 245, "b": 157, "a": 1},
                },  # light yellow
                "greaterThan": {
                    "active": True,
                    "value": 3,
                    "color": {"r": 80, "g": 227, "b": 194, "a": 1},
                },
                # mint green
                "lessThan": {
                    "active": True,
                    "value": 3,
                    "color": {"r": 245, "g": 166, "b": 35, "a": 1},
                },  # orange
            }
        }
        c.post(
            "/dtale/save-range-highlights/{}".format(c.port),
            data=dict(ranges=json.dumps(range_highlights)),
        )
        assert global_state.get_settings(c.port)["rangeHighlight"] is not None
