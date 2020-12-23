import mock
import os
import pytest
from six import PY3

from dtale.config import (
    load_app_settings,
    load_config_state,
    build_show_options,
    set_config,
)

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_load_app_settings():
    settings = {
        "theme": "light",
        "github_fork": False,
        "hide_shutdown": True,
    }
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.APP_SETTINGS", settings))

        load_app_settings(None)
        assert settings["hide_shutdown"]

        load_app_settings(
            load_config_state(os.path.join(os.path.dirname(__file__), "dtale.ini"))
        )
        assert not settings["hide_shutdown"]


@pytest.mark.unit
def test_load_app_settings_w_missing_props():
    settings = {
        "theme": "light",
        "github_fork": False,
        "hide_shutdown": True,
    }
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.APP_SETTINGS", settings))

        load_app_settings(None)
        assert settings["hide_shutdown"]

        load_app_settings(
            load_config_state(
                os.path.join(os.path.dirname(__file__), "dtale_missing_props.ini")
            )
        )
        assert not settings["hide_shutdown"]


@pytest.mark.unit
def test_build_show_options(unittest):
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]

    options = dict(allow_cell_edits=False)
    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]

    ini_path = os.path.join(os.path.dirname(__file__), "dtale.ini")
    os.environ["DTALE_CONFIG"] = ini_path
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]
    assert final_options["precision"] == 6
    unittest.assertEqual(final_options["show_columns"], ["a", "b"])
    unittest.assertEqual(final_options["hide_columns"], ["c"])

    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]

    del os.environ["DTALE_CONFIG"]

    set_config(ini_path)
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]

    set_config(None)
    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]


@pytest.mark.unit
def test_build_show_options_w_missing_ini_props():
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]

    options = dict(allow_cell_edits=False)
    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]

    ini_path = os.path.join(os.path.dirname(__file__), "dtale_missing_props.ini")
    os.environ["DTALE_CONFIG"] = ini_path
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]

    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]

    del os.environ["DTALE_CONFIG"]

    set_config(ini_path)
    final_options = build_show_options()
    assert final_options["allow_cell_edits"]

    set_config(None)
    final_options = build_show_options(options)
    assert not final_options["allow_cell_edits"]
