import pytest

import dtale.global_state as global_state
from dtale.app import build_app


def pytest_configure(config):
    import sys

    sys._called_from_test = True


def pytest_unconfigure(config):
    import sys

    del sys._called_from_test


@pytest.fixture(autouse=True)
def cleanup_global_state():
    global_state.cleanup()
    global_state.use_default_store()
    yield
    global_state.cleanup()
    global_state.use_default_store()


@pytest.fixture(scope="session")
def dtale_app():
    return build_app(url="http://localhost:40000")


@pytest.fixture
def client(dtale_app):
    with dtale_app.test_client() as c:
        yield c
