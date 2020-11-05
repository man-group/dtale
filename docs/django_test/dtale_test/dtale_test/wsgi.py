"""
WSGI config for dtale_test project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

from dtale.app import build_app
from dtale.django.dispatcher import PathDispatcher

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dtale_test.settings")


def make_app(prefix):
    if prefix == "flask":
        return build_app(app_root="/flask", reaper_on=False)


application = PathDispatcher(get_wsgi_application(), make_app)
