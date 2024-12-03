import warnings

from flask import Blueprint

with warnings.catch_warnings():
    warnings.filterwarnings(
        "ignore",
        (
            "\nThe dash_html_components package is deprecated. Please replace"
            "\n`import dash_html_components as html` with `from dash import html`"
        ),
    )
    warnings.filterwarnings("ignore", module="matplotlib\\..*")  # noqa: W605

    dtale = Blueprint("dtale", __name__, url_prefix="/dtale")

    ALLOW_CELL_EDITS = True
    HIDE_SHUTDOWN = False
    GITHUB_FORK = False
    HIDE_HEADER_EDITOR = False
    LOCK_HEADER_MENU = False
    HIDE_HEADER_MENU = False
    HIDE_MAIN_MENU = False
    HIDE_COLUMN_MENUS = False
    HIDE_ROW_EXPANDERS = False
    ENABLE_CUSTOM_FILTERS = False
    ENABLE_WEB_UPLOADS = False

    # flake8: NOQA
    from dtale.app import show, get_instance, instances, offline_chart  # isort:skip
    from dtale.cli.loaders import LOADERS  # isort:skip
    from dtale.cli.clickutils import retrieve_meta_info_and_version
    from dtale.global_state import update_id  # isort:skip

    for loader_name, loader in LOADERS.items():
        if hasattr(loader, "show_loader"):
            globals()["show_{}".format(loader_name)] = loader.show_loader

    __version__ = retrieve_meta_info_and_version("dtale")[1]
