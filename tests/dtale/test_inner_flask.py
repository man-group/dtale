import pytest

from dtale.app import build_app

app = build_app(reaper_on=False)


@app.route("/")
def hello_world():
    return "hello world"


@pytest.mark.unit
def test_processes():
    app._override_routes()
    with app.test_client() as c:
        resp = c.get("/")
        assert resp.data == b"hello world"
