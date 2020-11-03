# Adventures In Flask While Developing D-Tale

- [On-Demand Flask Processes](#on-demand-flask-processes)
- [Serving Multiple Pieces of Data Using Dynamic Routes](#serving-multiple-pieces-of-data-using-dynamic-routes)
- [Custom Routes Using url_value_preprocessor](#custom-routes-using-url_value_preprocessor)
- [Adding A Reaper To Your Flask Process](#adding-a-reaper-to-your-flask-process)
- [Integrating Dash Into Your Flask App](#integrating-dash-into-your-flask-app)
- [Exception Handling Decorator](#exception-handling-decorator)
- [Making Modifications To Flask's Test Client](#making-modifications-to-flasks-test-client)

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/schonfeld.png)

Hello everyone.  My name is Andrew Schonfeld and wanted to tell you a little bit about
my experiences writing Flask applications, specifically my open-source package, D-Tale.

I've been a software engineer in the finance industry for over 14 years in Boston.  The first 8 writing Java spring applications for big banks and then next 7 developing Python Flask applications for a small quant shop.  More recently, in the midst of a pandemic, I moved to Pittsburgh to start a new job at Argo AI (a software company specializing in autonomous vehicles) mainly working on Typescript applications.

During my time working for that small quant shop in Boston, Numeric Investors, it was where I found out how to build web applications with Python using a little package called Flask.  It was a revelation compared to the work I had done in Java.  With just a few lines of code I had a fully functioning web app.  So off I went initially building full-scale standalone web applications sourcing data from SQL Server and Mongo to jinja & requirejs fueled front-ends.  A few years later I found out about the magic of ReactJS and started building my frontends using that.  A little while after that I worked with my CI/CD department to find a way to package my Flask apps as deployable eggs and later more sustainably using Docker.  The one constant throughout this process was Flask.

Eventually, that small quant shop was purchased by one of the largest international hedge funds, MAN Group, and it was under their eye that I was recommended to start open-sourcing my projects.  The first project I was tasked with finding an easy way to visualize pandas dataframes.  Our company had recently completed a conversion from SAS to Python and needed some way to replicate the visualizer they had for their SAS datasets.

### On-Demand Flask Processes

One of the first requirements was that it had to be able to be called on-demand from a library when users were debugging code or working in a jupyter notebook.  This was something I had never done before using Flask because all of my applications were long-running processes.

So after some thinking I came up with the idea of kicking off a flask process within a separate thread from the main process they were working in:

```python
import _thread
from flask import Flask

DATA = None
def _start(df):
    global DATA

    DATA = df

    app = Flask(__name__)

    @app.route('/row-count')
    def row_count():
        return 'Dataframe has {} rows'.format(len(DATA))

    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

_thread.start_new_thread(_start, ())
```

This effectively spawns a Flask process on port 8088 of the localhost that can allow users to continue working in the main process and share memory with the Flask process (via the `DATA` variable).

### Serving Multiple Pieces of Data Using Dynamic Routes

So originally the idea was to allow users to spin up a Flask process for each piece of data they wanted to view.  Essentially each dataframe would occupy a different port on the user's machine.  This quickly became unwieldy and so I decided to go a different route allow multiple pieces of data to be viewed from one Flask process.  I was able to accomplish this by converting the `DATA` variable from one dataframe into a dictionary of multiple dataframes.  The keys of dictionary would be identifiers that can be used as variables within the routes of our Flask process.

```python

DATA = {
    '1': df1,
    '2': df2
}

@app.route('/row-count/<data_id>')
def row_count(data_id=None):
    df = DATA.get(data_id)
    return 'Dataframe {} has {} rows'.format(data_id, len(df))
```

So to view the row count for dataframe 1 use the URL `http://localhost:8080/row-count/1`.

### Custom Routes Using url_value_preprocessor

Recently I just added a feature where users can also assign names to their data which can be used within their URLs to retrieve their data.

```
NAMES = {
    'foo': '1',
    'bar': '2'
}

@app.url_value_preprocessor
def handle_data_id(_endpoint, values):
    if values and "data_id" in values and values["data_id"] not in DATA:
        values["data_id"] = NAMES[values["data_id"]]
```

Now that URL becomes `http://localhost:8080/row-count/foo`.

### Adding A Reaper To Your Flask Process

Another feature which was uncharted territory for me was the ability to have some sort of "reaper" for these Flask processes that users opened and forget about.  So the way I was able to solve this issue was by initializing a `Timer` object which after an hour will fire a request to a "shutdown" (which is another process to tackle) route on your Flask process.

```python
import requests
import sys
from threading import Timer
from flask import Flask, request

class MyFlask(Flask):

    def __init__(self, import_name, *args, **kwargs):
        self.start_reaper()
        super(MyFlask, self).__init__(import_name, *args, **kwargs)
    
    def build_reaper():
        def _func():
            # make sure the Flask process is still running
            if is_up('http://localhost:{}'.format(self.port)):
                requests.get(self.shutdown_url)
            sys.exit()  # kill off the reaper thread

        self.reaper = Timer(60.0 * 60.0, _func)  # one hour
        self.reaper.start()
    
    def clear_reaper(self):
        if self.reaper:
            self.reaper.cancel()
    
    def run(self, *args, **kwargs):
        self.port = str(kwargs.get("port") or "")
        self.build_reaper()
        super(MyFlask, self).run(*args, **kwargs)


def is_up(base):
    try:
        return requests.get("{}/health".format(base), verify=False).ok
    except BaseException:
        return False

app = MyFlask(__name__)

@app.route("/health")
def health_check():
    return "ok"

@app.before_request
def before_request():
    # before each request we want to re-initialize the reaper since we only
    # want to kill the process after inactivity
    app.build_reaper()

@app.route("/shutdown")
def shutdown():
    app.clear_reaper()
    func = request.environ.get("werkzeug.server.shutdown")
    if func is None:
        raise RuntimeError("Not running with the Werkzeug Server")
    func()
    return "Server shutting down..."
```

### Integrating Dash Into Your Flask App

Originally for the chart building functionality of D-Tale I was building my own UI in React using chart.js.  But eventually I ran into limintations with the availability of certain chart types.  Then I was given a recommendation to look at Plotly Dash and it was yet another revalation.  Plotly had an extensive selection of charts and it was already integrated into a Flask application.  So I just needed to find a way to integrate Dash into my Flask application (D-Tale).  Here's the way I solved it:

```python
import dash

class MyDash(dash.Dash):
    def __init__(self, *args, **kwargs):
        # define any additional stylesheets or scripts...
        super(MyDash, self).__init__(*args, **kwargs)
    
    def interpolate_index(self, **kwargs):
        # this is where you would build your base layout...
        return base_layout()

# "app" is our Flask instance from earlier
with app.app_context():

    dash_app = MyDash(server=app, routes_pathname='/dtale/charts/', eager_loading=True)
    dash_app.config.suppress_callback_exceptions = True
    dash_app.layout = html.Div(
        [dcc.Location(id="url", refresh=False), html.Div(id="popup-content")]
    )
    dash_app.scripts.config.serve_locally = True
    dash_app.css.config.serve_locally = True

    @dash_app.callback(
        Output("popup-content", "children"),
        [Input("url", "pathname"), Input("url", "search")],
    )
    def callback1(pathname, search):
        dash_app.config.suppress_callback_exceptions = False
        if pathname is None:
            raise PreventUpdate
        # build content for your page...
        return popup_content

    # define any other additional dash callbacks...
```

Viola! It took a while to get used to Dash's callback style approach, but you can see how easily you can add it your Flask app :smile:

### Exception Handling Decorator

So after a while of maintaining D-TAle source code and continually adding new Flask routes I noticed that I was duplicating a lot of exception handling code.  So an easy way to minimize your try/except code was by doing the following:
```python
import traceback

from flask import jsonify
from functools import wraps

def exception_decorator(func):
    @wraps(func)
    def _handle_exceptions(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except BaseException as e:
            tb = traceback.format_exc()
            return jsonify(dict(error=str(e), traceback=str(tb)))

    return _handle_exceptions

@app.route("/test-exception")
@exception_decorator
def test_exception():
    raise Exception("test exception")
```

Now it should be noted that you can return whatever content you'd like for your users but in my case I'm dealing mainly in ajax responses and I just check the resulting JSON to see if the `error` property is populated and if it is render a generic Reactjs error component.

### Making Modifications To Flask's Test Client

Over the last year one of the biggest hurdles to jump with D-Tale was being able to use it within Kubernetes.  Lots of people use Kubernetes to containerize jupyterhub.  The problem is that it will only open so many ports.  So when someone tries to kick off D-Tale from a notebook where it has only exposed one port you won't be able to access your notebook.  So originally the only way to do this was by customizing your Kubernetes setup (as noted [here](https://github.com/man-group/dtale/blob/master/docs/JUPYTERHUB_KUBERNETES.md)).  But lucky for us along came [JupyterHub Server Proxy](https://github.com/jupyterhub/jupyter-server-proxy) which allows us to access D-Tale through a proxy.  The only problem was testing that altering your Flask routes to be picked up by the proxy needed to be tested.  Here's how I did it:

First you create a wrapper for the `FlaskTestClient` class and override the `get` function:
```python
from flask.testing import FlaskClient

class MyFlaskTesting(FlaskClient):
    def __init__(Self, *args, **kwargs):
        self.host = kwargs.pop("hostname", "localhost")
        self.port = kwargs.pop("port", str(random.randint(0, 65535))) or str(
            random.randint(0, 65535)
        )
        super(DtaleFlaskTesting, self).__init__(*args, **kwargs)
        self.application.config["SERVER_NAME"] = "{host}:{port}".format(
            host=self.host, port=self.port
        )
        self.application.config["SESSION_COOKIE_DOMAIN"] = "localhost.localdomain"
    
    def get(self, *args, **kwargs):
        return super(MyFlaskTesting, self).get(url_scheme="http", *args, **kwargs)
```

Next we override the `test_client` function on our Flask warpper:
```python
from flask import Flask, request

class MyFlask(Flask):
    def __init__(
        self, import_name, reaper_on=True, app_root=None, *args, **kwargs
    ):
        self.reaper_on = reaper_on
        super(MyFlask, self).__init__(import_name, *args, **kwargs)

    def test_client(self, reaper_on=False, port=None, app_root=None, *args, **kwargs):
        # now you can capture arguments to your Flask wrapper and check them in tests...
        self.reaper_on = reaper_on
        # here is where we are capturing information about altering the route for JupyterHub Server Proxy
        self.app_root = app_root
        if app_root is not None:
            self.config["APPLICATION_ROOT"] = app_root
            self.jinja_env.globals["url_for"] = self.url_for
        self.test_client_class = MyFlaskTesting
        return super(MyFlask, self).test_client(
            *args, **dict_merge(kwargs, dict(port=port))
        )
```

And now for the final test:
```python
@pytest.mark.unit
def test_200():
    app = MyFlask()

    paths = [
        "/route1/{port}",
        "/route2/{port}",
        "health",
    ]

    with app.test_client() as c:
        for path in paths:
            final_path = path.format(port=c.port)
            response = c.get(final_path)
            assert (
                response.status_code == 200
            ), "{} should return 200 response".format(final_path)
    
    with app.test_client(app_root="/test_route") as c:
        for path in paths:
            final_path = path.format(port=c.port)
            response = c.get(final_path)
            assert (
                response.status_code == 200
            ), "{} should return 200 response".format(final_path)
```

Easy, right? :rofl:

Feel free to submit and questions or issues with these tips as an issue on [D-Tale's repo](https://github.com/man-group/dtale/issues).  Hope this helps you avoid some of the headaches that I came accross and I'll be adding more tips to this as time goes on.  Thanks.
    
