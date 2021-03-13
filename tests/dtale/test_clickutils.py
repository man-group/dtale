import logging
from builtins import getattr

import mock
import pytest

from dtale.cli.clickutils import (
    get_loader_options,
    loader_options,
    retrieve_meta_info_and_version,
    setup_logging,
)
from tests import ExitStack


@pytest.mark.unit
def test_setup_logging():

    with ExitStack() as stack:
        mock_fh = stack.enter_context(mock.patch("logging.FileHandler", mock.Mock()))
        mock_lbc = stack.enter_context(mock.patch("logging.basicConfig", mock.Mock()))
        stack.enter_context(mock.patch("sys.argv", ["test"]))
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        mock_linf = stack.enter_context(mock.patch("logging.info", mock.Mock()))
        stack.enter_context(mock.patch("logging.getLogger", mock.Mock()))
        setup_logging(None, None)
        mock_fh.assert_not_called()
        mock_lbc.has_call(
            mock.call(
                format="%(asctime)s - %(levelname)-8s - %(message)s", level=logging.INFO
            )
        )
        mock_linf.has_call(mock.call("test"))
        mock_linf.has_call(mock.call("Hostname: test"))

    with ExitStack() as stack:
        mock_fh = stack.enter_context(mock.patch("logging.FileHandler", mock.Mock()))
        mock_lbc = stack.enter_context(mock.patch("logging.basicConfig", mock.Mock()))
        stack.enter_context(mock.patch("logging.getLogger", mock.Mock()))
        stack.enter_context(mock.patch("sys.argv", ["test"]))
        stack.enter_context(
            mock.patch("socket.gethostname", mock.Mock(return_value="test"))
        )
        setup_logging("test_log", None, verbose=True)
        mock_fh.assert_called_once()
        mock_lbc.has_call(
            mock.call(
                format="%(asctime)s - %(levelname)-8s - %(message)s",
                level=logging.DEBUG,
            )
        )

        for level in ["debug", "info", "warning", "error", "critical"][::-1]:
            setup_logging(None, level)
            mock_lbc.has_call(
                mock.call(
                    format="%(asctime)s - %(levelname)-8s - %(message)s",
                    level=getattr(logging, level.upper()),
                )
            )

    with ExitStack() as stack:
        mock_fh = stack.enter_context(mock.patch("logging.FileHandler", mock.Mock()))
        mock_lbc = stack.enter_context(mock.patch("logging.basicConfig", mock.Mock()))
        stack.enter_context(mock.patch("logging.getLogger", mock.Mock()))
        stack.enter_context(mock.patch("sys.argv", ["test"]))
        stack.enter_context(
            mock.patch(
                "socket.gethostname",
                mock.Mock(side_effect=Exception("hostname exception")),
            )
        )
        mock_linf = stack.enter_context(mock.patch("logging.info", mock.Mock()))
        setup_logging(None, None, verbose=True)
        mock_fh.assert_not_called()
        mock_lbc.has_call(
            mock.call(
                format="%(asctime)s - %(levelname)-8s - %(message)s",
                level=logging.DEBUG,
            )
        )
        mock_linf.has_call(mock.call("hostname exception"))


@pytest.mark.unit
def test_loader_options():
    opts = loader_options("test", ["prop1", "prop2"])

    def _options_test(prop1=None, prop2=None):
        return prop1 + prop2

    decorated_f = opts(_options_test)
    assert ["test_prop1", "test_prop2"] == [
        o.name for o in decorated_f.__click_params__
    ]


@pytest.mark.unit
def test_get_loader_options():
    ret = get_loader_options("foo", None, dict(foo_bar=1, baz_bar=2, biz=3))
    assert len(ret) == 0
    ret = get_loader_options("foo", ["bar"], dict(foo_bar=1, baz_bar=2, biz=3))
    assert ret["bar"] == 1
    ret = get_loader_options(
        "foo", [dict(name="bar")], dict(foo_bar=1, baz_bar=2, biz=3)
    )
    assert ret["bar"] == 1


@pytest.mark.unit
def test_retrieve_meta_info_and_version():
    class MockDist(object):
        def __init__(self):
            self.version = "1.0.0"

        def _get_metadata(self, pkg_info):
            raise Exception()

    with mock.patch(
        "pkg_resources.get_distribution", mock.Mock(return_value=MockDist())
    ):
        meta_info, version = retrieve_meta_info_and_version("foo")
        assert meta_info is None
        assert version == "1.0.0"
