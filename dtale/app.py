from __future__ import absolute_import, print_function

import getpass
import jinja2
import os
import pandas as pd
import random
import socket
import sys
import time
import traceback
from builtins import map, str
from contextlib import closing
from logging import ERROR as LOG_ERROR
from logging import getLogger
from threading import Timer

from flask import Flask, jsonify, redirect, render_template, request, url_for
from flask.testing import FlaskClient

import requests
from flask_compress import Compress
from six import PY3

import dtale.global_state as global_state
import dtale.config as dtale_config
from dtale import dtale
from dtale.cli.clickutils import retrieve_meta_info_and_version, setup_logging
from dtale.utils import (
    DuplicateDataError,
    build_shutdown_url,
    build_url,
    dict_merge,
    fix_url_path,
    get_host,
    is_app_root_defined,
    make_list,
    running_with_flask_debug,
)
from dtale.views import DtaleData, head_endpoint, is_up, kill, startup

if PY3:
    import _thread
else:
    import thread as _thread

logger = getLogger(__name__)

USE_NGROK = False
USE_COLAB = False
JUPYTER_SERVER_PROXY = False
ACTIVE_HOST = None
ACTIVE_PORT = None

SHORT_LIFE_PATHS = ["dist", "dash"]
SHORT_LIFE_TIMEOUT = 60

REAPER_TIMEOUT = 60.0 * 60.0  # one-hour


class DtaleFlaskTesting(FlaskClient):
    """
    Overriding Flask's implementation of flask.FlaskClient so we
    can control the port associated with tests.

    This class is required for setting the port on your test so that
    we won't have SETTING keys colliding with other tests since the default
    for every test would be 80.

    :param args: Optional arguments to be passed to :class:`flask:flask.FlaskClient`
    :param kwargs: Optional keyword arguments to be passed to :class:`flask:flask.FlaskClient`
    """

    def __init__(self, *args, **kwargs):
        """
        Constructor method
        """
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
        """
        :param args: Optional arguments to be passed to :meth:`flask:flask.FlaskClient.get`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask:flask.FlaskClient.get`
        """
        return super(DtaleFlaskTesting, self).get(url_scheme="http", *args, **kwargs)


def contains_route(routes, route):
    return any((r.rule == route.rule and r.endpoint == route.endpoint) for r in routes)


class DtaleFlask(Flask):
    """
    Overriding Flask's implementation of
    get_send_file_max_age, test_client & run

    :param import_name: the name of the application package
    :param reaper_on: whether to run auto-reaper subprocess
    :type reaper_on: bool
    :param args: Optional arguments to be passed to :class:`flask:flask.Flask`
    :param kwargs: Optional keyword arguments to be passed to :class:`flask:flask.Flask`
    """

    def __init__(
        self, import_name, reaper_on=True, url=None, app_root=None, *args, **kwargs
    ):
        """
        Constructor method
        :param reaper_on: whether to run auto-reaper subprocess
        :type reaper_on: bool
        """
        self.reaper_on = reaper_on
        self.reaper = None
        self._setup_url_props(url)
        self.port = None
        self.app_root = app_root
        super(DtaleFlask, self).__init__(import_name, *args, **kwargs)

    def _setup_url_props(self, url):
        self.base_url = url
        self.shutdown_url = build_shutdown_url(url)

    def update_template_context(self, context):
        super(DtaleFlask, self).update_template_context(context)
        if self.app_root is not None:
            context["url_for"] = self.url_for

    def url_for(self, endpoint, *args, **kwargs):
        if self.app_root is not None and endpoint == "static":
            if "filename" in kwargs:
                return fix_url_path(
                    "{}/{}/{}".format(
                        self.app_root, self.static_url_path, kwargs["filename"]
                    )
                )
            return fix_url_path("{}/{}".format(self.app_root, args[0]))
        return url_for(endpoint, *args, **kwargs)

    def _override_routes(self, rule):
        try:
            routes_to_remove = [r for r in self.url_map._rules if r.rule == rule]
            if routes_to_remove:
                self.url_map._rules = [
                    r
                    for r in self.url_map._rules
                    if not contains_route(routes_to_remove, r)
                ]

            self.url_map._remap = True
            self.url_map.update()
        except BaseException:
            logger.exception(
                "Could not override routes, if you're trying to specify a route for '/' then it will be ignored..."
            )

    def route(self, rule, **options):
        self._override_routes(rule)
        return super(DtaleFlask, self).route(rule, **options)

    def run(self, *args, **kwargs):
        """
        :param args: Optional arguments to be passed to :meth:`flask:flask.run`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask:flask.run`
        """
        port_num = kwargs.get("port")
        self.port = str(port_num or "")
        if not self.base_url:
            host = kwargs.get("host")
            initialize_process_props(host, port_num)
            app_url = build_url(self.port, host)
            self._setup_url_props(app_url)
        if kwargs.get("debug", False):
            self.reaper_on = False
        self.build_reaper()
        super(DtaleFlask, self).run(
            use_reloader=kwargs.get("debug", False), *args, **kwargs
        )

    def test_client(self, reaper_on=False, port=None, app_root=None, *args, **kwargs):
        """
        Overriding Flask's implementation of test_client so we can specify ports for testing and
        whether auto-reaper should be running

        :param reaper_on: whether to run auto-reaper subprocess
        :type reaper_on: bool
        :param port: port number of flask application
        :type port: int
        :param args: Optional arguments to be passed to :meth:`flask:flask.Flask.test_client`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask:flask.Flask.test_client`
        :return: Flask's test client
        :rtype: :class:`dtale.app.DtaleFlaskTesting`
        """
        self.reaper_on = reaper_on
        self.app_root = app_root
        if app_root is not None:
            self.config["APPLICATION_ROOT"] = app_root
            self.jinja_env.globals["url_for"] = self.url_for
        self.test_client_class = DtaleFlaskTesting
        return super(DtaleFlask, self).test_client(
            *args, **dict_merge(kwargs, dict(port=port))
        )

    def clear_reaper(self):
        """
        Restarts auto-reaper countdown
        """
        if self.reaper:
            self.reaper.cancel()

    def build_reaper(self, timeout=REAPER_TIMEOUT):
        """
        Builds D-Tale's auto-reaping process to cleanup process after an hour of inactivity

        :param timeout: time in seconds before D-Tale is shutdown for inactivity, defaults to one hour
        :type timeout: float
        """
        if not self.reaper_on:
            return
        self.clear_reaper()

        def _func():
            logger.info("Executing shutdown due to inactivity...")
            if is_up(self.base_url):  # make sure the Flask process is still running
                requests.get(self.shutdown_url)
            sys.exit()  # kill off the reaper thread

        self.reaper = Timer(timeout, _func)
        self.reaper.start()

    def get_send_file_max_age(self, name):
        """
        Overriding Flask's implementation of
        get_send_file_max_age so we can lower the
        timeout for javascript and css files which
        are changed more often

        :param name: filename
        :return: Flask's default behavior for get_send_max_age if filename is not in SHORT_LIFE_PATHS
                 otherwise SHORT_LIFE_TIMEOUT

        """
        if name and any([name.startswith(path) for path in SHORT_LIFE_PATHS]):
            return SHORT_LIFE_TIMEOUT
        return super(DtaleFlask, self).get_send_file_max_age(name)


def build_app(
    url=None, reaper_on=True, app_root=None, additional_templates=None, **kwargs
):
    """
    Builds :class:`flask:flask.Flask` application encapsulating endpoints for D-Tale's front-end

    :param url: optional parameter which sets the host & root for any internal endpoints (ex: pinging shutdown)
    :type url: str, optional
    :param reaper_on: whether to run auto-reaper subprocess
    :type reaper_on: bool
    :param app_root: Optional path to prepend to the routes of D-Tale. This is used when making use of
                     Jupyterhub server proxy
    :type app_root: str, optional
    :param additional_templates: path(s) to any other jinja templates you would like to load.  This comes into play if
                                 you're embedding D-Tale into your own Flask app
    :type: str, list, optional
    :return: :class:`flask:flask.Flask` application
    :rtype: :class:`dtale.app.DtaleFlask`
    """

    app = DtaleFlask(
        "dtale",
        reaper_on=reaper_on,
        static_url_path="/dtale/static",
        url=url,
        instance_relative_config=False,
        app_root=app_root,
    )
    app.config["SECRET_KEY"] = "Dtale"

    app.jinja_env.trim_blocks = True
    app.jinja_env.lstrip_blocks = True

    if app_root is not None:
        app.config["APPLICATION_ROOT"] = app_root
        app.jinja_env.globals["url_for"] = app.url_for
    app.jinja_env.globals["is_app_root_defined"] = is_app_root_defined

    if additional_templates:
        loaders = [app.jinja_loader]
        loaders += [
            jinja2.FileSystemLoader(loc) for loc in make_list(additional_templates)
        ]
        my_loader = jinja2.ChoiceLoader(loaders)
        app.jinja_loader = my_loader

    app.register_blueprint(dtale)

    compress = Compress()
    compress.init_app(app)

    def _root():
        return redirect("/dtale/{}".format(head_endpoint()))

    @app.route("/")
    def root():
        return _root()

    @app.route("/dtale")
    def dtale_base():
        """
        :class:`flask:flask.Flask` routes which redirect to dtale/main

        :return: 302 - flask.redirect('/dtale/main')
        """
        return _root()

    @app.route("/favicon.ico")
    def favicon():
        """
        :class:`flask:flask.Flask` routes which returns favicon

        :return: image/png
        """
        return redirect(app.url_for("static", filename="images/favicon.ico"))

    @app.route("/missing-js")
    def missing_js():
        missing_js_commands = (
            ">> cd [location of your local dtale repo]\n"
            ">> yarn install\n"
            ">> yarn run build  # or 'yarn run watch' if you're trying to develop"
        )
        return render_template(
            "dtale/errors/missing_js.html", missing_js_commands=missing_js_commands
        )

    @app.errorhandler(404)
    def page_not_found(e=None):
        """
        :class:`flask:flask.Flask` routes which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        return (
            render_template(
                "dtale/errors/404.html",
                page="",
                error=e,
                stacktrace=str(traceback.format_exc()),
            ),
            404,
        )

    @app.errorhandler(500)
    def internal_server_error(e=None):
        """
        :class:`flask:flask.Flask` route which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        return (
            render_template(
                "dtale/errors/500.html",
                page="",
                error=e,
                stacktrace=str(traceback.format_exc()),
            ),
            500,
        )

    def shutdown_server():
        global ACTIVE_HOST, ACTIVE_PORT
        """
        This function that checks if flask.request.environ['werkzeug.server.shutdown'] exists and
        if so, executes that function
        """
        logger.info("Executing shutdown...")
        func = request.environ.get("werkzeug.server.shutdown")
        if func is None:
            raise RuntimeError("Not running with the Werkzeug Server")
        func()
        global_state.cleanup()
        ACTIVE_PORT = None
        ACTIVE_HOST = None

    @app.route("/shutdown")
    def shutdown():
        """
        :class:`flask:flask.Flask` route for initiating server shutdown

        :return: text/html with server shutdown message
        """
        app.clear_reaper()
        shutdown_server()
        return "Server shutting down..."

    @app.before_request
    def before_request():
        """
        Logic executed before each :attr:`flask:flask.request`

        :return: text/html with server shutdown message
        """
        app.build_reaper()

    @app.route("/site-map")
    def site_map():
        """
        :class:`flask:flask.Flask` route listing all available flask endpoints

        :return: JSON of all flask enpoints [
            [endpoint1, function path1],
            ...,
            [endpointN, function pathN]
        ]
        """

        def has_no_empty_params(rule):
            defaults = rule.defaults or ()
            arguments = rule.arguments or ()
            return len(defaults) >= len(arguments)

        links = []
        for rule in app.url_map.iter_rules():
            # Filter out rules we can't navigate to in a browser
            # and rules that require parameters
            if "GET" in rule.methods and has_no_empty_params(rule):
                url = app.url_for(rule.endpoint, **(rule.defaults or {}))
                links.append((url, rule.endpoint))
        return jsonify(links)

    @app.route("/version-info")
    def version_info():
        """
        :class:`flask:flask.Flask` route for retrieving version information about D-Tale

        :return: text/html version information
        """
        _, version = retrieve_meta_info_and_version("dtale")
        return str(version)

    @app.route("/health")
    def health_check():
        """
        :class:`flask:flask.Flask` route for checking if D-Tale is up and running

        :return: text/html 'ok'
        """
        return "ok"

    @app.url_value_preprocessor
    def handle_data_id(_endpoint, values):
        if values and "data_id" in values:
            values["data_id"] = global_state.find_data_id(values["data_id"])

    with app.app_context():

        from .dash_application import views as dash_views

        app = dash_views.add_dash(app)
        return app


def initialize_process_props(host=None, port=None, force=False):
    """
    Helper function to initalize global state corresponding to the host & port being used for your
    :class:`flask:flask.Flask` process

    :param host: hostname to use otherwise it will default to the output of :func:`python:socket.gethostname`
    :type host: str, optional
    :param port: port to use otherwise default to the output of :meth:`dtale.app.find_free_port`
    :type port: str, optional
    :param force: boolean flag to determine whether to ignore the :meth:`dtale.app.find_free_port` function
    :type force: bool
    :return:
    """
    global ACTIVE_HOST, ACTIVE_PORT

    if force:
        active_host = get_host(ACTIVE_HOST)
        curr_base = build_url(ACTIVE_PORT, active_host)
        final_host = get_host(host)
        new_base = build_url(port, final_host)
        if curr_base != new_base:
            if is_up(new_base):
                try:
                    kill(new_base)  # kill the original process
                except BaseException:
                    raise IOError(
                        (
                            "Could not kill process at {}, possibly something else is running at port {}. Please try "
                            "another port."
                        ).format(new_base, port)
                    )
                while is_up(new_base):
                    time.sleep(0.01)
            ACTIVE_HOST = final_host
            ACTIVE_PORT = port
            return

    if ACTIVE_HOST is None:
        ACTIVE_HOST = get_host(host)

    if ACTIVE_PORT is None:
        ACTIVE_PORT = int(port or find_free_port())


def is_port_in_use(port):
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        return s.connect_ex(("localhost", port)) == 0


def find_free_port():
    """
    Searches for free port on executing server to run the :class:`flask:flask.Flask` process. Checks ports in range
    specified using environment variables:

    DTALE_MIN_PORT (default: 40000)
    DTALE_MAX_PORT (default: 49000)

    The range limitation is required for usage in tools such as jupyterhub.  Will raise an exception if an open
    port cannot be found.

    :return: port number
    :rtype: int
    """

    min_port = int(os.environ.get("DTALE_MIN_PORT") or 40000)
    max_port = int(os.environ.get("DTALE_MAX_PORT") or 49000)
    base = min_port
    while is_port_in_use(base):
        base += 1
        if base > max_port:
            msg = (
                "D-Tale could not find an open port from {} to {}, please increase your range by altering the "
                "environment variables DTALE_MIN_PORT & DTALE_MAX_PORT."
            ).format(min_port, max_port)
            raise IOError(msg)
    return base


def build_startup_url_and_app_root(app_root=None):
    global ACTIVE_HOST, ACTIVE_PORT, JUPYTER_SERVER_PROXY, USE_COLAB

    if USE_COLAB:
        colab_host = use_colab(ACTIVE_PORT)
        if colab_host:
            return colab_host, None
    url = build_url(ACTIVE_PORT, ACTIVE_HOST)
    final_app_root = app_root
    if final_app_root is None and JUPYTER_SERVER_PROXY:
        final_app_root = "/user/{}/proxy/".format(getpass.getuser())
    if final_app_root is not None:
        if JUPYTER_SERVER_PROXY:
            final_app_root = fix_url_path("{}/{}".format(final_app_root, ACTIVE_PORT))
            return final_app_root, final_app_root
        else:
            return fix_url_path("{}/{}".format(url, final_app_root)), final_app_root
    return url, final_app_root


def use_colab(port):
    try:
        from google.colab.output import eval_js

        colab_host = eval_js(
            'google.colab.kernel.proxyPort(%d, {"cache": false})' % port
        )
        return colab_host[:-1] if colab_host.endswith("/") else colab_host
    except BaseException:
        return None


def show(data=None, data_loader=None, name=None, context_vars=None, **options):
    """
    Entry point for kicking off D-Tale :class:`flask:flask.Flask` process from python process

    :param data: data which D-Tale will display
    :type data: :class:`pandas:pandas.DataFrame` or :class:`pandas:pandas.Series`
                or :class:`pandas:pandas.DatetimeIndex` or :class:`pandas:pandas.MultiIndex`, optional
    :param host: hostname of D-Tale, defaults to 0.0.0.0
    :type host: str, optional
    :param port: port number of D-Tale process, defaults to any open port on server
    :type port: str, optional
    :param name: optional label to assign a D-Tale process
    :type name: str, optional
    :param debug: will turn on :class:`flask:flask.Flask` debug functionality, defaults to False
    :type debug: bool, optional
    :param subprocess: run D-Tale as a subprocess of your current process, defaults to True
    :type subprocess: bool, optional
    :param data_loader: function to load your data
    :type data_loader: func, optional
    :param reaper_on: turn on subprocess which will terminate D-Tale after 1 hour of inactivity
    :type reaper_on: bool, optional
    :param open_browser: if true, this will try using the :mod:`python:webbrowser` package to automatically open
                         your default browser to your D-Tale process
    :type open_browser: bool, optional
    :param notebook: if true, this will try displaying an :class:`ipython:IPython.display.IFrame`
    :type notebook: bool, optional
    :param force: if true, this will force the D-Tale instance to run on the specified host/port by killing any
                  other process running at that location
    :type force: bool, optional
    :param context_vars: a dictionary of the variables that will be available for use in user-defined expressions,
                         such as filters
    :type context_vars: dict, optional
    :param ignore_duplicate: if true, this will not check if this data matches any other data previously loaded to
                             D-Tale
    :type ignore_duplicate: bool, optional
    :param app_root: Optional path to prepend to the routes of D-Tale. This is used when making use of
                     Jupyterhub server proxy
    :type app_root: str, optional
    :param allow_cell_edits: If false, this will not allow users to edit cells directly in their D-Tale grid
    :type allow_cell_edits: bool, optional
    :param inplace: If true, this will call `reset_index(inplace=True)` on the dataframe used as a way to save memory.
                    Otherwise this will create a brand new dataframe, thus doubling memory but leaving the dataframe
                    input unchanged.
    :type inplace: bool, optional
    :param drop_index: If true, this will drop any pre-existing index on the dataframe input.
    :type drop_index: bool, optional
    :param hide_shutdown: If true, this will hide the "Shutdown" buton from users
    :type hide_shutdown: bool, optional
    :param github_fork: If true, this will display a "Fork me on GitHub" ribbon in the upper right-hand corner of the
                        app
    :type github_fork: bool, optional

    :Example:

        >>> import dtale
        >>> import pandas as pd
        >>> df = pandas.DataFrame([dict(a=1,b=2,c=3)])
        >>> dtale.show(df)
        D-Tale started at: http://hostname:port

        ..link displayed in logging can be copied and pasted into any browser
    """
    global ACTIVE_HOST, ACTIVE_PORT, USE_NGROK

    try:
        final_options = dtale_config.build_show_options(options)
        logfile, log_level, verbose = map(
            final_options.get, ["logfile", "log_level", "verbose"]
        )
        setup_logging(logfile, log_level or "info", verbose)

        if USE_NGROK:
            if not PY3:
                raise Exception(
                    "In order to use ngrok you must be using Python 3 or higher!"
                )

            from flask_ngrok import _run_ngrok

            ACTIVE_HOST = _run_ngrok()
            ACTIVE_PORT = None
        else:
            initialize_process_props(
                final_options["host"], final_options["port"], final_options["force"]
            )

        app_url = build_url(ACTIVE_PORT, ACTIVE_HOST)
        startup_url, final_app_root = build_startup_url_and_app_root(
            final_options["app_root"]
        )
        instance = startup(
            startup_url,
            data=data,
            data_loader=data_loader,
            name=name,
            context_vars=context_vars,
            ignore_duplicate=final_options["ignore_duplicate"],
            allow_cell_edits=final_options["allow_cell_edits"],
            inplace=final_options["inplace"],
            drop_index=final_options["drop_index"],
            precision=final_options["precision"],
            show_columns=final_options["show_columns"],
            hide_columns=final_options["hide_columns"],
        )
        instance.started_with_open_browser = final_options["open_browser"]
        is_active = not running_with_flask_debug() and is_up(app_url)
        if is_active:

            def _start():
                if final_options["open_browser"]:
                    instance.open_browser()

        else:
            if USE_NGROK:
                thread = Timer(1, _run_ngrok)
                thread.setDaemon(True)
                thread.start()

            def _start():
                app = build_app(
                    app_url,
                    reaper_on=final_options["reaper_on"],
                    host=ACTIVE_HOST,
                    app_root=final_app_root,
                )
                if final_options["debug"] and not USE_NGROK:
                    app.jinja_env.auto_reload = True
                    app.config["TEMPLATES_AUTO_RELOAD"] = True
                else:
                    getLogger("werkzeug").setLevel(LOG_ERROR)

                if final_options["open_browser"]:
                    instance.open_browser()

                # hide banner message in production environments
                cli = sys.modules.get("flask.cli")
                if cli is not None:
                    cli.show_server_banner = lambda *x: None

                if USE_NGROK:
                    app.run(threaded=True)
                else:
                    app.run(
                        host="0.0.0.0",
                        port=ACTIVE_PORT,
                        debug=final_options["debug"],
                        threaded=True,
                    )

        if final_options["subprocess"]:
            if is_active:
                _start()
            else:
                _thread.start_new_thread(_start, ())

            if final_options["notebook"]:
                instance.notebook()
        else:
            logger.info("D-Tale started at: {}".format(app_url))
            _start()

        return instance
    except DuplicateDataError as ex:
        print(
            "It looks like this data may have already been loaded to D-Tale based on shape and column names. Here is "
            "URL of the data that seems to match it:\n\n{}\n\nIf you still want to load this data please use the "
            "following command:\n\ndtale.show(df, ignore_duplicate=True)".format(
                DtaleData(ex.data_id, build_url(ACTIVE_PORT, ACTIVE_HOST)).main_url()
            )
        )
    return None


def instances():
    """
    Prints all urls to the current pieces of data being viewed
    """
    curr_data = global_state.get_data()

    if len(curr_data):

        def _instance_msgs():
            for data_id in curr_data:
                data_obj = DtaleData(data_id, build_url(ACTIVE_PORT, ACTIVE_HOST))
                metadata = global_state.get_metadata(data_id)
                name = metadata.get("name")
                yield [data_id, name or "", data_obj.build_main_url(data_id=data_id)]
                if name is not None:
                    yield [
                        global_state.convert_name_to_url_path(name),
                        name,
                        data_obj.build_main_url(),
                    ]

        data = pd.DataFrame(
            list(_instance_msgs()), columns=["ID", "Name", "URL"]
        ).to_string(index=False)
        print(
            (
                "To gain access to an instance object simply pass the value from 'ID' to dtale.get_instance(ID)\n\n{}"
            ).format(data)
        )
    else:
        print("currently no running instances...")


def get_instance(data_id):
    """
    Returns a :class:`dtale.views.DtaleData` object for the data_id passed as input, will return None if the data_id
    does not exist

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: :class:`dtale.views.DtaleData`
    """
    data_id_str = global_state.find_data_id(str(data_id))
    if data_id_str is not None:
        startup_url, _ = build_startup_url_and_app_root()
        return DtaleData(data_id_str, startup_url)
    return None


def offline_chart(
    df,
    chart_type=None,
    query=None,
    x=None,
    y=None,
    z=None,
    group=None,
    agg=None,
    window=None,
    rolling_comp=None,
    barmode=None,
    barsort=None,
    yaxis=None,
    filepath=None,
    title=None,
    **kwargs
):
    """
    Builds the HTML for a plotly chart figure to saved to a file or output to a jupyter notebook

    :param df: integer string identifier for a D-Tale process's data
    :type df: :class:`pandas:pandas.DataFrame`
    :param chart_type: type of chart, possible options are line|bar|pie|scatter|3d_scatter|surface|heatmap
    :type chart_type: str
    :param query: pandas dataframe query string
    :type query: str, optional
    :param x: column to use for the X-Axis
    :type x: str
    :param y: columns to use for the Y-Axes
    :type y: list of str
    :param z: column to use for the Z-Axis
    :type z: str, optional
    :param group: column(s) to use for grouping
    :type group: list of str or str, optional
    :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being applied to.
    :type agg: str, optional
    :param window: number of days to include in rolling aggregations
    :type window: int, optional
    :param rolling_comp: computation to use in rolling aggregations
    :type rolling_comp: str, optional
    :param barmode: mode to use for bar chart display. possible values are stack|group(default)|overlay|relative
    :type barmode: str, optional
    :param barsort: axis name to sort the bars in a bar chart by (default is the 'x', but other options are any of
                    columns names used in the 'y' parameter
    :type barsort: str, optional
    :param filepath: location to save HTML output
    :type filepath: str, optional
    :param title: Title of your chart
    :type title: str, optional
    :param kwargs: optional keyword arguments, here in case invalid arguments are passed to this function
    :type kwargs: dict
    :return: possible outcomes are:
             - if run within a jupyter notebook and no 'filepath' is specified it will print the resulting HTML
               within a cell in your notebook
             - if 'filepath' is specified it will save the chart to the path specified
             - otherwise it will return the HTML output as a string
    """
    instance = startup(url=None, data=df, data_id=999)
    output = instance.offline_chart(
        chart_type=chart_type,
        query=query,
        x=x,
        y=y,
        z=z,
        group=group,
        agg=agg,
        window=window,
        rolling_comp=rolling_comp,
        barmode=barmode,
        barsort=barsort,
        yaxis=yaxis,
        filepath=filepath,
        title=title,
        **kwargs
    )
    global_state.cleanup()
    return output
