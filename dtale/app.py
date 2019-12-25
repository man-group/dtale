from __future__ import absolute_import, print_function

import os
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

from dtale import dtale
from dtale.cli.clickutils import retrieve_meta_info_and_version, setup_logging
from dtale.utils import (build_shutdown_url, build_url, dict_merge, get_host,
                         running_with_flask_debug, swag_from)
from dtale.views import DATA, DtaleData, cleanup, is_up, kill, startup

if PY3:
    import _thread
else:
    import thread as _thread

logger = getLogger(__name__)

ACTIVE_HOST = None
ACTIVE_PORT = None

SHORT_LIFE_PATHS = ['dist']
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
        self.host = kwargs.pop('hostname', 'localhost')
        self.port = kwargs.pop('port', str(random.randint(0, 65535))) or str(random.randint(0, 65535))
        super(DtaleFlaskTesting, self).__init__(*args, **kwargs)

    def get(self, *args, **kwargs):
        """
        :param args: Optional arguments to be passed to :meth:`flask:flask.FlaskClient.get`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask:flask.FlaskClient.get`
        """
        return super(DtaleFlaskTesting, self).get(
            base_url='http://{host}:{port}'.format(host=self.host, port=self.port), *args, **kwargs
        )


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

    def __init__(self, import_name, reaper_on=True, url=None, *args, **kwargs):
        """
        Constructor method
        :param reaper_on: whether to run auto-reaper subprocess
        :type reaper_on: bool
        """
        self.reaper_on = reaper_on
        self.reaper = None
        self.shutdown_url = build_shutdown_url(url)
        self.port = None
        super(DtaleFlask, self).__init__(import_name, *args, **kwargs)

    def run(self, *args, **kwargs):
        """
        :param args: Optional arguments to be passed to :meth:`flask:flask.run`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask:flask.run`
        """
        self.port = str(kwargs.get('port'))
        if kwargs.get('debug', False):
            self.reaper_on = False
        self.build_reaper()
        super(DtaleFlask, self).run(use_reloader=kwargs.get('debug', False), *args, **kwargs)

    def test_client(self, reaper_on=False, port=None, *args, **kwargs):
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
        self.test_client_class = DtaleFlaskTesting
        return super(DtaleFlask, self).test_client(*args, **dict_merge(kwargs, dict(port=port)))

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
            logger.info('Executing shutdown due to inactivity...')
            requests.get(self.shutdown_url)

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


def build_app(url, reaper_on=True, hide_shutdown=False, host=None):
    """
    Builds :class:`flask:flask.Flask` application encapsulating endpoints for D-Tale's front-end

    :return: :class:`flask:flask.Flask` application
    :rtype: :class:`dtale.app.DtaleFlask`
    """

    app = DtaleFlask('dtale', reaper_on=reaper_on, static_url_path='', url=url)
    app.config['SECRET_KEY'] = 'Dtale'
    app.config['HIDE_SHUTDOWN'] = hide_shutdown

    app.jinja_env.trim_blocks = True
    app.jinja_env.lstrip_blocks = True
    app.register_blueprint(dtale)

    compress = Compress()
    compress.init_app(app)

    _, version = retrieve_meta_info_and_version('dtale')
    template = dict(
        info={
            'title': 'D-Tale',
            'version': version,
            'description': 'Web Client for Visualizing Pandas Objects',
            'contact': {
                'name': 'Man Alpha Technology',
                'email': 'ManAlphaTech@man.com',
                'url': 'https://github.com/man-group/dtale'
            },
        },
        host=get_host(host),
        schemes=['http'],
    )
    try:
        from flasgger import Swagger  # flake8: NOQA
        Swagger(app, template=template)
    except ImportError:
        logger.debug('flasgger dependency not found, please install to enable feature')

    @app.route('/')
    @app.route('/dtale')
    @swag_from('swagger/dtale/root.yml')
    def root():
        """
        :class:`flask:flask.Flask` routes which redirect to dtale/main

        :return: 302 - flask.redirect('/dtale/main')
        """
        return redirect('/dtale/main/1')

    @app.route('/favicon.ico')
    def favicon():
        """
        :class:`flask:flask.Flask` routes which returns favicon

        :return: image/png
        """
        return redirect(url_for('static', filename='images/favicon.ico'))

    @app.errorhandler(404)
    def page_not_found(e=None):
        """
        :class:`flask:flask.Flask` routes which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        logger.exception(e)
        return render_template('dtale/errors/404.html', page='', error=e,
                               stacktrace=str(traceback.format_exc())), 404

    @app.errorhandler(500)
    def internal_server_error(e=None):
        """
        :class:`flask:flask.Flask` route which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        logger.exception(e)
        return render_template('dtale/errors/500.html', page='', error=e,
                               stacktrace=str(traceback.format_exc())), 500

    def shutdown_server():
        global ACTIVE_HOST, ACTIVE_PORT
        """
        This function that checks if flask.request.environ['werkzeug.server.shutdown'] exists and
        if so, executes that function
        """
        logger.info('Executing shutdown...')
        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')
        func()
        cleanup()
        ACTIVE_PORT = None
        ACTIVE_HOST = None

    @app.route('/shutdown')
    @swag_from('swagger/dtale/shutdown.yml')
    def shutdown():
        """
        :class:`flask:flask.Flask` route for initiating server shutdown

        :return: text/html with server shutdown message
        """
        app.clear_reaper()
        shutdown_server()
        return 'Server shutting down...'

    @app.before_request
    def before_request():
        """
        Logic executed before each :attr:`flask:flask.request`

        :return: text/html with server shutdown message
        """
        app.build_reaper()

    @app.route('/site-map')
    @swag_from('swagger/dtale/site-map.yml')
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
                url = url_for(rule.endpoint, **(rule.defaults or {}))
                links.append((url, rule.endpoint))
        return jsonify(links)

    @app.route('/version-info')
    @swag_from('swagger/dtale/version-info.yml')
    def version_info():
        """
        :class:`flask:flask.Flask` route for retrieving version information about D-Tale

        :return: text/html version information
        """
        _, version = retrieve_meta_info_and_version('dtale')
        return str(version)

    @app.route('/health')
    @swag_from('swagger/dtale/health.yml')
    def health_check():
        """
        :class:`flask:flask.Flask` route for checking if D-Tale is up and running

        :return: text/html 'ok'
        """
        return 'ok'

    return app


def initialize_process_props(host=None, port=None, force=False):
    """
    Helper function to initalize global state corresponding to the host & port being used for your
    :class:`flask:flask.Flask` process

    :param host: hostname to use otherwise it will default to the output of :func:`python:socket.gethostname`
    :type host: str, optional
    :param port: port to use otherwise default to the output of :func:dtale.app.find_free_port
    :type port: str, optional
    :param force: boolean flag to determine whether to ignore the :func:dtale.app.find_free_port function
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
                    raise IOError((
                        'Could not kill process at {}, possibly something else is running at port {}. Please try '
                        'another port.'
                    ).format(new_base, port))
                while is_up(new_base):
                    time.sleep(0.01)
            ACTIVE_HOST = final_host
            ACTIVE_PORT = port
            return

    if ACTIVE_HOST is None:
        ACTIVE_HOST = get_host(host)

    if ACTIVE_PORT is None:
        ACTIVE_PORT = int(port or find_free_port())


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

    def is_port_in_use(port):
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            return s.connect_ex(('localhost', port)) == 0

    min_port = int(os.environ.get('DTALE_MIN_PORT') or 40000)
    max_port = int(os.environ.get('DTALE_MAX_PORT') or 49000)
    base = min_port
    while is_port_in_use(base):
        base += 1
        if base > max_port:
            msg = (
                'D-Tale could not find an open port from {} to {}, please increase your range by altering the '
                'environment variables DTALE_MIN_PORT & DTALE_MAX_PORT.'
            ).format(min_port, max_port)
            raise IOError(msg)
    return base


def show(data=None, host=None, port=None, name=None, debug=False, subprocess=True, data_loader=None,
         reaper_on=True, open_browser=False, notebook=False, force=False, **kwargs):
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

    :Example:

        >>> import dtale
        >>> import pandas as pd
        >>> df = pandas.DataFrame([dict(a=1,b=2,c=3)])
        >>> dtale.show(df)
        D-Tale started at: http://hostname:port

        ..link displayed in logging can be copied and pasted into any browser
    """

    logfile, log_level, verbose = map(kwargs.get, ['logfile', 'log_level', 'verbose'])
    setup_logging(logfile, log_level or 'info', verbose)

    initialize_process_props(host, port, force)
    url = build_url(ACTIVE_PORT, ACTIVE_HOST)
    instance = startup(url, data=data, data_loader=data_loader, name=name)
    is_active = not running_with_flask_debug() and is_up(url)
    if is_active:
        def _start():
            if open_browser:
                instance.open_browser()
    else:
        def _start():
            app = build_app(url, reaper_on=reaper_on, host=ACTIVE_HOST)
            if debug:
                app.jinja_env.auto_reload = True
                app.config['TEMPLATES_AUTO_RELOAD'] = True
            else:
                getLogger("werkzeug").setLevel(LOG_ERROR)

            if open_browser:
                instance.open_browser()

            # hide banner message in production environments
            cli = sys.modules.get('flask.cli')
            if cli is not None:
                cli.show_server_banner = lambda *x: None

            app.run(host='0.0.0.0', port=ACTIVE_PORT, debug=debug)

    if subprocess:
        if is_active:
            _start()
        else:
            _thread.start_new_thread(_start, ())

        if notebook:
            instance.notebook()
    else:
        logger.info('D-Tale started at: {}'.format(url))
        _start()

    return instance


def instances():
    """
    Returns a dictionary of data IDs & :class:dtale.views.DtaleData objects pertaining to all the current pieces of
    data being viewed

    :return: dict
    """
    return {data_id: DtaleData(data_id, build_url(ACTIVE_PORT, ACTIVE_HOST)) for data_id in DATA}


def get_instance(data_id):
    """
    Returns a :class:dtale.views.DtaleData object for the data_id passed as input, will return None if the data_id
    does not exist

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: :class:dtale.views.DtaleData
    """
    data_id_str = str(data_id)
    if data_id_str in DATA:
        return DtaleData(data_id_str, build_url(ACTIVE_PORT, ACTIVE_HOST))
    return None
