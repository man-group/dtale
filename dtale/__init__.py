from flask import Blueprint

dtale = Blueprint("dtale", __name__, url_prefix="/dtale")

# flake8: NOQA
from dtale.app import show, get_instance, instances, offline_chart  # isort:skip
from dtale.cli.loaders import LOADERS  # isort:skip
from dtale.global_state import ALLOW_CELL_EDITS

for loader_name, loader in LOADERS.items():
    if hasattr(loader, "show_loader"):
        globals()["show_{}".format(loader_name)] = loader.show_loader
