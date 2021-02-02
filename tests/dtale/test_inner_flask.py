import mock
import pytest

from dtale.app import build_app
from tests import ExitStack


@pytest.mark.unit
def test_overriden_route():
    app = build_app(reaper_on=False)

    @app.route("/")
    def hello_world():
        return "hello world"

    with app.test_client() as c:
        resp = c.get("/")
        assert resp.data == b"hello world"


@pytest.mark.unit
def test_failed_override():
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.app.contains_route",
                mock.Mock(side_effect=Exception("test error")),
            )
        )
        app = build_app(reaper_on=False)

        @app.route("/")
        def hello_world():
            return "hello world"

        with app.test_client() as c:
            resp = c.get("/")
            assert resp.status_code == 302
            assert resp.location == "http://localhost:{}/dtale/popup/upload".format(
                c.port
            )
