from collections import namedtuple

import mock
import pandas as pd
import pytest

from dtale.dash_application.charts import get_url_parser
from tests import ExitStack
from tests.dtale import build_data_inst


@pytest.mark.unit
def test_ipython_import_error(builtin_pkg):
    from dtale.views import DtaleData

    orig_import = __import__

    def import_mock(name, *args, **kwargs):
        if name in ["IPython", "IPython.display"]:
            raise ImportError
        return orig_import(name, *args, **kwargs)

    df = pd.DataFrame([1, 2, 3])
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=False)
        )
        build_data_inst({9999: df})
        getter = namedtuple("get", "ok")
        stack.enter_context(
            mock.patch("dtale.app.requests.get", return_value=getter(False))
        )
        instance = DtaleData(9999, "http://localhost:9999")

        assert not instance.is_up()
        assert instance._build_iframe() is None
        assert instance.notebook() == df.__repr__()
        assert str(instance) == str(df)
        assert instance.__repr__() == "http://localhost:9999/dtale/main/9999"
        instance.adjust_cell_dimensions(width=5, height=5)

        instance._notebook_handle = mock.Mock()
        instance._build_iframe = mock.Mock()
        instance.adjust_cell_dimensions(width=5, height=5)
        instance._notebook_handle.update.assert_called_once()
        instance._build_iframe.assert_called_once()
        assert {"width": 5, "height": 5} == instance._build_iframe.call_args[1]

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=True)
        )
        build_data_inst({9999: df})
        instance = DtaleData(9999, "http://localhost:9999")

        instance.notebook = mock.Mock()
        assert str(instance) == ""
        instance.notebook.assert_called_once()
        instance.notebook.reset_mock()
        assert instance.__repr__() is None
        instance.notebook.assert_called_once()


@pytest.mark.unit
def test_ipython_notebook_funcs():
    from dtale.views import DtaleData

    getter = namedtuple("get", "ok")

    def mock_requests_get(url, verify=True):
        return getter(True)

    df = pd.DataFrame([1, 2, 3])
    with ExitStack() as stack:
        mock_iframe = stack.enter_context(
            mock.patch("IPython.display.IFrame", mock.Mock())
        )
        stack.enter_context(mock.patch("requests.get", mock_requests_get))
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=True)
        )
        build_data_inst({9999: df})
        instance = DtaleData(9999, "http://localhost:9999")
        instance.notebook_correlations(col1="col1", col2="col2")
        mock_iframe.assert_called_once()

        url_parser = get_url_parser()
        [path, query] = mock_iframe.call_args[0][0].split("?")
        assert path == "http://localhost:9999/dtale/popup/correlations/9999"
        assert dict(url_parser(query)) == dict(col1="col1", col2="col2")

        instance.notebook_charts(
            x="col1", y="col2", group=["col3", "col4"], agg="count"
        )
        [path, query] = mock_iframe.call_args[0][0].split("?")
        assert path == "http://localhost:9999/dtale/charts/9999"
        assert dict(url_parser(query)) == dict(
            chart_type="line",
            agg="count",
            group='["col3", "col4"]',
            x="col1",
            y='["col2"]',
            cpg="false",
            cpy="false",
            animate="false",
        )

        instance.notebook_charts(x="col1", y="col2", agg="count")
        [_path, query] = mock_iframe.call_args[0][0].split("?")
        assert dict(url_parser(query)) == dict(
            chart_type="line",
            agg="count",
            x="col1",
            y='["col2"]',
            cpg="false",
            cpy="false",
            animate="false",
        )

        instance.notebook_charts(x="col1", y="col2", group=["col3", "col4"])
        [_path, query] = mock_iframe.call_args[0][0].split("?")
        assert dict(url_parser(query)) == dict(
            chart_type="line",
            x="col1",
            y='["col2"]',
            group='["col3", "col4"]',
            cpg="false",
            cpy="false",
            animate="false",
        )


@pytest.mark.unit
def test_jupyter_server_proxy_kill():
    from dtale.views import DtaleData

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "foo"))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", True))
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=True)
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = DtaleData(9999, "user/root/proxy/9999")
        instance.kill()
        mock_requests.assert_called_once_with("http://foo:40000/shutdown")


@pytest.mark.unit
def test_jupyter_server_proxy_is_proxy():
    from dtale.views import DtaleData

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "foo"))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.JUPYTER_SERVER_PROXY", True))
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=True)
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = DtaleData(
            9999,
            "user/root/proxy/40000",
            is_proxy=True,
            app_root="user/root/proxy/40000",
        )
        assert instance.build_main_url() == "user/root/proxy/40000/dtale/main/9999"
        instance.kill()
        mock_requests.assert_called_once_with("http://foo:40000/shutdown")


@pytest.mark.unit
def test_cleanup():
    from dtale.views import DtaleData

    with ExitStack() as stack:
        mock_cleanup = stack.enter_context(mock.patch("dtale.global_state.cleanup"))
        instance = DtaleData(9999, "user/root/proxy/9999")
        instance.cleanup()
        mock_cleanup.assert_called_once_with(9999)


@pytest.mark.unit
def test_started_with_open_browser():
    from dtale.views import DtaleData

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("dtale.views.in_ipython_frontend", return_value=True)
        )
        instance = DtaleData(9999, "user/root/proxy/9999")
        instance.started_with_open_browser = True
        assert instance.__str__() == ""
        assert instance.started_with_open_browser is False

        instance.started_with_open_browser = True
        assert instance.__repr__() == ""
        assert instance.started_with_open_browser is False


@pytest.mark.unit
def test_settings_management():
    from dtale.views import DtaleData

    with ExitStack() as stack:
        mock_get_settings = stack.enter_context(
            mock.patch("dtale.global_state.get_settings")
        )
        mock_set_settings = stack.enter_context(
            mock.patch("dtale.global_state.set_settings")
        )
        instance = DtaleData(9999, "user/root/proxy/9999")
        instance.update_settings(range_highlights={})
        mock_get_settings.assert_called_once_with(9999)
        mock_set_settings.assert_called_once_with(9999, dict(rangeHighlight={}))
        mock_get_settings.reset_mock()
        instance.get_settings()
        mock_get_settings.assert_called_once_with(9999)
