import os
import sys
from imp import reload

import mock
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

from dtale.cli import loaders, script
from dtale.cli.clickutils import run
from tests import ExitStack


@pytest.mark.unit
def test_main(unittest):

    props = [
        "host",
        "port",
        "debug",
        "subprocess",
        "data_loader",
        "reaper_on",
        "show_columns",
        "hide_columns",
        "sort",
    ]
    with mock.patch("dtale.cli.script.show", mock.Mock()) as mock_show:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")
        args = ["--host", "test", "--port", "9999", "--csv-path", csv_path]
        args += ["--show-columns", "a,b", "--hide-columns", "c", "--sort", "a|ASC"]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        (
            host,
            port,
            debug,
            subprocess,
            data_loader,
            reaper_on,
            show_columns,
            hide_columns,
            sort,
        ) = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        unittest.assertEqual(show_columns, ["a", "b"])
        unittest.assertEqual(hide_columns, ["c"])
        unittest.assertEqual(sort, [("a", "ASC")])

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        mock_find_free_port = stack.enter_context(
            mock.patch("dtale.cli.script.find_free_port", mock.Mock(return_value=9999))
        )
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")
        args = ["--csv-path", csv_path, "--debug", "--no-reaper"]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        mock_find_free_port.assert_called_once()
        _, kwargs = mock_show.call_args
        (
            host,
            port,
            debug,
            subprocess,
            data_loader,
            reaper_on,
            show_columns,
            hide_columns,
            sort,
        ) = map(kwargs.get, props)
        assert host is None
        assert not subprocess
        assert debug
        assert port == 9999
        assert not reaper_on
        assert data_loader is not None
        assert show_columns is None
        assert hide_columns is None
        assert sort is None
        df = data_loader()
        pdt.assert_frame_equal(
            df, pd.DataFrame([dict(a=1, b=2, c=3)]), "loader should load csv"
        )

    if PY3:
        with ExitStack() as stack:
            mock_show = stack.enter_context(
                mock.patch("dtale.cli.script.show", mock.Mock())
            )
            mock_find_free_port = stack.enter_context(
                mock.patch(
                    "dtale.cli.script.find_free_port", mock.Mock(return_value=9999)
                )
            )
            xlsx_path = os.path.join(
                os.path.dirname(__file__), "..", "data/test_df.xlsx"
            )
            args = ["--excel-path", xlsx_path, "--debug", "--no-reaper"]
            script.main(args, standalone_mode=False)
            mock_show.assert_called_once()
            mock_find_free_port.assert_called_once()
            _, kwargs = mock_show.call_args
            (
                host,
                port,
                debug,
                subprocess,
                data_loader,
                reaper_on,
                show_columns,
                hide_columns,
                sort,
            ) = map(kwargs.get, props)
            assert host is None
            assert not subprocess
            assert debug
            assert port == 9999
            assert not reaper_on
            assert data_loader is not None
            assert show_columns is None
            assert hide_columns is None
            assert sort is None
            df = data_loader()
            pdt.assert_frame_equal(
                df, pd.DataFrame([dict(a=1, b=2, c=3)]), "loader should load xlsx"
            )

    with mock.patch("dtale.cli.script.show", mock.Mock()) as mock_show:
        json_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.json")
        args = ["--host", "test", "--port", "9999", "--json-path", json_path]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        (
            host,
            port,
            debug,
            subprocess,
            data_loader,
            reaper_on,
            show_columns,
            hide_columns,
            sort,
        ) = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert show_columns is None
        assert hide_columns is None
        assert sort is None
        df = data_loader()
        pdt.assert_frame_equal(
            df, pd.DataFrame([dict(a=1, b=2, c=3)]), "loader should load json"
        )

    pytest.importorskip("pyarrow")

    with mock.patch("dtale.cli.script.show", mock.Mock()) as mock_show:
        parquet_path = os.path.join(
            os.path.dirname(__file__), "..", "data/test_df.parquet"
        )
        args = ["--host", "test", "--port", "9999", "--parquet-path", parquet_path]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        (
            host,
            port,
            debug,
            subprocess,
            data_loader,
            reaper_on,
            show_columns,
            hide_columns,
            sort,
        ) = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert show_columns is None
        assert hide_columns is None
        assert sort is None
        df = data_loader()
        pdt.assert_frame_equal(
            df,
            pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6])),
            "loader should load parquet",
        )


@pytest.mark.unit
def test_sqlite_loader():
    props = ["host", "port", "debug", "subprocess", "data_loader", "reaper_on"]
    with mock.patch("dtale.cli.script.show", mock.Mock()) as mock_show:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test.sqlite3")
        args = [
            "--host",
            "test",
            "--port",
            "9999",
            "--sqlite-path",
            csv_path,
            "--sqlite-table",
            "test_simpsons",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        df = data_loader()
        assert len(df) == 5


@pytest.mark.xfail(reason="there are issues trying to install mongo on circleci")
def test_arctic_loader_integration(
    mongo_host, library_name, library, chunkstore_name, chunkstore_lib
):

    node = pd.DataFrame(
        [
            {"date": pd.Timestamp("20000101"), "a": 1, "b": 1.0},
            {"date": pd.Timestamp("20000102"), "a": 2, "b": 2.0},
        ]
    ).set_index(["date", "a"])
    chunkstore_lib.write("test_node", node)

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        args = [
            "--port",
            "9999",
            "--arctic-host",
            mongo_host,
            "--arctic-library",
            chunkstore_name,
            "--arctic-node",
            "test_node",
            "--arctic-start",
            "20000101",
            "--arctic-end",
            "20000102",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        pdt.assert_frame_equal(kwargs["data_loader"](), node)

    node2 = pd.DataFrame(
        [
            {"date": pd.Timestamp("20000101"), "a": 1, "b": 1.0},
            {"date": pd.Timestamp("20000102"), "a": 2, "b": 2.0},
        ]
    ).set_index(["date", "a"])
    library.write("test_node2", node2)
    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        args = [
            "--port",
            "9999",
            "--arctic-host",
            mongo_host,
            "--arctic-library",
            library_name,
            "--arctic-node",
            "test_node2",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        pdt.assert_frame_equal(kwargs["data_loader"](), node2)


@pytest.mark.unit
def test_artic_loader(builtin_pkg):
    node = pd.DataFrame(
        [
            {"date": pd.Timestamp("20000101"), "a": 1, "b": 1.0},
            {"date": pd.Timestamp("20000102"), "a": 2, "b": 2.0},
        ]
    ).set_index(["date", "a"])

    orig_import = __import__

    with ExitStack() as stack:
        mock_arctic = mock.MagicMock()

        class MockVersionedItem(object):
            __name__ = "VersionedItem"

            def __init__(self):
                self.data = node
                pass

        def import_mock(name, *args, **kwargs):
            if name == "arctic":
                return mock_arctic
            if name == "arctic.store.versioned_item":
                return mock_versioned_item
            return orig_import(name, *args, **kwargs)

        mock_arctic_class = mock.MagicMock()
        mock_arctic.Arctic.return_value = mock_arctic_class
        mock_arctic_lib = mock.MagicMock()
        mock_arctic_lib.read = mock.Mock(return_value=MockVersionedItem())
        mock_arctic_class.get_library = mock.Mock(return_value=mock_arctic_lib)
        mock_versioned_item = mock.Mock()
        mock_versioned_item.VersionedItem = MockVersionedItem

        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        args = [
            "--port",
            "9999",
            "--arctic-host",
            "test_host",
            "--arctic-library",
            "test_lib",
            "--arctic-node",
            "test_node",
            "--arctic-start",
            "20000101",
            "--arctic-end",
            "20000102",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        output = kwargs["data_loader"]()
        pdt.assert_frame_equal(output, node)
        mock_arctic.Arctic.assert_called_with("test_host")
        mock_arctic_class.get_library.assert_called_with("test_lib")
        read_call = mock_arctic_lib.read.mock_calls[0]
        assert read_call.args[0] == "test_node"
        assert "chunk_range" in read_call.kwargs

        mock_arctic.reset_mock()
        mock_arctic_lib.reset_mock()
        mock_arctic_class.reset_mock()
        mock_show.reset_mock()

        args = [
            "--port",
            "9999",
            "--arctic-host",
            "test_host",
            "--arctic-library",
            "test_lib",
            "--arctic-node",
            "test_node2",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        pdt.assert_frame_equal(kwargs["data_loader"](), node)
        mock_arctic.Arctic.assert_called_with("test_host")
        mock_arctic_class.get_library.assert_called_with("test_lib")
        mock_arctic_lib.read.assert_called_with("test_node2")


@pytest.mark.unit
def test_arctic_import_error(builtin_pkg):
    orig_import = __import__

    def import_mock(name, *args, **kwargs):
        if name.startswith("arctic"):
            raise ImportError()
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.build_app", mock.Mock()))
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        args = [
            "--port",
            "9999",
            "--arctic-host",
            "arctic_host",
            "--arctic-library",
            "arctic_lib",
            "--arctic-node",
            "arctic_node",
            "--arctic-start",
            "20000101",
            "--arctic-end",
            "20000102",
        ]
        with pytest.raises(ImportError) as error:
            script.main(args, standalone_mode=False)
        assert "In order to use the arctic loader you must install arctic!" in str(
            error
        )


@pytest.mark.unit
def test_arctic_version_data(builtin_pkg):
    orig_import = __import__
    mock_arctic = mock.Mock()

    class MockVersionedItem(object):
        __name__ = "VersionedItem"

        def __init__(self):
            self.data = "versioned_data"
            pass

    class MockArcticLibrary(object):
        def __init__(self, *args, **kwargs):
            pass

        def read(self, *args, **kwargs):
            return MockVersionedItem()

    class MockArctic(object):
        __name__ = "Arctic"

        def __init__(self, *args, **kwargs):
            pass

        def get_library(self, *args, **kwargs):
            return MockArcticLibrary()

    mock_arctic.Arctic = MockArctic
    mock_versioned_item = mock.Mock()
    mock_versioned_item.VersionedItem = MockVersionedItem

    def import_mock(name, *args, **kwargs):
        if name == "arctic":
            return mock_arctic
        if name == "arctic.store.versioned_item":
            return mock_versioned_item
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        args = [
            "--port",
            "9999",
            "--arctic-host",
            "arctic_host",
            "--arctic-library",
            "arctic_lib",
            "--arctic-node",
            "arctic_node",
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        assert kwargs["data_loader"]() == "versioned_data"

    with ExitStack() as stack:
        import dtale

        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        stack.enter_context(
            mock.patch("dtale.cli.loaders.arctic_loader.show", mock.Mock())
        )

        dtale.show_arctic(host="arctic_host", library="arctic_lib", node="arctic_node")


@pytest.mark.unit
def test_run():
    props = ["host", "port", "debug", "subprocess", "data_loader", "reaper_on"]
    with ExitStack() as stack:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")
        args = [
            "dtale.cli.py",
            "--host",
            "test",
            "--port",
            "9999",
            "--csv-path",
            csv_path,
            "--log-level",
            "info",
        ]
        stack.enter_context(mock.patch("sys.argv", args))
        mock_exit = stack.enter_context(mock.patch("sys.exit", mock.Mock()))
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        run(script.main)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert mock_exit.called_with(0)

    with ExitStack() as stack:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")
        args = [
            "dtale.cli.py",
            "--host",
            "test",
            "--port",
            "9999",
            "--csv-path",
            csv_path,
        ]
        stack.enter_context(mock.patch("sys.argv", args))
        mock_exit = stack.enter_context(mock.patch("sys.exit", mock.Mock()))
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock(side_effect=Exception()))
        )
        run(script.main)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == "test"
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert mock_exit.called_with(1)


@pytest.mark.unit
def test_custom_cli_loaders():

    custom_loader_path = os.path.join(os.path.dirname(__file__), "..", "data")
    os.environ["DTALE_CLI_LOADERS"] = custom_loader_path

    reload(loaders)
    reload(script)

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        args = ["--port", "9999", "--testcli"]

        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        pdt.assert_frame_equal(
            kwargs["data_loader"](), pd.DataFrame([dict(security_id=1, foo=1.5)])
        )

        mock_show.reset_mock()
        args = ["--port", "9999", "--testcli2-prop", "foo"]
        script.main(args, standalone_mode=False)
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        pdt.assert_frame_equal(
            kwargs["data_loader"](), pd.DataFrame([dict(security_id=1, foo="foo")])
        )


@pytest.mark.unit
def test_loader_retrieval():
    from dtale.cli.loaders import custom_module_loader

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "platform.python_version_tuple", mock.Mock(return_value=(2, 7, 3))
            )
        )
        mock_loader = stack.enter_context(
            mock.patch("dtale.cli.loaders.get_py2_loader", mock.Mock())
        )
        custom_module_loader()("custom.loaders", "loader.py")
        assert mock_loader.called_once()

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "platform.python_version_tuple", mock.Mock(return_value=(3, 0, 0))
            )
        )
        with pytest.raises(Exception) as error:
            custom_module_loader()
            assert error.startswith(
                "Unsupported version of python used for custom CLI loaders, (3, 0, 0)."
            )

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "platform.python_version_tuple", mock.Mock(return_value=(3, 3, 0))
            )
        )
        mock_loader = stack.enter_context(
            mock.patch("dtale.cli.loaders.get_py33_loader", mock.Mock())
        )
        custom_module_loader()("custom.loaders", "loader.py")
        assert mock_loader.called_once()

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "platform.python_version_tuple", mock.Mock(return_value=(3, 6, 1))
            )
        )
        mock_loader = stack.enter_context(
            mock.patch("dtale.cli.loaders.get_py35_loader", mock.Mock())
        )
        custom_module_loader()("custom.loaders", "loader.py")
        assert mock_loader.called_once()


@pytest.mark.unit
def test_loader_retrievers(builtin_pkg):
    from dtale.cli.loaders import get_py35_loader, get_py33_loader, get_py2_loader

    orig_import = __import__
    mock_importlib_util = mock.Mock()
    mock_importlib_machinery = mock.Mock()
    mock_imp = mock.Mock()

    def import_mock(name, *args, **kwargs):
        if name == "importlib.util":
            return mock_importlib_util
        if name == "importlib.machinery":
            return mock_importlib_machinery
        if name == "imp":
            return mock_imp
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )

        assert get_py35_loader("custom.loaders", "loader.py") is not None
        assert mock_importlib_util.spec_from_file_location.called_once()
        mock_spec = mock_importlib_util.spec_from_file_location.return_value
        assert mock_importlib_util.module_from_spec.called_once()
        mock_loader = mock_spec.loader.return_value
        assert mock_loader.exec_module.called_once()
        assert get_py33_loader("custom.loaders", "loader.py") is not None
        assert mock_importlib_machinery.SourceFileLoader.called_once()
        mock_sourcefileloader = mock_importlib_machinery.SourceFileLoader.return_value
        assert mock_sourcefileloader.load_module.called_once()
        assert get_py2_loader("custom.loaders", "loader.py") is not None
        assert mock_imp.load_source.called_once()


@pytest.mark.unit
def test_streamlit(unittest):
    pytest.importorskip("streamlit")

    with ExitStack() as stack:
        build_app_mock = stack.enter_context(
            mock.patch("dtale.app.build_app", mock.Mock())
        )
        start_listening_mock = stack.enter_context(
            mock.patch("streamlit.server.server.start_listening", mock.Mock())
        )

        import dtale.cli.streamlit_script as streamlit_script

        mock_app = mock.MagicMock()
        streamlit_script.streamlit_server.start_listening(mock_app)

        build_app_mock.assert_called_with(reaper_on=False)
        start_listening_mock.assert_called_with(mock_app)
        unittest.assertEqual(
            sys.argv[-4:],
            ["--server.enableCORS", "false", "--server.enableXsrfProtection", "false"],
        )


@pytest.mark.skipif(not PY3, reason="requires python 3 or higher")
def test_r_loader_integration(unittest):
    pytest.importorskip("rpy2")

    path = os.path.join(os.path.dirname(__file__), "..", "data", "admissions.rda")

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.script.show", mock.Mock())
        )
        args = ["--port", "9999", "--r-path", path]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs["data_loader"] is not None
        df = kwargs["data_loader"]()
        unittest.assertEqual(
            list(df.columns), ["major", "gender", "admitted", "applicants"]
        )
        assert len(df) == 12
        unittest.assertEqual(
            df.to_dict(orient="records")[0],
            dict(major="A", gender="men", admitted=62, applicants=825),
        )
