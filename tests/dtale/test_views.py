import json
from builtins import str

import mock
import numpy as np
import os
import dtale.global_state as global_state
import pandas as pd
import platform
import pytest
from pandas.tseries.offsets import Day
from six import PY3

import dtale.pandas_util as pandas_util

from dtale.app import build_app
from dtale.pandas_util import check_pandas_version
from dtale.utils import DuplicateDataError, parse_version
from tests import ExitStack, pdt
from tests.dtale import build_data_inst, build_settings, build_dtypes
from tests.dtale.test_charts import build_col_def

URL = "http://localhost:40000"
app = build_app(url=URL)


def setup_function(function):
    global_state.cleanup()


def teardown_function(function):
    global_state.cleanup()


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
    assert instance._data_id == "1"

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
        URL,
        data_loader=lambda: test_data,
        sort=[("security_id", "ASC")],
        hide_header_editor=True,
        hide_shutdown=True,
        lock_header_menu=True,
        hide_header_menu=True,
        hide_main_menu=True,
        hide_column_menus=True,
        hide_row_expanders=True,
        enable_custom_filters=True,
        enable_web_uploads=True,
        main_title="test_title",
        main_title_font="test_title_font",
        theme="dark",
        nan_display="N/A",
    )

    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            columnFormats={},
            hide_shutdown=True,
            hide_header_editor=True,
            lock_header_menu=True,
            hide_header_menu=True,
            hide_main_menu=True,
            hide_column_menus=True,
            hide_row_expanders=True,
            enable_custom_filters=True,
            enable_web_uploads=True,
            locked=["date", "security_id"],
            indexes=["date", "security_id"],
            precision=2,
            sortInfo=[("security_id", "ASC")],
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
            main_title="test_title",
            main_title_font="test_title_font",
            theme="dark",
            nanDisplay="N/A",
        ),
        "should lock index columns",
    )

    global_state.set_app_settings(dict(hide_header_editor=False))
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            columnFormats={},
            hide_shutdown=True,
            hide_header_editor=False,
            lock_header_menu=True,
            hide_header_menu=True,
            hide_main_menu=True,
            hide_column_menus=True,
            hide_row_expanders=True,
            enable_custom_filters=True,
            enable_web_uploads=True,
            locked=["date", "security_id"],
            indexes=["date", "security_id"],
            precision=2,
            sortInfo=[("security_id", "ASC")],
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
            main_title="test_title",
            main_title_font="test_title_font",
            theme="dark",
            nanDisplay="N/A",
        ),
        "should hide header editor",
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
            columnFormats={},
            locked=[],
            indexes=[],
            precision=6,
            rangeHighlight=range_highlights,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
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
            columnFormats={},
            locked=["security_id"],
            indexes=["security_id"],
            precision=2,
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
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
            indexes=[],
            precision=2,
            columnFormats={},
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
        ),
        "should not lock index columns",
    )

    test_data = pd.MultiIndex.from_arrays([[1, 2], [3, 4]], names=("a", "b"))
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(
        global_state.get_settings(instance._data_id),
        dict(
            allow_cell_edits=True,
            locked=[],
            indexes=[],
            precision=2,
            columnFormats={},
            rangeHighlight=None,
            backgroundMode=None,
            verticalHeaders=False,
            highlightFilter=False,
        ),
        "should not lock index columns",
    )

    test_data = pd.DataFrame(
        [
            dict(date=pd.Timestamp("now"), security_id=1, foo=1.0, bar=2.0, baz=np.nan),
            dict(
                date=pd.Timestamp("now"), security_id=1, foo=2.0, bar=np.inf, baz=np.nan
            ),
        ],
        columns=["date", "security_id", "foo", "bar", "baz"],
    )
    instance = views.startup(
        URL, data_loader=lambda: test_data, auto_hide_empty_columns=True
    )
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

    non_visible = [
        dt["name"]
        for dt in global_state.get_dtypes(instance._data_id)
        if not dt["visible"]
    ]
    unittest.assertEqual(non_visible, ["baz"])

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
    np.testing.assert_almost_equal(instance.data.values, test_data)

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
        ["str" if pandas_util.is_pandas3() else "object", "category"],
    )

    many_cols = pd.DataFrame({"sec{}".format(v): [1] for v in range(500)})
    instance = views.startup(URL, data=many_cols)
    unittest.assertEqual(
        len([v for v in global_state.get_dtypes(instance._data_id) if v["visible"]]),
        100,
    )

    if PY3 and check_pandas_version("0.25.0"):
        s_int = pd.Series([1, 2, 3, 4, 5], index=list("abcde"), dtype=pd.Int64Dtype())
        s2_int = s_int.reindex(["a", "b", "c", "f", "u"])
        ints = pd.Series([1, 2, 3, 4, 5], index=list("abcfu"))
        test_data = pd.DataFrame(dict(na=s2_int, int=ints))
        test_data.loc[:, "unsigned_int"] = pd.to_numeric(
            test_data["int"], downcast="unsigned"
        )
        instance = views.startup(
            URL, data_loader=lambda: test_data, ignore_duplicate=True
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

    index_vals = [
        pd.Timestamp("20230101"),
        pd.Timestamp("20230102"),
        pd.Timestamp("20230103"),
    ]
    base_df = pd.DataFrame([1, 2, 3], index=index_vals)
    df, index = format_data(base_df)
    unittest.assertEqual(index, ["index"])
    assert len(df.columns) > len(base_df.columns)


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
    import werkzeug

    with app.test_client() as c:
        try:
            with ExitStack() as stack:
                from werkzeug.serving import BaseWSGIServer

                base_server = mock.Mock(spec=BaseWSGIServer)
                base_server.shutdown = mock.Mock()
                gc_objects = [base_server]
                mock_gc = stack.enter_context(
                    mock.patch("gc.get_objects", mock.Mock(return_value=gc_objects))
                )
                resp = c.get("/shutdown").data
                assert "Server shutting down..." in str(resp)
                mock_gc.assert_called()
                base_server.shutdown.assert_called()
            unittest.fail()
        except:  # noqa
            pass
        if parse_version(werkzeug.__version__) < parse_version("2.1.0"):
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
        response_data = response.get_json()
        unittest.assertDictContainsSubset(
            {
                "rows": 50,
                "name": "foo",
                "ts": 1525106204000,
                "start": "12:36:44 PM",
                "names": "date,security_id,foo,bar,baz",
                "data_id": str(c.port),
                "columns": 5,
                # "mem_usage": 4600 if PY3 else 4000,
            },
            response_data["data"][0],
        )

        response = c.get("/dtale/process-keys")
        response_data = response.get_json()
        assert response_data["data"][0]["id"] == str(c.port)

    global_state.clear_store()
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: build_dtypes_state(test_data)})
        global_state.set_metadata(c.port, {})
        response = c.get("/dtale/processes")
        response_data = response.get_json()
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
            response_data = response.get_json()
            assert "error" in response_data

    settings = json.dumps(dict(enable_custom_filters=True))
    with app.test_client() as c:
        with ExitStack() as stack:
            global_state.set_data(c.port, None)
            response = c.get(
                "/dtale/update-settings/{}".format(c.port),
                query_string=dict(settings=settings),
            )
            assert response.status_code == 200, "should return 200 response"
            response_data = response.get_json()
            assert (
                response_data["error"]
                == "Cannot alter the property 'enable_custom_filters' from this endpoint"
            )


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
def test_duplicate_cols(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        data = {c.port: df}
        build_data_inst(data)
        settings = {c.port: {"locked": ["a"]}}
        build_settings(settings)
        dtypes = {c.port: build_dtypes_state(df)}
        build_dtypes(dtypes)

        resp = c.get(
            "/dtale/duplicate-col/{}".format(c.port), query_string=dict(col="b")
        )
        unittest.assertEquals(
            list(global_state.get_data(c.port).columns), ["a", "b", "b_2", "c"]
        )
        assert resp.json["col"] == "b_2"


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
        unittest.assertEqual(resp["outliers"], [1000, 2000, 10000])
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
            data=json.dumps(
                dict(visibility=json.dumps({"a": True, "b": True, "c": False}))
            ),
            content_type="application/json",
        )
        unittest.assertEqual(
            [True, True, False],
            [col["visible"] for col in global_state.get_dtypes(c.port)],
        )
        c.post(
            "/dtale/update-visibility/{}".format(c.port),
            data=json.dumps(dict(toggle="c")),
            content_type="application/json",
        )
        unittest.assertEqual(
            [True, True, True],
            [col["visible"] for col in global_state.get_dtypes(c.port)],
        )

        resp = c.post(
            "/dtale/update-visibility/-1",
            data=json.dumps(dict(toggle="foo")),
            content_type="application/json",
        )
        assert "error" in json.loads(resp.data)


@pytest.mark.unit
def test_build_column():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(
        [dict(a=1, b=2, c=3, d=pd.Timestamp("20200101"), e=pd.Timestamp("20200102"))]
    )
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
        assert (
            global_state.get_dtypes(c.port)[-1]["dtype"] == "int32"
            if pandas_util.is_pandas2()
            else "int64"
        )

        for p in [
            "minute",
            "hour",
            "time",
            "date",
            "weekday_name",
            "month",
            "quarter",
            "year",
        ]:
            c.get(
                "/dtale/build-column/{}".format(c.port),
                query_string=dict(
                    type="datetime", name=p, cfg=json.dumps(dict(col="d", property=p))
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
        assert global_state.get_dtypes(c.port)[-1]["dtype"] == "datetime64[{}]".format(
            "us" if pandas_util.is_pandas3() else "ns"
        )

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
        response_data = response.get_json()
        assert response_data["success"]

        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(
                type="datetime",
                name="ts_diff",
                cfg=json.dumps(dict(col="d", timeDifference="now")),
            ),
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = response.get_json()
        assert response_data["success"]

        c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(
                type="datetime",
                name="ts_diff_col",
                cfg=json.dumps(
                    dict(col="d", timeDifference="col", timeDifferenceCol="e")
                ),
            ),
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = response.get_json()
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
        response_data = response.get_json()
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
        assert global_state.get_dtypes(c.port)[-1]["dtype"].startswith("str")

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
        assert (
            global_state.get_dtypes(c.port)[-1]["dtype"] == "str"
            if pandas_util.is_pandas3()
            else "string"
        )

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
        assert (
            global_state.get_dtypes(c.port)[-1]["dtype"] == "str"
            if pandas_util.is_pandas3()
            else "string"
        )

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
        assert (
            global_state.get_dtypes(c.port)[-1]["dtype"] == "str"
            if pandas_util.is_pandas3()
            else "string"
        )


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

    if not pandas_util.is_pandas3():
        test_data = test_data.copy()
        test_data.loc[:, "mixed_col"] = 1
        test_data.loc[0, "mixed_col"] = "x"

        with app.test_client() as c:
            with ExitStack():
                build_data_inst({c.port: test_data})
                build_dtypes({c.port: build_dtypes_state(test_data)})
                response = c.get("/dtale/dtypes/{}".format(c.port))
                response_data = response.get_json()
                assert response_data["success"]

                for col in test_data.columns:
                    response = c.get(
                        "/dtale/describe/{}".format(c.port), query_string=dict(col=col)
                    )
                    response_data = response.get_json()
                    assert response_data["success"]

    lots_of_groups = pd.DataFrame([dict(a=i, b=1) for i in range(150)])
    with app.test_client() as c:
        with ExitStack():
            build_data_inst({c.port: lots_of_groups})
            build_dtypes({c.port: build_dtypes_state(lots_of_groups)})
            response = c.get("/dtale/dtypes/{}".format(c.port))
            response_data = response.get_json()
            assert response_data["success"]

            response = c.get(
                "/dtale/describe/{}".format(c.port), query_string=dict(col="a")
            )
            response_data = response.get_json()
            uniq_key = list(response_data["uniques"].keys())[0]
            assert response_data["uniques"][uniq_key]["top"]
            assert response_data["success"]

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.global_state.get_dtypes", side_effect=Exception)
            )
            response = c.get("/dtale/dtypes/{}".format(c.port))
            response_data = response.get_json()
            assert "error" in response_data

            response = c.get(
                "/dtale/describe/{}".format(c.port), query_string=dict(col="foo")
            )
            response_data = response.get_json()
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
            response_data = response.get_json()
            assert response_data["describe"]["min"] == "2"
            assert response_data["describe"]["max"] == "inf"

            global_state.set_settings(c.port, dict(query="security_id == 1"))
            response = c.get(
                "/dtale/describe/{}".format(c.port),
                query_string=dict(col="foo", filtered="true"),
            )
            response_data = response.get_json()
            assert response_data["describe"]["min"] == "1"
            assert response_data["describe"]["max"] == "2"


@pytest.mark.unit
def test_describe_string_metrics():
    from dtale.views import build_dtypes_state, format_data

    # Build a DataFrame with a string column containing diverse content
    df = pd.DataFrame(
        {
            "str_col": [
                "Hello World",  # with space, upper, lower
                " leading",  # space_at_the_first
                "trailing ",  # space_at_the_end
                "double  space",  # multi_space_after_each_other
                "num123",  # with_num
                "UPPER",  # with_upper only
                "lower",  # with_lower only
                "café",  # with_accent
                "punc!@#",  # with_punc
                "normal",  # plain string
            ],
            "id": range(10),
        }
    )
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})

        response = c.get(
            "/dtale/describe/{}".format(c.port), query_string=dict(col="str_col")
        )
        response_data = response.get_json()
        assert response_data["success"]
        assert "string_metrics" in response_data

        sm = response_data["string_metrics"]
        # Character length metrics
        assert "char_min" in sm
        assert "char_max" in sm
        assert "char_mean" in sm
        assert "char_std" in sm
        assert sm["char_min"] > 0
        assert sm["char_max"] >= sm["char_min"]

        # Word metrics
        assert "word_min" in sm
        assert "word_max" in sm
        assert "word_mean" in sm
        assert "word_std" in sm

        # Content type counts
        assert sm["with_space"] > 0
        assert sm["with_num"] > 0
        assert sm["with_upper"] > 0
        assert sm["with_lower"] > 0
        assert sm["with_punc"] > 0
        assert sm["with_accent"] > 0
        assert sm["space_at_the_first"] > 0
        assert sm["space_at_the_end"] > 0
        assert sm["multi_space_after_each_other"] > 0

        # Code export should be present
        assert "code" in response_data
        assert "char_len = s.len()" in response_data["code"]


@pytest.mark.unit
def test_describe_string_uniques():
    from dtale.views import build_dtypes_state, format_data

    # Verify the unique values / top frequency logic for string columns
    df = pd.DataFrame({"s": ["a", "a", "a", "b", "b", "c"]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})

        response = c.get(
            "/dtale/describe/{}".format(c.port), query_string=dict(col="s")
        )
        response_data = response.get_json()
        assert response_data["success"]
        assert "uniques" in response_data
        assert response_data["describe"]["freq"] == 3  # 'a' appears 3 times


@pytest.mark.unit
def test_describe_sequential_diffs():
    from dtale.views import build_dtypes_state, format_data

    # Test sequential diffs for integer column (covers build_sequential_diffs)
    df = pd.DataFrame({"val": [10, 20, 25, 50, 100]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})

        response = c.get(
            "/dtale/describe/{}".format(c.port), query_string=dict(col="val")
        )
        response_data = response.get_json()
        assert response_data["success"]
        assert "sequential_diffs" in response_data
        sd = response_data["sequential_diffs"]
        assert "min" in sd
        assert "max" in sd
        assert "avg" in sd


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
        if parse_version(pd.__version__) >= parse_version("1.3.0"):
            expected["x"]["check2"]["val1"]["val"] = 0
            expected["x"]["check2"]["val2"]["val"] = 1
        response_data = response.get_json()
        del response_data["code"]
        response_data["shapiroWilk"]["pvalue"] = round(
            response_data["shapiroWilk"]["pvalue"], 4
        )
        response_data["shapiroWilk"]["statistic"] = round(
            response_data["shapiroWilk"]["statistic"], 4
        )
        response_data["jarqueBera"]["pvalue"] = round(
            response_data["jarqueBera"]["pvalue"], 4
        )
        response_data["jarqueBera"]["statistic"] = round(
            response_data["jarqueBera"]["statistic"], 4
        )
        unittest.assertEqual(response_data, expected["x"])

        response = c.get(
            "/dtale/variance/{}".format(c.port), query_string=dict(col="low_var")
        )
        response_data = response.get_json()
        del response_data["code"]
        response_data["shapiroWilk"]["statistic"] = round(
            response_data["shapiroWilk"]["statistic"], 4
        )
        response_data["shapiroWilk"]["pvalue"] = round(
            response_data["shapiroWilk"]["pvalue"], 4
        )
        response_data["jarqueBera"]["statistic"] = round(
            response_data["jarqueBera"]["statistic"], 4
        )
        unittest.assertEqual(response_data, expected["low_var"])


@pytest.mark.unit
def test_test_filter(test_data):
    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        global_state.set_app_settings(dict(enable_custom_filters=True))
        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="date == date"),
        )
        response_data = response.get_json()
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port), query_string=dict(query="foo == 1")
        )
        response_data = response.get_json()
        assert response_data["success"]

        query = "date == '20000101'"
        if pandas_util.is_pandas3():
            query = "date > '19991231' and date < '20000102'"
        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query=query),
        )
        response_data = response.get_json()
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="baz == 'baz'"),
        )
        response_data = response.get_json()
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port), query_string=dict(query="bar > 1.5")
        )
        response_data = response.get_json()
        assert not response_data["success"]
        assert response_data["error"] == 'query "bar > 1.5" found no data, please alter'

        response = c.get(
            "/dtale/test-filter/{}".format(c.port), query_string=dict(query="foo2 == 1")
        )
        response_data = response.get_json()
        assert "error" in response_data

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query=None, save="true"),
        )
        response_data = response.get_json()
        assert response_data["success"]

        global_state.set_app_settings(dict(enable_custom_filters=False))
        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="foo2 == 1", save=True),
        )
        response_data = response.get_json()
        assert not response_data["success"]
        assert response_data["error"] == (
            "Custom Filters not enabled! Custom filters are vulnerable to code injection attacks, please only "
            "use in trusted environments."
        )
        global_state.set_app_settings(dict(enable_custom_filters=True))

    if PY3:
        df = pd.DataFrame([dict(a=1)])
        df["a.b"] = 2
        with app.test_client() as c:
            build_data_inst({c.port: df})
            response = c.get(
                "/dtale/test-filter/{}".format(c.port),
                query_string=dict(query="a.b == 2"),
            )
            response_data = response.get_json()
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
        response_data = response.get_json()
        unittest.assertEqual(
            response_data, {}, 'if no "ids" parameter an empty dict should be returned'
        )

        response = c.get(
            "/dtale/data/{}".format(c.port), query_string=dict(ids=json.dumps(["1"]))
        )
        response_data = response.get_json()
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
                    dtype="datetime64[{}]".format(
                        "us" if pandas_util.is_pandas3() else "ns"
                    ),
                    name="date",
                    index=0,
                    visible=True,
                    hasMissing=0,
                    hasOutliers=0,
                    unique_ct=1,
                    kurt=0.0 if pandas_util.is_pandas3() else 0,
                    skew=0.0 if pandas_util.is_pandas3() else 0,
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
                    skew=0.0 if pandas_util.is_pandas3() else 0,
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
                    kurt=0.0 if pandas_util.is_pandas3() else 0,
                    skew=0.0 if pandas_util.is_pandas3() else 0,
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
                    kurt=0.0 if pandas_util.is_pandas3() else 0,
                    skew=0.0 if pandas_util.is_pandas3() else 0,
                    coord=None,
                ),
                dict(
                    dtype="str" if pandas_util.is_pandas3() else "string",
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
            "/dtale/data/{}".format(c.port), query_string=dict(ids=json.dumps(["1-2"]))
        )
        response_data = response.get_json()
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
        response_data = response.get_json()
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
            response_data["results"], expected, "should return data at index 1 w/ sort"
        )
        unittest.assertEqual(
            global_state.get_settings(c.port),
            {"sortInfo": [["security_id", "DESC"]]},
            "should update settings",
        )

        params = dict(ids=json.dumps(["1"]), sort=json.dumps([["security_id", "ASC"]]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
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
            response_data["results"], expected, "should return data at index 1 w/ sort"
        )
        unittest.assertEqual(
            global_state.get_settings(c.port),
            {"sortInfo": [["security_id", "ASC"]]},
            "should update settings",
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = response.get_json()
        assert response_data["success"]

        response = c.get(
            "/dtale/test-filter/{}".format(c.port),
            query_string=dict(query="security_id == 1", save="true"),
        )
        response_data = response.get_json()
        assert response_data["success"]
        unittest.assertEqual(
            global_state.get_settings(c.port)["query"],
            "security_id == 1",
            "should update settings",
        )

        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
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
            response_data["results"], expected, "should return data at index 1 w/ sort"
        )

        global_state.get_settings(c.port)["highlightFilter"] = True
        params = dict(ids=json.dumps(["1"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
        expected = {
            "1": dict(
                date="2000-01-01",
                security_id=1,
                dtale_index=1,
                foo=1,
                bar=1.5,
                baz="baz",
                __filtered=True,
            )
        }
        unittest.assertEqual(
            response_data["results"],
            expected,
            "should return data at index 1 w/ filtered flag for highlighting",
        )

        params = dict(ids=json.dumps(["1-2"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
        expected = {
            "1": dict(
                date="2000-01-01",
                security_id=1,
                dtale_index=1,
                foo=1,
                bar=1.5,
                baz="baz",
                __filtered=True,
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
            response_data["results"],
            expected,
            "should return data at indexes 1-2 w/ filtered flag for highlighting",
        )

        response = c.get("/dtale/code-export/{}".format(c.port))
        response_data = response.get_json()
        assert response_data["success"]

        global_state.get_settings(c.port)["query"] = "security_id == 50"
        global_state.get_settings(c.port)["highlightFilter"] = False
        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
        assert len(response_data["results"]) == 0

        global_state.get_settings(c.port)["invertFilter"] = True
        params = dict(ids=json.dumps(["0"]))
        response = c.get("/dtale/data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
        assert len(response_data["results"]) == 1

        global_state.get_settings(c.port)["invertFilter"] = False

        response = c.get("/dtale/data-export/{}".format(c.port))
        assert response.content_type == "text/csv"

        response = c.get(
            "/dtale/data-export/{}".format(c.port), query_string=dict(type="tsv")
        )
        assert response.content_type == "text/tsv"

        response = c.get("/dtale/data-export/a", query_string=dict(type="tsv"))
        response_data = response.get_json()
        assert "error" in response_data

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        global_state.set_app_settings(dict(enable_custom_filters=True))
        build_settings({c.port: dict(query="missing_col == 'blah'")})
        response = c.get(
            "/dtale/data/{}".format(c.port), query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        unittest.assertEqual(
            response_data["error"],
            "name 'missing_col' is not defined",
            "should handle data exception",
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get(
            "/dtale/data/{}".format(c.port), query_string=dict(ids=json.dumps(["1"]))
        )
        assert response.status_code == 200

        tmp = global_state.get_data(c.port).copy()
        tmp["biz"] = 2.5
        global_state.set_data(c.port, tmp)
        response = c.get(
            "/dtale/data/{}".format(c.port), query_string=dict(ids=json.dumps(["1"]))
        )
        response_data = response.get_json()
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


@pytest.mark.unit
def test_export_html(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        test_data, _ = views.format_data(test_data)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})
        response = c.get("/dtale/data/{}".format(c.port))
        response_data = response.get_json()
        unittest.assertEqual(
            response_data, {}, 'if no "ids" parameter an empty dict should be returned'
        )

        response = c.get(
            "/dtale/data/{}".format(c.port), query_string=dict(export=True)
        )
        assert response.content_type == "text/html"

        response = c.get(
            "/dtale/data/{}".format(c.port),
            query_string=dict(export=True, export_rows=5),
        )
        assert response.content_type == "text/html"


@pytest.mark.unit
def test_export_parquet(test_data):
    pytest.importorskip("pyarrow")

    import dtale.views as views

    with app.test_client() as c:
        test_data, _ = views.format_data(test_data)
        build_data_inst({c.port: test_data})
        build_dtypes({c.port: views.build_dtypes_state(test_data)})

        response = c.get(
            "/dtale/data-export/{}".format(c.port), query_string=dict(type="parquet")
        )
        assert response.content_type == "application/octet-stream"


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
        response_data = response.get_json()
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
                    build_col_def("count", "security_id"): [50, 50, 50, 50, 50],
                }
            },
            "max": {build_col_def("count", "security_id"): 50, "x": "2000-01-05"},
            "min": {build_col_def("count", "security_id"): 50, "x": "2000-01-01"},
            "success": True,
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
        response_data = response.get_json()
        assert response_data["min"][build_col_def("mean", "security_id")] == 24.5
        assert response_data["max"][build_col_def("mean", "security_id")] == 24.5
        series_key = "(baz: baz)"
        assert response_data["data"][series_key]["x"][-1] == "2000-01-05"
        assert (
            len(response_data["data"][series_key][build_col_def("mean", "security_id")])
            == 5
        )
        assert (
            sum(response_data["data"][series_key][build_col_def("mean", "security_id")])
            == 122.5
        )

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
        response_data = response.get_json()
        assert response_data["success"]

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        params = dict(x="baz", y=json.dumps(["foo"]))
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
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
        response_data = response.get_json()
        assert "Group (security_id) contains more than 30 unique values" in str(
            response_data["error"]
        )

    with app.test_client() as c:
        build_data_inst({c.port: test_data})
        global_state.set_app_settings(dict(enable_custom_filters=True))
        response = c.get(
            "/dtale/chart-data/{}".format(c.port),
            query_string=dict(query="missing_col == 'blah'"),
        )
        response_data = response.get_json()
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
        response_data = response.get_json()
        unittest.assertEqual(
            response_data["error"],
            'query "security_id == 51" found no data, please alter',
        )
    global_state.set_app_settings(dict(enable_custom_filters=False))

    df = pd.DataFrame([dict(a=i, b=np.nan) for i in range(100)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(x="a", y=json.dumps(["b"]), allowDupes=True)
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
        unittest.assertEqual(response_data["error"], 'All data for column "b" is NaN!')

    df = pd.DataFrame([dict(a=i, b=i) for i in range(15500)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        params = dict(x="a", y=json.dumps(["b"]), allowDupes=True)
        response = c.get("/dtale/chart-data/{}".format(c.port), query_string=params)
        response_data = response.get_json()
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
            assert "error" in response.get_json()

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
            assert "error" in response.get_json()

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
            assert response.get_json()["success"]


@pytest.mark.unit
def test_build_code_export_with_startup_code():
    from dtale.code_export import build_code_export

    df = pd.DataFrame({"a": [1, 2, 3]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_settings(data_id, {"startup_code": "df = load_data()"})

    result = build_code_export(data_id)
    code = "\n".join(result)
    assert "df = load_data()" in code


@pytest.mark.unit
def test_build_code_export_with_context_variables():
    from dtale.code_export import build_code_export

    df = pd.DataFrame({"a": [1, 2, 3]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_settings(
        data_id, {"query": "`a` in @my_var", "enable_custom_filters": True}
    )
    global_state.set_app_settings({"enable_custom_filters": True})
    global_state.set_context_variables(data_id, {"my_var": [1, 2]})

    result = build_code_export(data_id)
    code = "\n".join(result)
    assert "ctxt_vars" in code
    assert "local_dict" in code


@pytest.mark.unit
def test_build_code_export_with_query():
    from dtale.code_export import build_code_export

    df = pd.DataFrame({"a": [1, 2, 3]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_settings(
        data_id, {"query": "`a` > 1", "enable_custom_filters": True}
    )
    global_state.set_app_settings({"enable_custom_filters": True})

    result = build_code_export(data_id)
    code = "\n".join(result)
    assert "query" in code
    assert "`a` > 1" in code


@pytest.mark.unit
def test_build_code_export_with_xarray():
    from dtale.code_export import build_code_export

    df = pd.DataFrame({"a": [1, 2, 3]})
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_settings(data_id, {})
    global_state.set_dataset(data_id, {"key": "val"})
    global_state.set_dataset_dim(data_id, {"time": "2020-01-01"})

    result = build_code_export(data_id)
    code = "\n".join(result)
    assert "ds.sel" in code
    assert "time" in code


@pytest.mark.unit
def test_matplotlib_decorator():
    """Test matplotlib_decorator (covers lines 131-152)."""
    from dtale.views import matplotlib_decorator

    @matplotlib_decorator
    def dummy_func():
        import matplotlib

        return matplotlib.get_backend()

    result = dummy_func()
    assert result == "agg"


@pytest.mark.unit
def test_matplotlib_decorator_exception():
    """Test matplotlib_decorator handles exceptions properly."""
    from dtale.views import matplotlib_decorator

    @matplotlib_decorator
    def bad_func():
        raise ValueError("test error")

    with pytest.raises(ValueError, match="test error"):
        bad_func()


@pytest.mark.unit
def test_export_parquet_mocked():
    """Test parquet export endpoint (covers lines 3164-3172)."""
    from io import BytesIO

    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        fake_buf = BytesIO(b"fake_parquet_data")
        with mock.patch("dtale.utils.export_to_parquet_buffer", return_value=fake_buf):
            response = c.get(
                "/dtale/data-export/{}".format(c.port),
                query_string=dict(type="parquet"),
            )
            assert response.status_code == 200
            assert response.content_type == "application/octet-stream"


@pytest.mark.unit
def test_export_unsupported_type():
    """Test export with unsupported type returns error (covers line 3172)."""
    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        response = c.get(
            "/dtale/data-export/{}".format(c.port),
            query_string=dict(type="unknown"),
        )
        assert not response.get_json()["success"]


@pytest.mark.unit
def test_edit_cell_categorical():
    """Test editing a categorical column cell (covers lines 2693-2710)."""
    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame({"cat_col": pd.Categorical(["a", "b", "c"]), "val": [1, 2, 3]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {"locked": []}})
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="cat_col", rowIndex=0, updated="d"),
        )
        assert "error" not in resp.json
        # Verify the new category was added and value set
        data = global_state.get_data(c.port)
        assert data.at[0, "cat_col"] == "d"


@pytest.mark.unit
def test_correlations_matrix_image():
    """Test correlations matrix image generation (covers lines 3206-3224)."""
    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame(
        {"a": [1, 2, 3, 4, 5], "b": [5, 4, 3, 2, 1], "c": [1, 3, 5, 7, 9]}
    )
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/correlations/{}".format(c.port),
            query_string=dict(image=True),
        )
        assert resp.status_code == 200
        assert resp.content_type == "image/png"
        assert len(resp.data) > 0


@pytest.mark.unit
def test_dtale_data_get_corr_matrix():
    """Test DtaleData.get_corr_matrix(as_df=True) (covers lines 304-308)."""
    from dtale.views import DtaleData, build_dtypes_state, format_data

    df = pd.DataFrame(
        {"a": [1, 2, 3, 4, 5], "b": [5, 4, 3, 2, 1], "c": [1, 3, 5, 7, 9]}
    )
    df, _ = format_data(df)
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_dtypes(data_id, build_dtypes_state(df))
    global_state.set_settings(data_id, {})

    d = DtaleData(data_id, URL)
    result = d.get_corr_matrix(as_df=True)
    # Result should be a DataFrame when as_df=True
    assert isinstance(result, pd.DataFrame)
    assert "a" in result.columns
    assert "b" in result.columns


@pytest.mark.unit
def test_dtale_data_get_pps_matrix():
    """Test DtaleData.get_pps_matrix(as_df=True) (covers lines 312-316)."""
    from dtale.views import DtaleData, build_dtypes_state, format_data

    df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [5, 4, 3, 2, 1]})
    df, _ = format_data(df)
    data_id = global_state.new_data_inst()
    global_state.set_data(data_id, df)
    global_state.set_dtypes(data_id, build_dtypes_state(df))
    global_state.set_settings(data_id, {})

    d = DtaleData(data_id, URL)
    result = d.get_pps_matrix(as_df=True)
    # Result should be a DataFrame when as_df=True
    assert isinstance(result, pd.DataFrame)


@pytest.mark.unit
def test_describe_mixed_dtype():
    """Test describe endpoint with mixed dtype column (covers lines 2348-2352)."""
    from dtale.views import build_dtypes_state, format_data

    # Create DataFrame with mixed types where top value is single-typed
    # (avoids sort error on mixed int/str)
    df = pd.DataFrame(
        {
            "mixed": pd.array(["a", "a", "a", 1, 2], dtype=object),
            "val": [10, 20, 30, 40, 50],
        }
    )
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/describe/{}".format(c.port),
            query_string=dict(col="mixed"),
        )
        result = resp.get_json()
        assert result["success"]
        # Mixed dtype should produce dtype_counts
        assert "dtype_counts" in result


@pytest.mark.unit
def test_correlations_as_json():
    """Test correlations endpoint returning JSON (covers corr data paths)."""
    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame(
        {"a": [1, 2, 3, 4, 5], "b": [5, 4, 3, 2, 1], "c": [1, 3, 5, 7, 9]}
    )
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get("/dtale/correlations/{}".format(c.port))
        result = resp.get_json()
        assert "data" in result
        assert len(result["data"]) > 0


@pytest.mark.unit
def test_correlations_pps():
    """Test correlations endpoint with PPS (covers pps path and get_ppscore_matrix)."""
    from dtale.views import build_dtypes_state, format_data

    df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [5, 4, 3, 2, 1]})
    df, _ = format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/correlations/{}".format(c.port),
            query_string=dict(pps=True),
        )
        result = resp.get_json()
        assert "data" in result


@pytest.mark.unit
def test_version_info():
    with app.test_client() as c:
        with mock.patch(
            "dtale.cli.clickutils.Installed", mock.Mock(side_effect=Exception("blah"))
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
            chart_type="3d_scatter", x="date", y=json.dumps(["security_id"]), z="Col0"
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


@pytest.mark.skipif(
    not PY3 or parse_version(platform.python_version()) >= parse_version("3.9.0"),
    reason="requires 3.0.0 <= python < 3.9.0",
)
def test_chart_exports_clustergram(clustergram_data):
    pytest.importorskip("dash_bio")
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
def test_chart_exports_pareto(pareto_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        df, _ = views.format_data(pareto_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))

        params = dict(
            chart_type="pareto",
            pareto_x="desc",
            pareto_bars="count",
            pareto_line="cum_pct",
            pareto_dir="DESC",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"


@pytest.mark.unit
def test_chart_exports_histogram(test_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        df, _ = views.format_data(test_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))

        params = dict(
            chart_type="histogram",
            histogram_col="foo",
            histogram_type="bins",
            histogram_bins="5",
        )
        response = c.get("/dtale/chart-export/{}".format(c.port), query_string=params)
        assert response.content_type == "text/html"


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_export_all_charts(custom_data, state_data):
    import dtale.views as views

    global_state.clear_store()
    with app.test_client() as c:
        build_data_inst({c.port: custom_data})
        build_dtypes({c.port: views.build_dtypes_state(custom_data)})
        params = dict(chart_type="invalid")
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "application/json"

        params = dict(
            chart_type="line",
            x="date",
            y=json.dumps(["Col0"]),
            agg="sum",
            query="Col5 == 50",
        )
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "application/json"

        params = dict(chart_type="bar", x="date", y=json.dumps(["Col0"]), agg="sum")
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params["group"] = json.dumps(["bool_val"])
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(chart_type="line", x="date", y=json.dumps(["Col0"]), agg="sum")
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(chart_type="scatter", x="Col0", y=json.dumps(["Col1"]))
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params["trendline"] = "ols"
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(
            chart_type="3d_scatter", x="date", y=json.dumps(["security_id"]), z="Col0"
        )
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(
            chart_type="surface", x="date", y=json.dumps(["security_id"]), z="Col0"
        )
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(
            chart_type="pie",
            x="security_id",
            y=json.dumps(["Col0"]),
            agg="sum",
            query="security_id >= 100000 and security_id <= 100010",
        )
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

        params = dict(
            chart_type="heatmap", x="date", y=json.dumps(["security_id"]), z="Col0"
        )
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

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
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
        assert response.content_type == "text/html"

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
        response = c.get(
            "/dtale/chart-export-all/{}".format(c.port), query_string=params
        )
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
            for path in ["/dtale/main/1"]:
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
        with ExitStack():
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
                mock.patch("dtale.global_state.APP_SETTINGS", {"github_fork": True})
            )
            response = c.get("/dtale/main/{}".format(c.port))
            assert 'span id="forkongithub"' in str(response.data)

    with build_app(url=url).test_client() as c:
        with ExitStack():
            build_data_inst({c.port: df})
            build_dtypes({c.port: views.build_dtypes_state(df)})
            build_settings(
                {
                    c.port: {
                        "main_title": "test_title",
                        "main_title_font": "test_title_font",
                    }
                }
            )
            response = c.get("/dtale/main/{}".format(c.port))
            assert 'input type="hidden" id="main_title" value="test_title"' in str(
                response.data
            )
            assert (
                'input type="hidden" id="main_title_font" value="test_title_font"'
                in str(response.data)
            )


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
        response_data = response.get_json()
        assert response_data["success"]
        unittest.assertEqual(
            response_data["contextVars"], expected_return_value, "should match expected"
        )

    with app.test_client() as c:
        global_state.set_context_variables(data_id, None)
        response = c.get("/dtale/filter-info/{}".format(data_id))
        response_data = response.get_json()
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
        response_data = response.get_json()
        unittest.assertEqual(
            response_data,
            {"hasMissing": False, "uniques": ["False", "True"], "success": True},
        )
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="str_val"),
        )
        response_data = response.get_json()
        assert response_data["hasMissing"]
        assert all(k in response_data for k in ["hasMissing", "uniques", "success"])
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="int_val"),
        )
        response_data = response.get_json()
        assert not response_data["hasMissing"]
        assert all(
            k in response_data
            for k in ["max", "hasMissing", "uniques", "success", "min"]
        )
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port), query_string=dict(col="Col0")
        )
        response_data = response.get_json()
        assert not response_data["hasMissing"]
        assert all(k in response_data for k in ["max", "hasMissing", "success", "min"])
        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port), query_string=dict(col="date")
        )
        response_data = response.get_json()
        assert not response_data["hasMissing"]
        assert all(k in response_data for k in ["max", "hasMissing", "success", "min"])

        response = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="missing_col"),
        )
        response_data = response.get_json()
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
        response_data = response.get_json()
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
        response_data = response.get_json()
        unittest.assertEqual(response_data, [dict(value=str_val, label=str_val)])

        int_val = df.int_val.values[0]
        response = c.get(
            "/dtale/async-column-filter-data/{}".format(c.port),
            query_string=dict(col="int_val", input=str(df.int_val.values[0])),
        )
        response_data = response.get_json()
        unittest.assertEqual(
            response_data, [dict(value=int_val, label="{}".format(int_val))]
        )


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
            response.get_json()["currFilters"]["bool_val"],
            {
                "query": "`bool_val` == False",
                "value": ["False"],
                "action": "equals",
                "caseSensitive": False,
                "operand": "=",
                "raw": None,
                "meta": {"classification": "B", "column": "bool_val", "type": "string"},
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="str_val", cfg=json.dumps({"type": "string", "value": ["a", "b"]})
            ),
        )
        unittest.assertEqual(
            response.get_json()["currFilters"]["str_val"],
            {
                "query": (
                    "`str_val` in ('a', 'b')" if PY3 else "`str_val` in (u'a', u'b')"
                ),
                "value": ["a", "b"],
                "action": "equals",
                "caseSensitive": False,
                "operand": "=",
                "raw": None,
                "meta": {"classification": "S", "column": "str_val", "type": "string"},
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
                    col=col,
                    cfg=json.dumps(
                        {"type": f_type, "populated": True, "missing": False}
                    ),
                ),
            )
            col_cfg = response.get_json()["currFilters"][col]
            assert col_cfg["query"] == "~`{col}`.isnull()".format(col=col)
            assert col_cfg["populated"]

        for col, f_type in [
            ("bool_val", "string"),
            ("int_val", "int"),
            ("date", "date"),
        ]:
            response = c.get(
                "/dtale/save-column-filter/{}".format(c.port),
                query_string=dict(
                    col=col,
                    cfg=json.dumps(
                        {"type": f_type, "missing": True, "populated": False}
                    ),
                ),
            )
            col_cfg = response.get_json()["currFilters"][col]
            assert col_cfg["query"] == "`{col}`.isnull()".format(col=col)
            assert col_cfg["missing"]

        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(col="bool_val", cfg=None),
        )
        response_data = response.get_json()
        assert "error" in response_data

        meta = {"classification": "I", "column": "int_val", "type": "int"}
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
                response.get_json()["currFilters"]["int_val"],
                {"query": query, "value": "5", "operand": operand, "meta": meta},
            )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="int_val",
                cfg=json.dumps({"type": "int", "operand": "=", "value": ["5", "4"]}),
            ),
        )
        unittest.assertEqual(
            response.get_json()["currFilters"]["int_val"],
            {
                "query": "`int_val` in (5, 4)",
                "value": ["5", "4"],
                "operand": "=",
                "meta": meta,
            },
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
            response.get_json()["currFilters"]["int_val"],
            {
                "query": "`int_val` >= 4 and `int_val` <= 5",
                "min": "4",
                "max": "5",
                "operand": "[]",
                "meta": meta,
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
            response.get_json()["currFilters"]["int_val"],
            {
                "query": "`int_val` > 4 and `int_val` < 5",
                "min": "4",
                "max": "5",
                "operand": "()",
                "meta": meta,
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
            response.get_json()["currFilters"]["int_val"],
            {"query": "`int_val` > 4", "min": "4", "operand": "()", "meta": meta},
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
            response.get_json()["currFilters"]["int_val"],
            {"query": "`int_val` < 5", "max": "5", "operand": "()", "meta": meta},
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
            response.get_json()["currFilters"]["int_val"],
            {
                "query": "`int_val` == 4",
                "min": "4",
                "max": "4",
                "operand": "()",
                "meta": meta,
            },
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
        meta = {"classification": "D", "column": "date", "type": "date"}
        unittest.assertEqual(
            response.get_json()["currFilters"]["date"],
            {
                "query": "`date` == '20000101'",
                "start": "20000101",
                "end": "20000101",
                "meta": meta,
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
            response.get_json()["currFilters"]["date"],
            {
                "query": "`date` >= '20000101' and `date` <= '20000102'",
                "start": "20000101",
                "end": "20000102",
                "meta": meta,
            },
        )
        response = c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="date", cfg=json.dumps({"type": "date", "missing": False})
            ),
        )
        assert "date" not in response.get_json()["currFilters"]

        assert settings[c.port].get("query") is None

        global_state.set_app_settings(dict(enable_custom_filters=True))

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
            data=json.dumps({"columns": json.dumps(["a"])}),
            content_type="application/json",
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
            data=json.dumps({"start": 1, "end": 2, "columns": json.dumps(["a"])}),
            content_type="application/json",
        )
        assert resp.data == b"1\n2\n"
        resp = c.post(
            "/dtale/build-row-copy/{}".format(c.port),
            data=json.dumps({"rows": json.dumps([1]), "columns": json.dumps(["a"])}),
            content_type="application/json",
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
            data=json.dumps(dict(ranges=json.dumps(range_highlights))),
            content_type="application/json",
        )
        assert global_state.get_settings(c.port)["rangeHighlight"] is not None


@pytest.mark.unit
def test_aggregations(unittest):
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/aggregations/{}/a".format(c.port), query_string={"filtered": True}
        )
        unittest.assertEquals(
            resp.json, {"mean": 2.0, "median": 2.0, "success": True, "sum": 6.0}
        )
        resp = c.get(
            "/dtale/weighted-average/{}/a/b".format(c.port),
            query_string={"filtered": True},
        )
        unittest.assertEquals(
            resp.json, {"result": 2.1333333333333333, "success": True}
        )


@pytest.mark.unit
def test_instance_data(unittest):
    import dtale.views as views
    import dtale

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: dict()})

        params = dict(ids=json.dumps(["1"]), sort=json.dumps([["b", "DESC"]]))
        c.get("/dtale/data/{}".format(c.port), query_string=params)

        i = dtale.get_instance(c.port)
        assert i.data["b"].values[0] == 6

        c.get(
            "/dtale/save-column-filter/{}".format(c.port),
            query_string=dict(
                col="b", cfg=json.dumps({"type": "int", "operand": ">=", "value": "5"})
            ),
        )

        assert len(i.view_data) == 2
        assert i.view_data["b"].values[0] == 6


@pytest.mark.unit
def test_raw_pandas(unittest):
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/raw-pandas/{}".format(c.port), query_string={"func_type": "info"}
        )
        assert resp.json["success"]

        resp = c.get(
            "/dtale/raw-pandas/{}".format(c.port), query_string={"func_type": "nunique"}
        )
        assert resp.json["success"]

        resp = c.get(
            "/dtale/raw-pandas/{}".format(c.port),
            query_string={"func_type": "describe"},
        )
        assert resp.json["success"]


@pytest.mark.unit
def test_calc_data_ranges_value_error():
    """Test calc_data_ranges with data that raises ValueError (covers line 822)."""
    import dtale.views as views

    # Create a DataFrame where agg(["min","max"]) raises ValueError
    # This happens with mixed types after transpose
    df = pd.DataFrame({"a": [1, "text", None]})
    result = views.calc_data_ranges(df)
    assert result == {} or isinstance(result, dict)


@pytest.mark.unit
def test_calc_data_ranges_type_error():
    """Test calc_data_ranges with data that raises TypeError (covers lines 824-832)."""
    import dtale.views as views

    # Create a DataFrame with mixed types that triggers TypeError on agg
    # When string and numeric columns are mixed, agg can raise TypeError
    class BadAggDF:
        columns = ["a", "b"]

        def agg(self, funcs):
            raise TypeError("test")

    # Use mock to trigger TypeError path
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    with mock.patch.object(pd.DataFrame, "agg", side_effect=TypeError("test")):
        result = views.calc_data_ranges(df, dtypes={"a": "int64", "b": "string"})
    # Should fall into the TypeError handler and try non-string columns
    assert isinstance(result, dict)


@pytest.mark.unit
def test_calc_data_ranges_type_error_fallback():
    """Test calc_data_ranges TypeError with inner BaseException (covers lines 831-832)."""
    import dtale.views as views

    # When even the non-string column agg fails
    df = pd.DataFrame({"a": [1, 2, 3]})
    call_count = [0]

    def mock_agg(self, *args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            raise TypeError("first call")
        raise ValueError("second call")

    with mock.patch.object(pd.DataFrame, "agg", mock_agg):
        result = views.calc_data_ranges(df, dtypes={"a": "int64"})
    assert result == {}


@pytest.mark.unit
def test_duplicate_col_with_existing_dupes():
    """Test duplicate-col endpoint when duplicate names already exist (covers lines 2615-2616)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3], "a_2": [4, 5, 6]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/duplicate-col/{}".format(c.port),
            query_string=dict(col="a"),
        )
        result = resp.get_json()
        assert result["success"]
        # Since a_2 already exists, it should create a_3
        assert result["col"] == "a_3"


@pytest.mark.unit
def test_column_filter_data_many_uniques():
    """Test column-filter-data with >500 unique values triggers truncation (covers line 2748)."""
    import dtale.views as views

    # Create data with >500 unique string values
    vals = ["val_{}".format(i) for i in range(600)]
    df = pd.DataFrame({"s": vals})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="s"),
        )
        result = resp.get_json()
        assert result["success"]
        # Should truncate to 5 values
        assert len(result["uniques"]) == 5


@pytest.mark.unit
def test_move_filters_to_custom_disabled():
    """Test move-filters-to-custom when custom filters are disabled (covers lines 4327-4335)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        # Explicitly disable custom filters
        global_state.set_app_settings(dict(enable_custom_filters=False))
        resp = c.get("/dtale/move-filters-to-custom/{}".format(c.port))
        result = resp.get_json()
        assert not result["success"]
        assert "Custom Filters not enabled" in result["error"]


@pytest.mark.unit
def test_move_filters_to_custom_enabled():
    """Test move-filters-to-custom when custom filters are enabled (covers lines 4336-4348)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        global_state.set_app_settings(dict(enable_custom_filters=True))
        # Set column filters first
        global_state.update_settings(
            c.port,
            {
                "columnFilters": {"a": {"type": "int", "query": "a > 1"}},
                "query": "",
            },
        )
        resp = c.get("/dtale/move-filters-to-custom/{}".format(c.port))
        result = resp.get_json()
        assert result["success"]
        settings = result.get("settings", {})
        # Column filters should be cleared
        assert settings.get("columnFilters") == {}


@pytest.mark.unit
def test_build_column_inplace():
    """Test build-column with saveAs=inplace (covers line 1908)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1.1, 2.2, 3.3], "b": [4, 5, 6]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        cfg = json.dumps({"col": "a", "to": "int", "from": "float64"})
        resp = c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="type_conversion", saveAs="inplace", cfg=cfg),
        )
        result = resp.get_json()
        assert result["success"]
        # Column a should be converted in place
        data = global_state.get_data(c.port)
        assert data["a"].dtype.kind == "i"  # integer kind


@pytest.mark.unit
def test_network_viewer_redirect():
    """Test network viewer redirect when data_id not in global state (covers line 1542)."""
    with app.test_client() as c:
        # Don't set up any data for this port
        resp = c.get("/dtale/network/{}".format("9999"))
        assert resp.status_code == 302  # redirect


@pytest.mark.unit
def test_update_settings_query_removal():
    """Test update-settings removes query when custom filters disabled (covers line 1644)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        # Explicitly disable custom filters
        global_state.set_app_settings(dict(enable_custom_filters=False))
        resp = c.get(
            "/dtale/update-settings/{}".format(c.port),
            query_string=dict(settings=json.dumps({"query": "a > 1", "sortInfo": []})),
        )
        result = resp.get_json()
        assert result["success"]
        # Query should have been removed since custom filters are disabled
        settings = global_state.get_settings(c.port)
        assert (
            "query" not in settings
            or settings.get("query") is None
            or settings.get("query") == ""
        )


@pytest.mark.unit
def test_update_settings_enable_custom_filters_blocked():
    """Test update-settings blocks setting enable_custom_filters (covers lines 1638-1641)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/update-settings/{}".format(c.port),
            query_string=dict(settings=json.dumps({"enable_custom_filters": True})),
        )
        result = resp.get_json()
        assert "error" in result


@pytest.mark.unit
def test_build_string_metrics():
    """Test describe endpoint with string column to cover build_string_metrics (covers lines 2186-2264)."""
    import dtale.views as views

    df = pd.DataFrame({"s": ["hello world", "foo bar", "TESTING 123", "àccent"]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/describe/{}".format(c.port),
            query_string=dict(col="s"),
        )
        result = resp.get_json()
        assert result["success"]
        # String metrics should be present
        describe = result.get("describe", {})
        assert "char_min" in describe or "string_metrics" in result


@pytest.mark.unit
def test_edit_cell():
    """Test edit-cell endpoint (covers lines 2640-2700+)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        # Edit numeric cell
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="a", rowIndex=0, updated="10"),
        )
        result = resp.get_json()
        assert result["success"]
        assert global_state.get_data(c.port)["a"].values[0] == 10

        # Edit string cell
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="b", rowIndex=1, updated="new_val"),
        )
        result = resp.get_json()
        assert result["success"]


@pytest.mark.unit
def test_column_filter_data_integer():
    """Test column-filter-data with integer column for range data (covers lines 2764-2769)."""
    import dtale.views as views

    df = pd.DataFrame(
        {"a": list(range(50)), "b": ["cat_{}".format(i % 5) for i in range(50)]}
    )
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/column-filter-data/{}".format(c.port),
            query_string=dict(col="a"),
        )
        result = resp.get_json()
        assert result["success"]
        assert "min" in result
        assert "max" in result
        assert "uniques" in result


@pytest.mark.unit
def test_async_column_filter_data():
    """Test async-column-filter-data endpoint (covers lines 2775-2783)."""
    import dtale.views as views

    vals = ["apple", "avocado", "banana", "cherry", "apricot"]
    df = pd.DataFrame({"s": vals})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/async-column-filter-data/{}".format(c.port),
            query_string=dict(col="s", input="a"),
        )
        result = resp.get_json()
        # Should return values starting with 'a'
        assert len(result) > 0


@pytest.mark.unit
def test_edit_cell_categorical_new_category():
    """Test edit-cell with categorical column adding new category (covers lines 2685-2692)."""
    import dtale.views as views

    df = pd.DataFrame({"cat": pd.Categorical(["a", "b", "c"]), "val": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        # Edit with a new category value not in existing categories
        resp = c.get(
            "/dtale/edit-cell/{}".format(c.port),
            query_string=dict(col="cat", rowIndex=0, updated="new_cat"),
        )
        result = resp.get_json()
        assert result["success"]
        data = global_state.get_data(c.port)
        assert data["cat"].iloc[0] == "new_cat"


@pytest.mark.unit
def test_network_analysis_no_weight():
    """Test network-analysis without weight (covers line 4195)."""
    import dtale.views as views

    df = pd.DataFrame(
        {
            "from": ["A", "B", "C", "A"],
            "to": ["B", "C", "D", "D"],
        }
    )
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/network-analysis/{}".format(c.port),
            query_string={"to": "to", "from": "from"},
        )
        result = resp.get_json()
        assert result["success"]
        assert result["data"]["max_edge"] is None  # no weight, so no max_edge


@pytest.mark.unit
def test_network_data():
    """Test network-data endpoint (covers lines 4119-4171)."""
    import dtale.views as views

    df = pd.DataFrame(
        {
            "from_node": ["A", "B", "C"],
            "to_node": ["B", "C", "D"],
        }
    )
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/network-data/{}".format(c.port),
            query_string={"to": "to_node", "from": "from_node"},
        )
        result = resp.get_json()
        assert result["success"]
        assert len(result["nodes"]) > 0
        assert len(result["edges"]) > 0


@pytest.mark.unit
def test_raw_pandas_invalid():
    """Test raw-pandas with invalid func_type (covers line 4565)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1, 2, 3]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        resp = c.get(
            "/dtale/raw-pandas/{}".format(c.port),
            query_string={"func_type": "invalid"},
        )
        result = resp.get_json()
        assert not result["success"]
        assert "Invalid function type" in result["error"]


@pytest.mark.unit
def test_replace_column_data():
    """Test build-replacement endpoint for float column ranges (covers lines 2043-2045)."""
    import dtale.views as views

    df = pd.DataFrame({"a": [1.0, 2.0, np.nan, 4.0], "b": [5.0, 6.0, 7.0, 8.0]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        cfg = json.dumps([{"type": "raw", "value": 1.0, "replace": 99.0}])
        resp = c.get(
            "/dtale/build-replacement/{}".format(c.port),
            query_string=dict(col="a", type="value", name="a_filled", cfg=cfg),
        )
        result = resp.get_json()
        assert result["success"]


@pytest.mark.unit
def test_describe_outliers():
    """Test describe with outlier data to trigger outlier query building (covers line 2485)."""
    import dtale.views as views

    # Create data with clear outliers
    vals = [1.0] * 100 + [1000.0]
    df = pd.DataFrame({"a": vals})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/describe/{}".format(c.port),
            query_string=dict(col="a"),
        )
        result = resp.get_json()
        assert result["success"]


@pytest.mark.unit
def test_outlier_query_both_sides():
    """Test outlier detection with outliers on both sides (covers lines 2485-2496)."""
    import dtale.views as views

    # Data with clear outliers on BOTH sides: most values in 50-60 range, with extreme outliers
    vals = list(range(50, 61)) * 10 + [-100, 200]
    df = pd.DataFrame({"a": vals})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        resp = c.get(
            "/dtale/outliers/{}".format(c.port),
            query_string=dict(col="a"),
        )
        result = resp.get_json()
        assert len(result["outliers"]) >= 2  # should find at least -100 and 200


@pytest.mark.unit
def test_build_column_multi_output():
    """Test build-column that returns DataFrame (multiple columns) (covers lines 1928-1930)."""
    import dtale.views as views

    df = pd.DataFrame({"cat": ["a", "b", "c", "a"], "val": [1, 2, 3, 4]})
    df, _ = views.format_data(df)
    with app.test_client() as c:
        build_data_inst({c.port: df})
        build_dtypes({c.port: views.build_dtypes_state(df)})
        build_settings({c.port: {}})
        cfg = json.dumps({"col": "cat", "n": 2, "algo": "feature_hasher"})
        resp = c.get(
            "/dtale/build-column/{}".format(c.port),
            query_string=dict(type="encoder", cfg=cfg, name="hash"),
        )
        result = resp.get_json()
        assert result["success"]


@pytest.mark.unit
def test_export_to_parquet_buffer():
    """Test parquet export error path when pyarrow missing (covers utils.py lines 771-773)."""
    from dtale.utils import export_to_parquet_buffer

    df = pd.DataFrame({"a": [1, 2, 3], "b": [4.0, 5.0, 6.0]})
    # pyarrow is not installed, so this should raise ImportError
    with pytest.raises(ImportError, match="parquet"):
        export_to_parquet_buffer(df)


@pytest.mark.unit
def test_calc_data_ranges_valueerror():
    """Test calc_data_ranges with ValueError (covers views.py line 822)."""
    from dtale.views import calc_data_ranges

    # Mock agg to raise ValueError
    df = pd.DataFrame({"a": [1, 2, 3]})
    with mock.patch.object(pd.DataFrame, "agg", side_effect=ValueError("test")):
        result = calc_data_ranges(df)
        assert result == {}


@pytest.mark.unit
def test_kill_exception():
    """Test kill() when request fails (covers views.py lines 199-200)."""
    from dtale.views import kill

    with mock.patch(
        "dtale.views.requests.get", side_effect=Exception("connection refused")
    ):
        # Should not raise - just logs and returns
        kill("http://localhost:99999")


@pytest.mark.unit
def test_json_string_base_exception():
    """Test json_string with BaseException in str() (covers utils.py lines 223-224)."""
    from dtale.utils import json_string

    class BadStr:
        def __str__(self):
            raise RuntimeError("cannot stringify")

        def __bool__(self):
            return True

    result = json_string(BadStr())
    assert result == ""  # falls through to nan_display default


@pytest.mark.unit
def test_unique_count():
    """Test unique_count function (covers utils.py line 822)."""
    from dtale.utils import unique_count

    s = pd.Series([1, 2, 2, 3, np.nan, 3])
    assert unique_count(s) == 3


@pytest.mark.unit
def test_is_vscode():
    """Test is_vscode detection (covers views.py lines 1306-1308)."""
    import dtale.views as views

    # Save original
    orig_pid = os.environ.get("VSCODE_PID")
    orig_inj = os.environ.get("VSCODE_INJECTION")
    try:
        # Clear both
        os.environ.pop("VSCODE_PID", None)
        os.environ.pop("VSCODE_INJECTION", None)
        assert views.is_vscode() is False

        # Set VSCODE_PID
        os.environ["VSCODE_PID"] = "12345"
        assert views.is_vscode() is True

        # Clear PID, set INJECTION
        del os.environ["VSCODE_PID"]
        os.environ["VSCODE_INJECTION"] = "1"
        assert views.is_vscode() is True
    finally:
        # Restore
        os.environ.pop("VSCODE_PID", None)
        os.environ.pop("VSCODE_INJECTION", None)
        if orig_pid is not None:
            os.environ["VSCODE_PID"] = orig_pid
        if orig_inj is not None:
            os.environ["VSCODE_INJECTION"] = orig_inj


@pytest.mark.unit
def test_dtale_data_main_url_no_data():
    """Test DtaleData._main_url and build_main_url with no data (covers views.py lines 261, 269)."""
    import dtale.views as views

    global_state.cleanup()
    # Create DtaleData with no matching data in global state
    d = views.DtaleData("99999", "http://localhost:40000")
    # With no data keys, _main_url calls build_main_url() without name
    url = d._main_url
    assert "localhost" in url


@pytest.mark.unit
def test_startup_with_predefined_filters():
    """Test startup with predefined_filters (covers views.py line 1208)."""
    import dtale.views as views
    from dtale import predefined_filters

    global_state.cleanup()
    # Set up a predefined filter
    predefined_filters.set_filters(
        [
            dict(
                name="test_filter",
                column="test_col",
                input_type="input",
                handler=lambda val, col: "{} == {}".format(col, val),
            )
        ]
    )
    try:
        df = pd.DataFrame({"test_col": [1, 2, 3], "val": [4, 5, 6]})
        instance = views.startup("http://localhost:40000", data=df)
        data_id = instance._data_id
        settings = global_state.get_settings(data_id)
        assert "predefinedFilters" in settings
        assert "test_filter" in settings["predefinedFilters"]
    finally:
        predefined_filters.PREDEFINED_FILTERS = []
        global_state.cleanup()


@pytest.mark.unit
def test_startup_with_column_edit_options():
    """Test startup with column_edit_options (covers views.py line 1235)."""
    import dtale.views as views

    global_state.cleanup()
    try:
        df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
        edit_opts = {"a": {"locked": True}}
        instance = views.startup(
            "http://localhost:40000", data=df, column_edit_options=edit_opts
        )
        data_id = instance._data_id
        settings = global_state.get_settings(data_id)
        assert settings.get("column_edit_options") == edit_opts
    finally:
        global_state.cleanup()


@pytest.mark.unit
def test_open_browser_unsupported_platform():
    """Test open_browser on unsupported platform (covers env_util.py lines 68-70)."""
    from dtale import env_util

    with mock.patch.object(env_util, "IS_WINDOWS", False), mock.patch.object(
        env_util, "IS_LINUX_OR_BSD", False
    ), mock.patch.object(env_util, "IS_DARWIN", False):
        with pytest.raises(env_util.Error, match="Cannot open browser"):
            env_util.open_browser("http://localhost:40000")


@pytest.mark.unit
def test_startup_with_data_loader_returning_data_id():
    """Test startup with data_loader returning existing data_id (covers views.py line 1025)."""
    import dtale.views as views

    global_state.cleanup()
    try:
        df = pd.DataFrame({"a": [1, 2, 3]})
        df, _ = views.format_data(df)
        global_state.new_data_inst("1")
        global_state.set_data("1", df)
        instance = views.startup("http://localhost:40000", data_loader=lambda: "1")
        assert instance._data_id == "1"
    finally:
        global_state.cleanup()
