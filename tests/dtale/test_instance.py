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
