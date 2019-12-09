from flask import Blueprint

dtale = Blueprint('dtale', __name__, url_prefix='/dtale')

# flake8: NOQA
from dtale.app import show, get_instance, instances  # isort:skip