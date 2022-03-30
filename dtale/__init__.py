import warnings

from flask import Blueprint

warnings.filterwarnings("ignore")

dtale = Blueprint("dtale", __name__, url_prefix="/dtale")

# flake8: NOQA
from dtale.app import show, get_instance, instances, offline_chart  # isort:skip
from dtale.cli.loaders import LOADERS  # isort:skip
from dtale.cli.clickutils import retrieve_meta_info_and_version
from dtale.global_state import update_id  # isort:skip

ALLOW_CELL_EDITS = True
HIDE_SHUTDOWN = False
GITHUB_FORK = False

for loader_name, loader in LOADERS.items():
    if hasattr(loader, "show_loader"):
        globals()["show_{}".format(loader_name)] = loader.show_loader


__version__ = retrieve_meta_info_and_version("dtale")[1]
