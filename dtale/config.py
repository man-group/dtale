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
    return defaults[prop]


def load_app_settings(config):
    if config is None:
        return
    curr_app_settings = global_state.get_app_settings()
    theme = get_config_val(config, curr_app_settings, "theme", section="app")
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
    global_state.set_app_settings(
        dict(theme=theme, github_fork=github_fork, hide_shutdown=hide_shutdown)
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
        ignore_duplicate=False,
        app_root=None,
        allow_cell_edits=True,
        inplace=False,
        drop_index=False,
        precision=2,
        show_columns=None,
        hide_columns=None,
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

    return dict_merge(defaults, config_options, options)


LOADED_CONFIG = get_config()
load_app_settings(LOADED_CONFIG)
