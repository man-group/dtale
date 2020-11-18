# How To Embed D-Tale (or any Flask App) Within Streamlit
![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/explicit_code.jpg)

One question I was asked long ago was "Can D-Tale be used within Streamlit?" I didn't have much experience with Streamlit but I knew it was a pretty cool tool for whipping up quick webpages in python.

Upon initial inspection I noticed that Streamlit was using Tornado for it's web server (in particular `tornado.httpserver.HTTPServer`), but after my experience embedding [D-Tale within Django](https://github.com/man-group/dtale/blob/master/docs/EMBEDDED_DJANGO.md) I knew there had to be a way.

After a little bit of searching I found that `streamlit.server.Server` had a [`_create_app()`](https://github.com/streamlit/streamlit/blob/4a92ee85dcceca5efacc44a1ea9d0cfdc7fecce3/lib/streamlit/server/server.py#L320) function which was building different routes available to each Streamlit server.  From there I looked around to see if there was a way to incorporate a Flask app into `tornado.httpserver.HTTPServer`.  I was able to come across this [post](https://stackoverflow.com/a/8247457):
```python
from tornado.wsgi import WSGIContainer
from tornado.ioloop import IOLoop
from tornado.web import FallbackHandler, RequestHandler, Application
from flasky import app

class MainHandler(RequestHandler):
  def get(self):
    self.write("This message comes from Tornado ^_^")

tr = WSGIContainer(app)

application = Application([
(r"/tornado", MainHandler),
(r".*", FallbackHandler, dict(fallback=tr)),
])

if __name__ == "__main__":
  application.listen(8000)
  IOLoop.instance().start()
```

Once I saw that, I remembered that the `_create_app()` function in Streamlit was using the same `tornado.web.Application` in that snippet above. Eureka! I just needed to find a way to add my `FallbackHandler` to Streamlit's underlying `tornado.web.Application`.  Here's where the hacking comes in...

I noticed these two lines within `streamlit.server.server.Server.start`:
```python
app = self._create_app()
start_listening(app)
```
`start_listening` was a publicly available function that could be overriden thanks to the magic of python.  From there I came up with this little piece of code:

```python
import streamlit.server.server as streamlit_server

from streamlit.cli import main
from tornado.wsgi import WSGIContainer
from tornado.web import FallbackHandler

from dtale.app import build_app


orig_start_listening = streamlit_server.start_listening


def _override_start_listening(app):
    dtale_app_obj = build_app(reaper_on=False)

    tr = WSGIContainer(dtale_app_obj)
    app.add_handlers(r".*", [(".*dtale.*", FallbackHandler, dict(fallback=tr))])
    orig_start_listening(app)


streamlit_server.start_listening = _override_start_listening
```

We have now overriden the `start_listening` function so that when it is called it will also add a `FallbackHandler` for my Flask application.  The one thing to be aware of is that the pattern patcher you specify (in this case `".*dtale.*"`) will control what routes will be available in your Flask application. So if you have routes that don't match they will not be available.  It's also important that you have a matcher that isn't as loose as `".*"` or else streamlit's core route won't be available.

Now to tie it altogether I need to wrap Streamlit's CLI so you could invoke my version of Streamlit with my Flask app included.  Here is the final module, `streamlit_script.py`:
```python
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
```

In addition to this module I also added an entry in the `console_scripts` of my `setup.py`:
```python
entry_points={
    "console_scripts": [
        "dtale = dtale.cli.script:main",
        "dtale-streamlit = dtale.cli.streamlit_script:main",
    ]
}
```
So now I can invoke it from the CLI in a similar way to Streamlit just with the `dtale-` prefix in front. For example: `dtale-streamlit run my_script.py`

**EXTRA HACK**: My Flask app D-Tale uses plotly dash which unfortunately does not work when XSRF protection is enabled since it uses POST requests.  So I had to turn off `server.enableXsrfProtection` & `server.enableCors` by default. If you aren't using something like this then you ignore this hack.

Hope this leads to lots of new ideas of how Flask can be used within Streamlit or at least some ways to make this example a little less hacky! Please support open-source by putting your :star: on this repo!

For more information on how to use D-Tale within your Streamlit application see this [article](https://github.com/man-group/dtale/blob/master/docs/EMBEDDED_DTALE_STREAMLIT.md)

