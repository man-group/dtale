import mock
import os
import pytest

from dtale.config import (
    load_app_settings,
    load_auth_settings,
    load_config_state,
    build_show_options,
    set_config,
)
from tests import ExitStack


@pytest.mark.unit
def test_load_app_settings():
    settings = {
        "theme": "dark",
        "github_fork": False,
        "hide_shutdown": True,
        "pin_menu": True,
        "language": "cn",
        "max_column_width": 50,
        "query_engine": "numexpr",
        "hide_header_editor": True,
        "lock_header_menu": True,
        "hide_header_menu": True,
        "hide_main_menu": True,
        "hide_column_menus": True,
    }
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.APP_SETTINGS", settings))

        load_app_settings(None)
        assert settings["hide_shutdown"]
        assert settings["pin_menu"]
        assert settings["language"] == "cn"
        assert settings["theme"] == "dark"
        assert settings["max_column_width"] == 50
        assert settings["query_engine"] == "numexpr"
        assert settings["hide_header_editor"]
        assert settings["lock_header_menu"]
        assert settings["hide_header_menu"]
        assert settings["hide_main_menu"]
        assert settings["hide_column_menus"]

        load_app_settings(
            load_config_state(os.path.join(os.path.dirname(__file__), "dtale.ini"))
        )
        assert not settings["hide_shutdown"]
        assert not settings["pin_menu"]
        assert settings["language"] == "en"
        assert settings["theme"] == "light"
        assert settings["max_column_width"] == 100
        assert settings["main_title"] == "My App"
        assert settings["main_title_font"] == "Arial"
        assert settings["query_engine"] == "python"
        assert not settings["hide_header_editor"]
        assert not settings["lock_header_menu"]
        assert not settings["hide_header_menu"]
        assert not settings["hide_main_menu"]
        assert not settings["hide_column_menus"]


@pytest.mark.unit
def test_load_app_settings_w_missing_props():
    settings = {
        "theme": "light",
        "github_fork": False,
        "hide_shutdown": True,
        "pin_menu": True,
        "language": "cn",
        "max_column_width": None,
        "query_engine": "python",
        "hide_header_editor": True,
        "lock_header_menu": True,
        "hide_header_menu": True,
        "hide_main_menu": True,
        "hide_column_menus": True,
    }
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.APP_SETTINGS", settings))

        load_app_settings(None)
        assert settings["hide_shutdown"]
        assert settings["pin_menu"]
        assert settings["language"] == "cn"
        assert settings["max_column_width"] is None
        assert settings["hide_header_editor"]
        assert settings["lock_header_menu"]
        assert settings["hide_header_menu"]
        assert settings["hide_main_menu"]
        assert settings["hide_column_menus"]

        load_app_settings(
            load_config_state(
                os.path.join(os.path.dirname(__file__), "dtale_missing_props.ini")
            )
        )
        assert not settings["hide_shutdown"]
        assert settings["pin_menu"]
        assert settings["language"] == "cn"
        assert settings["max_column_width"] is None
        assert not settings["hide_header_editor"]
        assert not settings["lock_header_menu"]
        assert not settings["hide_header_menu"]
        assert not settings["hide_main_menu"]
        assert not settings["hide_column_menus"]


@pytest.mark.unit
def test_load_auth_settings():
    settings = {"active": True, "username": "foo", "password": "foo"}
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.AUTH_SETTINGS", settings))

        load_auth_settings(None)
        assert settings["active"]
        assert settings["username"] == "foo"
        assert settings["password"] == "foo"

        load_auth_settings(
            load_config_state(os.path.join(os.path.dirname(__file__), "dtale.ini"))
        )
        assert not settings["active"]
        assert settings["username"] == "admin"
        assert settings["password"] == "admin"


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
    unittest.assertEqual(
        final_options["column_formats"], {"a": {"fmt": {"html": True}}}
    )
    unittest.assertEqual(final_options["sort"], [("a", "ASC")])
    unittest.assertEqual(final_options["locked"], ["a", "b"])
    unittest.assertEqual(
        final_options["column_edit_options"], {"a": ["foo", "bar", "baz"]}
    )
    assert not final_options["auto_hide_empty_columns"]
    assert not final_options["highlight_filter"]

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
def test_build_show_options_w_missing_ini_props(unittest):
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

    ini_path = os.path.join(
        os.path.dirname(__file__), "dtale_allow_cell_edits_list.ini"
    )
    os.environ["DTALE_CONFIG"] = ini_path
    final_options = build_show_options()
    unittest.assertEqual(final_options["allow_cell_edits"], ["a", "b"])
