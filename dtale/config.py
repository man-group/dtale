import json
import os

from six.moves.configparser import ConfigParser

import dtale.global_state as global_state
from dtale.utils import dict_merge

LOADED_CONFIG = None


def load_config_state(path):
    if not path:
        return None
    # load .ini file with properties specific to D-Tale
    config = ConfigParser()
    config.read(path)
    return config


def get_config():
    global LOADED_CONFIG

    if LOADED_CONFIG:
        return LOADED_CONFIG
    ini_path = os.path.expandvars(
        os.environ.get("DTALE_CONFIG") or "$HOME/.config/dtale.ini"
    )
    if os.path.isfile(ini_path):
        return load_config_state(ini_path)
    return None


def set_config(path):
    global LOADED_CONFIG

    LOADED_CONFIG = load_config_state(path)


def get_config_val(config, defaults, prop, getter="get", section="show"):
    if config.has_option(section, prop):
        return getattr(config, getter)(section, prop)
    return defaults.get(prop)


def load_app_settings(config):
    if config is None:
        return
    curr_app_settings = global_state.get_app_settings()
    theme = get_config_val(config, curr_app_settings, "theme", section="app")
    pin_menu = get_config_val(
        config, curr_app_settings, "pin_menu", section="app", getter="getboolean"
    )
    language = get_config_val(config, curr_app_settings, "language", section="app")
    github_fork = get_config_val(
        config,
        curr_app_settings,
        "github_fork",
        section="app",
        getter="getboolean",
    )
    hide_shutdown = get_config_val(
        config,
        curr_app_settings,
        "hide_shutdown",
        section="app",
        getter="getboolean",
    )
    max_column_width = get_config_val(
        config, curr_app_settings, "max_column_width", section="app", getter="getint"
    )
    max_row_height = get_config_val(
        config, curr_app_settings, "max_row_height", section="app", getter="getint"
    )
    main_title = get_config_val(config, curr_app_settings, "main_title", section="app")
    main_title_font = get_config_val(
        config, curr_app_settings, "main_title_font", section="app"
    )
    query_engine = get_config_val(
        config, curr_app_settings, "query_engine", section="app"
    )
    open_custom_filter_on_startup = get_config_val(
        config,
        curr_app_settings,
        "open_custom_filter_on_startup",
        section="app",
        getter="getboolean",
    )
    open_predefined_filters_on_startup = get_config_val(
        config,
        curr_app_settings,
        "open_predefined_filters_on_startup",
        section="app",
        getter="getboolean",
    )
    hide_drop_rows = get_config_val(
        config,
        curr_app_settings,
        "hide_drop_rows",
        section="app",
        getter="getboolean",
    )

    global_state.set_app_settings(
        dict(
            theme=theme,
            pin_menu=pin_menu,
            language=language,
            github_fork=github_fork,
            hide_shutdown=hide_shutdown,
            max_column_width=max_column_width,
            max_row_height=max_row_height,
            main_title=main_title,
            main_title_font=main_title_font,
            query_engine=query_engine,
            open_custom_filter_on_startup=open_custom_filter_on_startup,
            open_predefined_filters_on_startup=open_predefined_filters_on_startup,
            hide_drop_rows=hide_drop_rows,
        )
    )


def load_chart_settings(config):
    if config is None:
        return
    curr_chart_settings = global_state.get_chart_settings()

    scatter_points = get_config_val(
        config, curr_chart_settings, "scatter_points", section="charts", getter="getint"
    )
    three_dimensional_points = get_config_val(
        config, curr_chart_settings, "3d_points", section="charts", getter="getint"
    )
    global_state.set_chart_settings(
        {"scatter_points": scatter_points, "3d_points": three_dimensional_points}
    )


def load_auth_settings(config):
    if config is None:
        return
    curr_auth_settings = global_state.get_auth_settings()
    active = get_config_val(
        config, curr_auth_settings, "active", section="auth", getter="getboolean"
    )
    username = get_config_val(config, curr_auth_settings, "username", section="auth")
    password = get_config_val(config, curr_auth_settings, "password", section="auth")

    global_state.set_auth_settings(
        dict(
            active=active,
            username=username,
            password=password,
        )
    )


def build_show_options(options=None):

    defaults = dict(
        host=None,
        port=None,
        debug=False,
        subprocess=True,
        reaper_on=True,
        open_browser=False,
        notebook=False,
        force=False,
        ignore_duplicate=True,
        app_root=None,
        allow_cell_edits=True,
        inplace=False,
        drop_index=False,
        precision=2,
        show_columns=None,
        hide_columns=None,
        column_formats=None,
        nan_display=None,
        sort=None,
        locked=None,
        background_mode=None,
        range_highlights=None,
    )
    config_options = {}
    config = get_config()
    if config and config.has_section("show"):
        config_options["host"] = get_config_val(config, defaults, "host")
        config_options["port"] = get_config_val(config, defaults, "port")
        config_options["debug"] = get_config_val(
            config, defaults, "debug", "getboolean"
        )
        config_options["subprocess"] = get_config_val(
            config, defaults, "subprocess", "getboolean"
        )
        config_options["reaper_on"] = get_config_val(
            config, defaults, "reaper_on", "getboolean"
        )
        config_options["open_browser"] = get_config_val(
            config, defaults, "open_browser", "getboolean"
        )
        config_options["notebook"] = get_config_val(
            config, defaults, "notebook", "getboolean"
        )
        config_options["force"] = get_config_val(
            config, defaults, "force", "getboolean"
        )
        config_options["ignore_duplicate"] = get_config_val(
            config, defaults, "ignore_duplicate", "getboolean"
        )
        config_options["app_root"] = get_config_val(config, defaults, "app_root")
        config_options["allow_cell_edits"] = get_config_val(
            config, defaults, "allow_cell_edits", "getboolean"
        )
        config_options["inplace"] = get_config_val(
            config, defaults, "inplace", "getboolean"
        )
        config_options["drop_index"] = get_config_val(
            config, defaults, "drop_index", "getboolean"
        )
        config_options["precision"] = get_config_val(
            config, defaults, "precision", "getint"
        )
        config_options["show_columns"] = get_config_val(
            config, defaults, "show_columns"
        )
        if config_options["show_columns"]:
            config_options["show_columns"] = config_options["show_columns"].split(",")
        config_options["hide_columns"] = get_config_val(
            config, defaults, "hide_columns"
        )
        if config_options["hide_columns"]:
            config_options["hide_columns"] = config_options["hide_columns"].split(",")
        config_options["column_formats"] = get_config_val(
            config, defaults, "column_formats"
        )
        if config_options["column_formats"]:
            config_options["column_formats"] = json.loads(
                config_options["column_formats"]
            )
        config_options["nan_display"] = get_config_val(config, defaults, "nan_display")
        config_options["sort"] = get_config_val(config, defaults, "sort")
        if config_options["sort"]:
            config_options["sort"] = [
                tuple(sort.split("|")) for sort in config_options["sort"].split(",")
            ]
        config_options["locked"] = get_config_val(config, defaults, "locked")
        if config_options["locked"]:
            config_options["locked"] = config_options["locked"].split(",")
        config_options["background_mode"] = get_config_val(
            config, defaults, "background_mode"
        )
        config_options["range_highlights"] = get_config_val(
            config, defaults, "range_highlights"
        )
        if config_options["range_highlights"]:
            config_options["range_highlights"] = json.loads(
                config_options["range_highlights"]
            )

    return dict_merge(defaults, config_options, options)


LOADED_CONFIG = get_config()
load_app_settings(LOADED_CONFIG)
load_auth_settings(LOADED_CONFIG)
load_chart_settings(LOADED_CONFIG)
