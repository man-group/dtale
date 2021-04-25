import mock
import pandas as pd
import pytest

from dtale.app import build_app
from tests import ExitStack
from tests.dtale.test_views import URL
from tests.dtale import build_data_inst


@pytest.mark.unit
def test_status_codes():
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.auth.global_state.get_auth_settings",
                return_value={"active": True, "username": "foo", "password": "bar"},
            )
        )
        with build_app(url=URL).test_client() as c:
            resp = c.get("/login")
            assert resp.status_code == 200
            resp = c.get("/logout")
            assert resp.status_code == 302

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.auth.global_state.get_auth_settings",
                return_value={
                    "active": False,
                },
            )
        )
        with build_app(url=URL).test_client() as c:
            resp = c.get("/login")
            assert resp.status_code == 404
            resp = c.get("/logout")
            assert resp.status_code == 404


@pytest.mark.unit
def test_login():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.auth.global_state.get_auth_settings",
                return_value={"active": True, "username": "foo", "password": "bar"},
            )
        )
        mock_session = stack.enter_context(mock.patch("dtale.auth.session", dict()))
        with build_app(url=URL).test_client() as c:
            build_data_inst({c.port: df})

            resp = c.get("/dtale/static/css/main.css")
            assert resp.status_code == 200

            resp = c.get("/dtale/main/{}".format(c.port))
            assert resp.status_code == 302
            assert resp.location == "http://localhost:{}/login".format(c.port)

            resp = c.post("/login", data=dict(username="foo", password="bar"))
            assert resp.location == "http://localhost:{}/dtale/main/{}".format(
                c.port, c.port
            )
            assert mock_session["logged_in"]
            assert mock_session["username"] == "foo"

            resp = c.get("/logout")
            assert resp.location == "http://localhost:{}/login".format(c.port)
            assert mock_session.get("logged_in") is None


@pytest.mark.unit
def test_login_failed():
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch(
                "dtale.auth.global_state.get_auth_settings",
                return_value={"active": True, "username": "foo", "password": "bar"},
            )
        )
        with build_app(url=URL).test_client() as c:
            resp = c.post("/login", data=dict(username="foo", password="foo"))
            assert "Invalid credentials!" in str(resp.data)
