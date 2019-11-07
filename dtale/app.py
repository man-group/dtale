from __future__ import absolute_import, print_function

import random
import socket
import traceback
import webbrowser
from builtins import map, str
from contextlib import closing
from logging import ERROR as LOG_ERROR
from logging import getLogger
from threading import Timer

from flask import Flask, jsonify, redirect, render_template, request, url_for
from flask.testing import FlaskClient

import requests
from flasgger import Swagger
from flasgger.utils import swag_from
from flask_compress import Compress
from six import PY3

from dtale import dtale
from dtale.cli.clickutils import retrieve_meta_info_and_version, setup_logging
from dtale.utils import build_shutdown_url, build_url, dict_merge
from dtale.views import cleanup, startup

if PY3:
    import _thread
else:
    import thread as _thread

logger = getLogger(__name__)

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

    :param args: Optional arguments to be passed to :class:`flask.FlaskClient`
    :param kwargs: Optional keyword arguments to be passed to :class:`flask.FlaskClient`
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
        :param args: Optional arguments to be passed to :meth:`flask.FlaskClient.get`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask.FlaskClient.get`
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
    :param args: Optional arguments to be passed to :class:`flask.Flask`
    :param kwargs: Optional keyword arguments to be passed to :class:`flask.Flask`
    """

    def __init__(self, import_name, reaper_on=True, *args, **kwargs):
        """
        Constructor method
        :param reaper_on: whether to run auto-reaper subprocess
        :type reaper_on: bool
        """
        self.reaper_on = reaper_on
        self.reaper = None
        self.shutdown_url = None
        self.port = None
        super(DtaleFlask, self).__init__(import_name, *args, **kwargs)

    def run(self, *args, **kwargs):
        """
        :param args: Optional arguments to be passed to :meth:`flask.run`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask.run`
        """
        self.port = str(kwargs.get('port'))
        self.shutdown_url = build_shutdown_url(self.port)
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
        :param args: Optional arguments to be passed to :meth:`flask.Flask.test_client`
        :param kwargs: Optional keyword arguments to be passed to :meth:`flask.Flask.test_client`
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


def build_app(reaper_on=True, hide_shutdown=False):
    """
    Builds Flask application encapsulating endpoints for D-Tale's front-end

    :return: Flask application
    :rtype: :class:`dtale.app.DtaleFlask`
    """

    app = DtaleFlask('dtale', reaper_on=reaper_on, static_url_path='')
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
        host=socket.gethostname(),
        schemes=['http'],
    )
    Swagger(app, template=template)

    @app.route('/')
    @app.route('/dtale')
    @swag_from('./swagger/dtale/root.yml')
    def root():
        """
        Flask routes which redirect to dtale/main

        :return: 302 - flask.redirect('/dtale/main')
        """
        return redirect('/dtale/main')

    @app.route('/favicon.ico')
    def favicon():
        """
        Flask routes which returns favicon

        :return: image/png
        """
        return redirect(url_for('static', filename='images/favicon.ico'))

    @app.errorhandler(404)
    def page_not_found(e=None):
        """
        Flask routes which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        logger.exception(e)
        return render_template('dtale/errors/404.html', page='', error=e,
                               stacktrace=str(traceback.format_exc())), 404

    @app.errorhandler(500)
    def internal_server_error(e=None):
        """
        Flask route which returns favicon

        :param e: exception
        :return: text/html with exception information
        """
        logger.exception(e)
        return render_template('dtale/errors/500.html', page='', error=e,
                               stacktrace=str(traceback.format_exc())), 500

    def shutdown_server():
        """
        This function that checks if flask.request.environ['werkzeug.server.shutdown'] exists and
        if so, executes that function
        """
        logger.info('Executing shutdown...')
        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')
        func()
        cleanup(app.port)

    @app.route('/shutdown')
    @swag_from('swagger/dtale/shutdown.yml')
    def shutdown():
        """
        Flask route for initiating server shutdown

        :return: text/html with server shutdown message
        """
        app.clear_reaper()
        shutdown_server()
        return 'Server shutting down...'

    @app.before_request
    def before_request():
        """
        Logic executed before each flask request

        :return: text/html with server shutdown message
        """
        app.build_reaper()

    @app.route('/site-map')
    @swag_from('swagger/dtale/site-map.yml')
    def site_map():
        """
        Flask route listing all available flask endpoints

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
        Flask route for retrieving version information about D-Tale

        :return: text/html version information
        """
        _, version = retrieve_meta_info_and_version('dtale')
        return str(version)

    return app


def find_free_port():
    """
    Searches for free port on executing server for running Flask process

    :return: string port number
    """
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(('', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]


def show(data=None, host='0.0.0.0', port=None, name=None, debug=False, subprocess=True, data_loader=None,
         reaper_on=True, open_browser=False, **kwargs):
    """
    Entry point for kicking off D-Tale Flask process from python process

    :param data: data which D-Tale will display
    :type data: Union[:class:`pandas.DataFrame`, :class:`pandas.Series`], optional
    :param host: hostname of D-Tale, defaults to 0.0.0.0
    :type host: str, optional
    :param port: port number of D-Tale process, defaults to any open port on server
    :type port: str, optional
    :param name: optional label to assign a D-Tale process
    :type name: str, optional
    :param debug: will turn on Flask debug functionality, defaults to False
    :type debug: bool, optional
    :param subprocess: run D-Tale as a subprocess of your current process, defaults to True
    :type subprocess: bool, optional
    :param data_loader: function to load your data
    :type data_loader: func, optional
    :param reaper_on: turn on subprocess which will terminate D-Tale after 1 hour of inactivity
    :type reaper_on: bool, optional
    :param open_browser: if true, this will try using the webbrowser package to automatically open you default
                         browser to your D-Tale process
    :type open_browser: bool, optional

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

    selected_port = int(port or find_free_port())
    data_hook = startup(data=data, data_loader=data_loader, port=selected_port, name=name)

    def _show():
        app = build_app(reaper_on=reaper_on)
        if debug:
            app.jinja_env.auto_reload = True
            app.config['TEMPLATES_AUTO_RELOAD'] = True
        else:
            getLogger("werkzeug").setLevel(LOG_ERROR)
        logger.info('D-Tale started at: {}'.format(build_url(selected_port)))
        if open_browser:
            webbrowser.get().open(build_url(selected_port))
        app.run(host=host, port=selected_port, debug=debug)

    if subprocess:
        _thread.start_new_thread(_show, ())
    else:
        _show()

    return data_hook
