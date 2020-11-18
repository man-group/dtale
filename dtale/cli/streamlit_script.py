import streamlit.server.server as streamlit_server
import sys

from streamlit.cli import main
from tornado.wsgi import WSGIContainer
from tornado.web import FallbackHandler

from dtale.app import build_app
from dtale.cli.clickutils import run


orig_start_listening = streamlit_server.start_listening


def _override_start_listening(app):
    dtale_app_obj = build_app(reaper_on=False)

    tr = WSGIContainer(dtale_app_obj)
    app.add_handlers(r".*", [(".*dtale.*", FallbackHandler, dict(fallback=tr))])
    orig_start_listening(app)


streamlit_server.start_listening = _override_start_listening

# we need to stop XSRF protection since dash won't work otherwise
additional_args = []
if "--server.enableCORS" not in sys.argv:
    additional_args += ["--server.enableCORS", "false"]
if "--server.enableXsrfProtection" not in sys.argv:
    additional_args += ["--server.enableXsrfProtection", "false"]
sys.argv += additional_args

if __name__ == "__main__":
    run(main)
