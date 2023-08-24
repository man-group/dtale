import json
import mock
import pytest
from pkg_resources import parse_version

import dtale.global_state as global_state
from dtale.app import build_app
from tests import ExitStack


URL = "http://localhost:40000"
app = build_app(url=URL)


def setup_function(function):
    global_state.cleanup()
    global_state.use_default_store()


def teardown_function(function):
    global_state.cleanup()
    global_state.use_default_store()


def validate_data_load(data_id, unittest, client):
    response = client.get(
        "/dtale/data/{}".format(data_id), query_string=dict(ids=json.dumps(["0"]))
    )
    response_data = response.get_json()
    expected_results = {
        "0": {
            "dtale_index": 0,
            "float_val": 1.1,
            "index": "2000-01-01",
            "int_val": 1,
            "str_val": "a",
        }
    }
    unittest.assertEqual(response_data["results"], expected_results)
    unittest.assertEqual(response_data["total"], 3)
    unittest.assertEqual(response_data["final_query"], "")


@pytest.mark.unit
def test_head_endpoint(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import head_endpoint

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    assert head_endpoint() == "popup/arcticdb"


@pytest.mark.unit
def test_loading_data(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="df1")

    with app.test_client() as c:
        validate_data_load("dtale|df1", unittest, c)


@pytest.mark.unit
def test_loading_data_w_slashed_symbol(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="slashed/df1")

    with app.test_client() as c:
        response = c.get("/")
        assert response.location.endswith("/dtale/main/dtale%257Cslashed%252Fdf1")
        data_id = response.location.split("/")[-1]
        validate_data_load(data_id, unittest, c)


@pytest.mark.unit
def test_loading_data_w_filters(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="df1")

    with app.test_client() as c:
        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(
                col="str_val", cfg=json.dumps({"type": "string", "value": ["b"]})
            ),
        )
        response = c.get(
            "/dtale/data/dtale%257Cdf1", query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        expected_results = {
            "0": {
                "dtale_index": 0,
                "float_val": 2.2,
                "index": "2000-01-02",
                "int_val": 2,
                "str_val": "b",
            }
        }
        unittest.assertEqual(response_data["results"], expected_results)
        unittest.assertEqual(response_data["total"], 1)
        unittest.assertEqual(response_data["final_query"], "`str_val` == 'b'")

        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(col="str_val", cfg=json.dumps({"type": "string"})),
        )
        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(
                col="int_val",
                cfg=json.dumps({"type": "int", "value": [3], "operand": "="}),
            ),
        )
        response = c.get(
            "/dtale/data/dtale%257Cdf1", query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        expected_results = {
            "0": {
                "dtale_index": 0,
                "float_val": 3.3,
                "index": "2000-01-03",
                "int_val": 3,
                "str_val": "c",
            }
        }
        unittest.assertEqual(response_data["results"], expected_results)
        unittest.assertEqual(response_data["total"], 1)
        unittest.assertEqual(response_data["final_query"], "`int_val` == 3")

        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(col="int_val", cfg=json.dumps({"type": "int"})),
        )
        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(
                col="float_val",
                cfg=json.dumps({"type": "float", "value": 1.1, "operand": "="}),
            ),
        )
        response = c.get(
            "/dtale/data/dtale%257Cdf1", query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        expected_results = {
            "0": {
                "dtale_index": 0,
                "float_val": 1.1,
                "index": "2000-01-01",
                "int_val": 1,
                "str_val": "a",
            }
        }
        unittest.assertEqual(response_data["results"], expected_results)
        unittest.assertEqual(response_data["total"], 1)
        unittest.assertEqual(response_data["final_query"], "`float_val` == 1.1")

        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(col="float_val", cfg=json.dumps({"type": "float"})),
        )
        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(
                col="index",
                cfg=json.dumps(
                    {"type": "date", "start": "20000101", "end": "20000101"}
                ),
            ),
        )
        response = c.get(
            "/dtale/data/dtale%257Cdf1", query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        unittest.assertEqual(response_data["results"], expected_results)
        unittest.assertEqual(response_data["total"], 1)
        unittest.assertEqual(response_data["final_query"], "`index` == '20000101'")


@pytest.mark.unit
def test_loading_data_w_columns(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="df1")

    with app.test_client() as c:
        c.get(
            "/dtale/save-column-filter/dtale%257Cdf1",
            query_string=dict(
                col="str_val", cfg=json.dumps({"type": "string", "value": ["b"]})
            ),
        )
        c.post(
            "/dtale/update-visibility/dtale%257Cdf1",
            data=json.dumps(dict(toggle="int_val")),
            content_type="application/json",
        )
        response = c.get(
            "/dtale/data/dtale%257Cdf1", query_string=dict(ids=json.dumps(["0"]))
        )
        response_data = response.get_json()
        expected_results = {
            "0": {
                "dtale_index": 0,
                "float_val": 2.2,
                "index": "2000-01-02",
                "str_val": "b",
            }
        }
        unittest.assertEqual(response_data["results"], expected_results)


@pytest.mark.unit
def test_describe(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="df1")

    with app.test_client() as c:
        response = c.get(
            "/dtale/describe/dtale%257Cdf1", query_string=dict(col="int_val")
        )
        response_data = response.get_json()
        unittest.assertEqual(
            response_data["uniques"],
            {
                "int64": {
                    "data": [
                        {"count": 1, "value": 1},
                        {"count": 1, "value": 2},
                        {"count": 1, "value": 3},
                    ],
                    "top": False,
                    "total": 3,
                }
            },
        )


@pytest.mark.unit
def test_large_describe(arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="large_df")

    with app.test_client() as c:
        response = c.get(
            "/dtale/describe/dtale%257Clarge_df", query_string=dict(col="col1")
        )
        response_data = response.get_json()
        assert "uniques" not in response_data


@pytest.mark.unit
def test_column_filter_data(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="df1")

    with app.test_client() as c:
        response = c.get(
            "/dtale/column-filter-data/dtale%257Cdf1", query_string=dict(col="int_val")
        )
        response_data = response.get_json()
        unittest.assertEqual(
            response_data,
            {
                "hasMissing": False,
                "max": 3,
                "min": 1,
                "success": True,
                "uniques": [1, 2, 3],
            },
        )


@pytest.mark.unit
def test_large_column_filter_data(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    from dtale.views import startup

    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")
    startup(data="large_df")

    with app.test_client() as c:
        response = c.get(
            "/dtale/column-filter-data/dtale%257Clarge_df",
            query_string=dict(col="col1"),
        )
        response_data = response.get_json()
        unittest.assertEqual(response_data, {"hasMissing": True, "success": True})


@pytest.mark.unit
def test_get_arcticdb_libraries(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get("/dtale/arcticdb/libraries")
        response_data = response.get_json()
        unittest.assertEqual(
            response_data,
            {
                "libraries": ["dtale"],
                "library": "dtale",
                "async": False,
                "success": True,
            },
        )

    with mock.patch("dtale.global_state.store.load_libraries") as load_libs_mock:
        with app.test_client() as c:
            response = c.get(
                "/dtale/arcticdb/libraries", query_string=dict(refresh="true")
            )
            response_data = response.get_json()
            unittest.assertEqual(response_data["libraries"], ["dtale"])
            load_libs_mock.assert_called_once()

    with mock.patch(
        "dtale.global_state.store._libraries", ["lib{}".format(v) for v in range(501)]
    ):
        with app.test_client() as c:
            response = c.get("/dtale/arcticdb/libraries")
            response_data = response.get_json()
            unittest.assertEqual(
                response_data["libraries"], ["lib0", "lib1", "lib2", "lib3", "lib4"]
            )
            assert response_data["async"]


@pytest.mark.unit
def test_get_arcticdb_async_libraries(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get(
            "/dtale/arcticdb/async-libraries", query_string=dict(input="d")
        )
        response_data = response.get_json()
        unittest.assertEqual(response_data, [{"label": "dtale", "value": "dtale"}])


@pytest.mark.unit
def test_get_arcticdb_symbols(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get("/dtale/arcticdb/dtale/symbols")
        response_data = response.get_json()
        unittest.assertEqual(
            sorted(response_data["symbols"]), ["df1", "large_df", "slashed/df1"]
        )

    with mock.patch("dtale.global_state.store.load_symbols") as load_symbols_mock:
        with app.test_client() as c:
            response = c.get(
                "/dtale/arcticdb/dtale/symbols", query_string=dict(refresh="true")
            )
            response_data = response.get_json()
            unittest.assertEqual(
                sorted(response_data["symbols"]), ["df1", "large_df", "slashed/df1"]
            )
            load_symbols_mock.assert_called_once_with("dtale")

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.global_state.store.load_symbols", mock.Mock(return_value=None)
            )
        )
        stack.enter_context(
            mock.patch(
                "dtale.global_state.store._symbols",
                dict(large_lib=["security{}".format(v) for v in range(501)]),
            )
        )

        with app.test_client() as c:
            response = c.get("/dtale/arcticdb/large_lib/symbols")
            response_data = response.get_json()
            unittest.assertEqual(
                response_data["symbols"],
                ["security0", "security1", "security2", "security3", "security4"],
            )
            assert response_data["async"]


@pytest.mark.unit
def test_get_arcticdb_async_symbols(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get(
            "/dtale/arcticdb/dtale/async-symbols", query_string=dict(input="df")
        )
        response_data = response.get_json()
        unittest.assertEqual(response_data, [{"label": "df1", "value": "df1"}])


@pytest.mark.unit
def test_load_arcticdb_description(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get(
            "/dtale/arcticdb/load-description",
            query_string=dict(library="dtale", symbol="df1"),
        )
        response_data = response.get_json()
        import arcticdb as adb

        new_arcticdb = parse_version(adb.__version__) >= parse_version("2.0.0")
        index_type = "NANOSECONDS_UTC" if new_arcticdb else "MICROS_UTC"
        assert response_data["description"] == (
            "ROWS: 3\nINDEX:\n\t- None ({})\n"
            "COLUMNS (3):\n\t- float_val (FLOAT)\n\t- int_val (INT)\n\t- str_val (DYNAMIC_STRING)\n"
        ).format(index_type)


@pytest.mark.unit
def test_load_arcticdb_symbol(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get(
            "/dtale/arcticdb/load-symbol",
            query_string=dict(library="dtale", symbol="df1"),
        )
        response_data = response.get_json()
        assert response_data["data_id"] == "dtale|df1"

        validate_data_load("dtale|df1", unittest, c)


@pytest.mark.unit
def test_view(arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    import dtale.views as views

    views.startup(data="df1")

    with app.test_client() as c:
        response = c.get("/dtale/main/dtale%257Cdf1")
        html_content = str(response.data)
        assert '<input type="hidden" id="is_arcticdb" value="3" />' in html_content
        assert (
            '<input type="hidden" id="arctic_conn" value="{}" />'.format(arcticdb_path)
            in html_content
        )
        assert '<input type="hidden" id="column_count" value="4" />' in html_content


@pytest.mark.unit
def test_load_url_w_bad_symbol(arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    global_state.use_arcticdb_store(uri=arcticdb_path, library="dtale")

    with app.test_client() as c:
        response = c.get("/dtale/main/dtale%257Cdf2")
        assert "http://localhost:{}/dtale/popup/arcticdb".format(c.port).endswith(
            response.location
        )
