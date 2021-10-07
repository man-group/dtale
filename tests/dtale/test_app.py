import getpass
from collections import namedtuple

from flask import Flask

import mock
import numpy as np
import os
import pandas as pd
import pandas.util.testing as pdt
import pytest

from tests import ExitStack


@pytest.mark.unit
def test_initialize_process_props():
    from dtale import app

    ups = [True, True, False]

    def mock_is_up(_base):
        if len(ups):
            return ups.pop(0)
        return True

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.is_up", mock_is_up))
        mock_kill = stack.enter_context(mock.patch("dtale.app.kill", mock.Mock()))
        mock_sleep = stack.enter_context(mock.patch("time.sleep", mock.Mock()))
        app.initialize_process_props(host="localhost", port=40000, force=True)
        assert app.ACTIVE_HOST == "localhost"
        assert app.ACTIVE_PORT == 40000
        app.initialize_process_props(host="localhost", port=40000, force=True)
        mock_kill.assert_called_once()
        mock_sleep.assert_called_once()
        assert app.ACTIVE_HOST == "localhost"
        assert app.ACTIVE_PORT == 40000

    app.ACTIVE_PORT = None
    app.ACTIVE_HOST = None

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.is_up", mock_is_up))
        stack.enter_context(
            mock.patch("dtale.app.kill", mock.Mock(side_effect=Exception("test")))
        )
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=40001))
        )
        with pytest.raises(IOError) as excinfo:
            app.initialize_process_props(host="localhost", port=40000, force=True)
        assert (
            "Could not kill process at http://localhost:40000, possibly something else is running at "
            "port 40000. Please try another port."
        ) in str(excinfo)

    app.ACTIVE_PORT = None
    app.ACTIVE_HOST = None


@pytest.mark.unit
def test_find_free_port():
    from dtale.app import find_free_port

    with ExitStack() as stack:
        mock_socket = stack.enter_context(mock.patch("socket.socket", mock.Mock()))

        assert find_free_port() == 40000
        mock_socket.assert_called_once()
        mock_socket.return_value.bind.assert_called_once()

    class MockSocket(object):
        def bind(self, addr):
            (host, port) = addr
            if port == 40000:
                raise Exception("cannot connect!")
            return 1

        def close(self):
            pass

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("socket.socket", mock.Mock(return_value=MockSocket()))
        )
        assert find_free_port() == 40001

    class MockSocket2(object):
        def bind(self, _addr):
            raise Exception("cannot connect!")

        def close(self):
            pass

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("socket.socket", mock.Mock(return_value=MockSocket2()))
        )
        with pytest.raises(IOError) as excinfo:
            find_free_port()
        assert (
            "D-Tale could not find an open port from 40000 to 49000, please increase your range by altering "
            "the environment variables DTALE_MIN_PORT & DTALE_MAX_PORT."
        ) in str(excinfo)


class MockDtaleFlask(Flask):
    def __init__(
        self, import_name, reaper_on=True, url=None, app_root=None, *args, **kwargs
    ):
        kwargs.pop("instance_relative_config", None)
        kwargs.pop("static_url_path", None)
        super(MockDtaleFlask, self).__init__(import_name, *args, **kwargs)

    def run(self, *args, **kwargs):
        pass


@pytest.mark.unit
def test_show(unittest):
    from dtale.app import show, get_instance, instances
    import dtale.views as views
    import dtale.global_state as global_state

    global_state.clear_store()
    instances()
    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        mock_find_free_port = stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(data=test_data, subprocess=False, ignore_duplicate=True)
        assert "http://localhost:9999" == instance._url
        assert "http://localhost:9999/dtale/main/1" == instance.main_url()
        mock_run.assert_called_once()
        mock_find_free_port.assert_called_once()

        pdt.assert_frame_equal(instance.data, test_data)
        tmp = test_data.copy()
        tmp["biz"] = 2.5
        instance.data = tmp
        unittest.assertEqual(
            global_state.get_dtypes(instance._data_id),
            views.build_dtypes_state(tmp),
            "should update app data/dtypes",
        )

        instance2 = get_instance(instance._data_id)
        assert instance2._url == instance._url
        # removed data name test. wait for proper data name implementation.

        instances()

        assert get_instance(20) is None  # should return None for invalid data ids

        instance.kill()
        mock_requests.assert_called_once()
        assert mock_requests.call_args[0][0] == "http://localhost:9999/shutdown"

        instance3 = show(
            data=test_data, subprocess=False, name="It's Here", ignore_duplicate=True
        )
        assert instance3.main_url() == "http://localhost:9999/dtale/main/2"
        pdt.assert_frame_equal(instance3.data, test_data)

    with ExitStack() as stack:
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        mock_find_free_port = stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        mock_data_loader = mock.Mock(return_value=test_data)
        instance = show(
            data_loader=mock_data_loader,
            subprocess=False,
            port=9999,
            force=True,
            debug=True,
            ignore_duplicate=True,
        )
        assert "http://localhost:9999" == instance._url
        mock_run.assert_called_once()
        mock_find_free_port.assert_not_called()
        mock_data_loader.assert_called_once()
        _, kwargs = mock_run.call_args

        assert "9999" in instance._url

    # RangeIndex test
    test_data = pd.DataFrame([1, 2, 3])
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.DtaleFlask", MockDtaleFlask))
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("dtale.app.logger", mock.Mock()))
        instance = show(
            data=test_data, subprocess=False, name="foo", ignore_duplicate=True
        )
        assert np.array_equal(instance.data["0"].values, test_data[0].values)

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.DtaleFlask", MockDtaleFlask))
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("dtale.app.logger", mock.Mock()))
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", mock.Mock(return_value=False))
        )

        get_calls = {"ct": 0}
        getter = namedtuple("get", "ok")

        def mock_requests_get(url, verify=True):
            if url.endswith("/health"):
                is_ok = get_calls["ct"] > 0
                get_calls["ct"] += 1
                return getter(is_ok)
            return getter(True)

        stack.enter_context(mock.patch("requests.get", mock_requests_get))
        mock_display = stack.enter_context(
            mock.patch("IPython.display.display", mock.Mock())
        )
        mock_iframe = stack.enter_context(
            mock.patch("IPython.display.IFrame", mock.Mock())
        )
        instance = show(
            data=test_data,
            subprocess=True,
            name="foo1",
            notebook=True,
            ignore_duplicate=True,
        )
        mock_display.assert_called_once()
        mock_iframe.assert_called_once()
        assert mock_iframe.call_args[0][
            0
        ] == "http://localhost:9999/dtale/iframe/{}".format(instance._data_id)

        assert type(instance.__str__()).__name__ == "str"
        assert type(instance.__repr__()).__name__ == "str"

    class MockDtaleFlaskRunTest(Flask):
        def __init__(
            self, import_name, reaper_on=True, url=None, app_root=None, *args, **kwargs
        ):
            kwargs.pop("instance_relative_config", None)
            kwargs.pop("static_url_path", None)
            super(MockDtaleFlaskRunTest, self).__init__(import_name, *args, **kwargs)

        def run(self, *args, **kwargs):
            assert self.jinja_env.auto_reload
            assert self.config["TEMPLATES_AUTO_RELOAD"]

    with mock.patch("dtale.app.DtaleFlask", MockDtaleFlaskRunTest):
        show(
            data=test_data,
            subprocess=False,
            port=9999,
            debug=True,
            ignore_duplicate=True,
        )

    with mock.patch("dtale.app._thread.start_new_thread", mock.Mock()) as mock_thread:
        show(data=test_data, subprocess=True, ignore_duplicate=True)
        mock_thread.assert_called()

    test_data = pd.DataFrame([dict(a=1, b=2)])

    with ExitStack() as stack:
        mock_build_app = stack.enter_context(
            mock.patch("dtale.app.build_app", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("requests.get", mock.Mock()))
        show(data=test_data, subprocess=False, name="foo2", ignore_duplicate=True)

        _, kwargs = mock_build_app.call_args
        unittest.assertEqual(
            {"app_root": None, "host": "localhost", "reaper_on": True},
            kwargs,
            "build_app should be called with defaults",
        )

    # test adding duplicate column
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.DtaleFlask", MockDtaleFlask))
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=pd.DataFrame([dict(a=1, b=2)]),
            subprocess=False,
            name="foo3",
            ignore_duplicate=True,
        )
        with pytest.raises(Exception):
            instance.data = instance.data.rename(columns={"b": "a"})

        curr_instance_ct = global_state.size()
        show(
            data=pd.DataFrame([dict(a=1, b=2)]),
            subprocess=False,
            name="foo",
            ignore_duplicate=False,
        )
        assert curr_instance_ct == global_state.size()

    # cleanup
    global_state.cleanup()


@pytest.mark.unit
def test_open_browser():
    from dtale.app import show
    import dtale.global_state as global_state

    test_data = pd.DataFrame([dict(a=1, b=2)])

    with ExitStack() as stack:
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(mock.patch("dtale.app.is_up", mock.Mock(return_value=True)))
        mock_data_loader = mock.Mock(return_value=test_data)
        mock_browser_proc = stack.enter_context(mock.patch("subprocess.Popen"))
        mock_webbrowser = stack.enter_context(mock.patch("webbrowser.open"))
        stack.enter_context(
            mock.patch("distutils.spawn.find_executable", mock.Mock(return_value=None))
        )
        stack.enter_context(mock.patch("dtale.env_util.IS_WINDOWS", False))
        stack.enter_context(mock.patch("dtale.env_util.IS_LINUX_OR_BSD", True))
        stack.enter_context(mock.patch("dtale.env_util.IS_DARWIN", False))
        instance = show(
            data_loader=mock_data_loader,
            subprocess=False,
            port=9999,
            open_browser=True,
            ignore_duplicate=True,
        )
        mock_run.assert_not_called()
        mock_webbrowser.assert_called()
        assert mock_webbrowser.mock_calls[0].args[
            0
        ] == "http://localhost:9999/dtale/main/{}".format(instance._data_id)
        mock_browser_proc.reset_mock()
        mock_webbrowser.reset_mock()

        stack.enter_context(
            mock.patch(
                "distutils.spawn.find_executable", mock.Mock(return_value="exists")
            )
        )
        instance.open_browser()
        mock_browser_proc.assert_called()
        assert mock_browser_proc.mock_calls[0].args[0][
            1
        ] == "http://localhost:9999/dtale/main/{}".format(instance._data_id)
        mock_browser_proc.reset_mock()
        mock_webbrowser.reset_mock()

        stack.enter_context(mock.patch("dtale.env_util.IS_WINDOWS", False))
        stack.enter_context(mock.patch("dtale.env_util.IS_LINUX_OR_BSD", False))
        stack.enter_context(mock.patch("dtale.env_util.IS_DARWIN", True))

        instance.open_browser()
        mock_browser_proc.assert_called()
        assert mock_browser_proc.mock_calls[0].args[0][
            1
        ] == "http://localhost:9999/dtale/main/{}".format(instance._data_id)
        mock_browser_proc.reset_mock()
        mock_webbrowser.reset_mock()

        stack.enter_context(mock.patch("dtale.env_util.IS_WINDOWS", True))
        stack.enter_context(mock.patch("dtale.env_util.IS_LINUX_OR_BSD", False))
        stack.enter_context(mock.patch("dtale.env_util.IS_DARWIN", False))

        instance.open_browser()
        mock_webbrowser.assert_called()
        assert mock_webbrowser.mock_calls[0].args[
            0
        ] == "http://localhost:9999/dtale/main/{}".format(instance._data_id)

    global_state.cleanup()


@pytest.mark.unit
def test_show_ngrok(unittest, builtin_pkg):
    from dtale.app import show, get_instance, instances
    import dtale.views as views
    import dtale.global_state as global_state

    orig_import = __import__
    mock_flask_ngrok = mock.Mock()
    mock_flask_ngrok._run_ngrok = lambda: "ngrok_host"

    def import_mock(name, *args, **kwargs):
        if name == "flask_ngrok":
            return mock_flask_ngrok
        return orig_import(name, *args, **kwargs)

    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        stack.enter_context(mock.patch("dtale.app.USE_NGROK", True))
        stack.enter_context(mock.patch("dtale.app.PY3", True))
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=test_data, subprocess=False, name="foo", ignore_duplicate=True
        )
        assert "http://ngrok_host" == instance._url
        mock_run.assert_called_once()

        pdt.assert_frame_equal(instance.data, test_data)
        tmp = test_data.copy()
        tmp["biz"] = 2.5
        instance.data = tmp
        unittest.assertEqual(
            global_state.get_dtypes(instance._data_id),
            views.build_dtypes_state(tmp),
            "should update app data/dtypes",
        )

        instance2 = get_instance(instance._data_id)
        assert instance2._url == instance._url
        instances()

        assert get_instance(20) is None  # should return None for invalid data ids

        instance.kill()
        mock_requests.assert_called_once()
        assert mock_requests.call_args[0][0] == "http://ngrok_host/shutdown"
        # assert global_state.get_name(1) == "foo"

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.USE_NGROK", True))
        stack.enter_context(mock.patch("dtale.app.PY3", False))
        with pytest.raises(Exception):
            show(data=test_data)


@pytest.mark.unit
def test_show_jupyter_server_proxy(unittest):
    from dtale.app import show, get_instance, instances
    import dtale.views as views
    import dtale.global_state as global_state

    global_state.clear_store()
    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", True))
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=test_data, subprocess=False, name="foo", ignore_duplicate=True
        )
        assert "/user/{}/proxy/40000".format(getpass.getuser()) == instance._url
        mock_run.assert_called_once()

        pdt.assert_frame_equal(instance.data, test_data)
        tmp = test_data.copy()
        tmp["biz"] = 2.5
        instance.data = tmp
        unittest.assertEqual(
            global_state.get_dtypes(instance._data_id),
            views.build_dtypes_state(tmp),
            "should update app data/dtypes",
        )

        instance2 = get_instance(instance._data_id)
        assert instance2._url == instance._url
        instances()

        assert get_instance(20) is None  # should return None for invalid data ids

        instance.kill()
        mock_requests.assert_called_once()
        assert mock_requests.call_args[0][0] == "/user/{}/proxy/40000/shutdown".format(
            getpass.getuser()
        )

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", True))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=test_data,
            subprocess=False,
            ignore_duplicate=True,
            app_root="/custom_root/",
        )
        assert "/custom_root/40000" == instance._url
        mock_run.assert_called_once()

        instance2 = get_instance(instance._data_id)
        # this is a known bug where get_instance will not work if you've specified an `app_root' in show()
        assert not instance2._url == instance._url
        instances()
        instance.kill()
        mock_requests.assert_called_once()
        assert mock_requests.call_args[0][0] == "/custom_root/40000/shutdown"


@pytest.mark.unit
def test_DtaleFlask():
    from dtale.app import DtaleFlask, REAPER_TIMEOUT

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch("flask.Flask.run", mock.Mock()))
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        mock_timer = stack.enter_context(mock.patch("dtale.app.Timer"))

        tmp = DtaleFlask("dtale", static_url_path="", url="http://test:9999")
        tmp.run(port="9999")

        assert tmp.reaper_on
        assert tmp.shutdown_url == "http://test:9999/shutdown"
        mock_timer.assert_called_once()
        args, _ = mock_timer.call_args
        assert args[0] == REAPER_TIMEOUT
        mock_run.assert_called_once()
        assert tmp.reaper is not None
        timer_instance = mock_timer.return_value
        timer_instance.start.assert_called_once()

        tmp.clear_reaper()
        timer_instance.cancel.assert_called_once()

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch("flask.Flask.run", mock.Mock()))
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        mock_timer = stack.enter_context(mock.patch("dtale.app.Timer", mock.Mock()))

        tmp = DtaleFlask("dtale", static_url_path="", reaper_on=False)
        tmp.run(port="9999")

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch("flask.Flask.run", mock.Mock()))
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        mock_timer = stack.enter_context(mock.patch("dtale.app.Timer", mock.Mock()))

        tmp = DtaleFlask("dtale", static_url_path="")
        tmp.run(debug=True, port="9999")

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        tmp = DtaleFlask(
            "dtale", static_url_path="", url="http://test:9999", app_root="/test_route/"
        )
        assert tmp.url_for("static", "test_path") == "/test_route/test_path"
        assert (
            tmp.url_for("static", "test_path", filename="test_file")
            == "/test_route/test_file"
        )


def test_build_startup_url_and_app_root():
    from dtale.app import build_startup_url_and_app_root

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", True))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        url, app_root = build_startup_url_and_app_root()

        assert url == "/user/{}/proxy/40000".format(getpass.getuser())
        assert app_root == "/user/{}/proxy/40000".format(getpass.getuser())
        url, app_root = build_startup_url_and_app_root("/test_route/")
        assert url == "/test_route/40000"
        assert app_root == "/test_route/40000"

        os.environ["JUPYTERHUB_SERVICE_PREFIX"] = "/user/foo"
        url, app_root = build_startup_url_and_app_root()
        assert url == "/user/foo/proxy/40000"
        assert app_root == "/user/foo/proxy/40000"

        del os.environ["JUPYTERHUB_SERVICE_PREFIX"]

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", False))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        url, app_root = build_startup_url_and_app_root()
        assert url == "http://localhost:40000"
        assert app_root is None
        url, app_root = build_startup_url_and_app_root("/test_route/")
        assert url == "http:/localhost:40000/test_route/"
        assert app_root == "/test_route/"


@pytest.mark.unit
def test_show_columns():
    import dtale.global_state as global_state
    from dtale.app import show

    global_state.clear_store()
    df = pd.DataFrame(dict(a=[1, 2], b=[2, 3]))
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.DtaleFlask", MockDtaleFlask))
        stack.enter_context(mock.patch("dtale.app.DtaleFlask.run", mock.Mock()))
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=df, ignore_duplicate=True, show_columns=["a"], subprocess=False
        )
        assert global_state.get_dtypes(instance._data_id)[0]["visible"] is True
        assert not global_state.get_dtypes(instance._data_id)[1]["visible"] is True


@pytest.mark.unit
def test_hide_columns():
    from dtale.app import show
    import dtale.global_state as global_state

    global_state.clear_store()
    df = pd.DataFrame(dict(a=[1, 2], b=[2, 3]))
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.DtaleFlask", MockDtaleFlask))
        stack.enter_context(mock.patch("dtale.app.DtaleFlask.run", mock.Mock()))
        stack.enter_context(
            mock.patch("dtale.app.find_free_port", mock.Mock(return_value=9999))
        )
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="localhost"))
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=df, ignore_duplicate=True, hide_columns=["b"], subprocess=False
        )
        assert global_state.get_dtypes(instance._data_id)[0]["visible"] is True
        assert not global_state.get_dtypes(instance._data_id)[1]["visible"] is True
