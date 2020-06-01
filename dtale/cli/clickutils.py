import logging
import socket
import sys
from builtins import str
from datetime import datetime

import click
import pkg_resources
from six import string_types

logger = logging.getLogger(__name__)

LOG_LEVELS = dict(
    debug=logging.DEBUG, info=logging.INFO, warning=logging.WARNING, error=logging.ERROR, critical=logging.CRITICAL
)


def setup_logging(logfile, log_level, verbose=False):
    """
    Utility method for setting up logging configuration

    :param logfile: location of D-Tale logs
    :type logfile: str
    :param log_level: D-Tale's implementation of standard logging levels
    :type log_level: str, options are debug, info, warning, error or, critical
    :param verbose: turns on verbose logging, defaults to False
    :type verbose: bool, optional
    :return:
    """

    if log_level == 'verbose' or verbose:
        log_level = LOG_LEVELS['debug']
    elif log_level:
        log_level = LOG_LEVELS[log_level]
    else:
        log_level = LOG_LEVELS['info']

    # for pkg in ['_plotly_utils', 'asyncio', 'concurrent', 'matplotlib', 'parso', 'past', 'prompt_toolkit', 'requests',
    #             'tornado', 'urllib3']:
    #     logging.getLogger(pkg).propagate = True

    logging.getLogger().handlers = []

    fmt = "%(asctime)s - %(levelname)-8s - %(message)s"
    try:
        logging.basicConfig(format=fmt, level=log_level)
    except BaseException:
        # #202: when using Pyzo IDE the basicConfig has already been set and if you try to set it again
        # then it will cause a maximum recursion exception
        logging.getLogger().setLevel(log_level)

    if logfile:
        fh = logging.FileHandler(logfile, mode='w')
        fh.setFormatter(logging.Formatter(fmt))
        logging.getLogger().addHandler(fh)

    for handler in logging.getLogger().handlers:
        handler.setLevel(log_level)
        handler.setFormatter(logging.Formatter(fmt))

    logger.debug("{}".format(' '.join(sys.argv)))
    try:
        logger.debug("Hostname: {}".format(socket.gethostname()))
    except Exception as e:
        logger.exception(e)


def loader_options(key, params):
    """
    Builds a decorator which will append a list of click parameters based on
    a combination of prefix & parameter name

    loader_options('foo', ['bar', 'baz']) => click.option('--foo-bar'), click.option('--foo-baz')

    :param key: parameter prefix
    :type key: str
    :param params: parameters names
    :type params: list
    :return: filter
    :rtype: func
    """
    def decorator(f):
        for p in params:
            f = click.option('--' + key + '-' + p, help='Override {} {}'.format(key, p))(f)
        return f
    return decorator


def get_loader_options(key, options):
    """
    Filters dictionary of click parameters for ones which start with a certain prefix

    :param key: click option prefix
    :type key: str
    :param options: click options
    :type options: dict
    :return: dictionary of click options with start with key
    :rtype: dict
    """

    def _build_key(option):
        segs = option.split('_')
        if len(segs) == 1:
            return ''
        return '_'.join(segs[1:])
    return dict(((_build_key(k), v) for k, v in options.items() if k.startswith(key) if v is not None))


def get_log_options(options):
    """
    Click logging options (logfile, log_level, verbose)
    """
    names = ['logfile', 'log_level', 'verbose']
    return get_named_options(names, options)


def get_named_options(names, options):
    """
    Filters click options for options in a specific subset of names
    """
    return {k: v for k, v in options.items() if k in names}


def retrieve_meta_info_and_version(name):
    """
    Retrieves meta information and versioning of specific package name
    """
    try:
        dist = pkg_resources.get_distribution(name)
    except BaseException:
        return None, 'unknown'
    try:
        for line in dist._get_metadata(dist.PKG_INFO):
            if line.startswith('Description:'):
                return line[len('Description:'):].strip(), dist.version
    except BaseException:
        pass
    return None, dist.version


def get_args(click_wrapper):
    """
    Retrieves arguments being passed in from the command-line and applying them to a click command

    :param click_wrapper: click context
    :return: list of arguments
    :rtype: list
    """

    # Get the options defined on cli
    params = []
    for opt in click_wrapper.params:
        params.extend(opt.opts)

    args = sys.argv[1:]

    # Reorder the args so that cli options come before
    # subcommand options. This is a click limitation.
    head, tail = [], []
    for a in args:
        if a in params or head and head[-1] in params:
            head.append(a)
        else:
            tail.append(a)
    return head + tail


def run(click_wrapper):
    """
    Wrapper function for executing click commands and handling exceptions produced from
    click commands with versioning boilerplate

    :param click_wrapper: click context
    """

    t1 = datetime.now()
    try:
        try:
            dtale_name = 'dtale'
            bld_info, ver_info = retrieve_meta_info_and_version(dtale_name)
            logger.debug('{} bld: {}'.format(dtale_name, bld_info))
            logger.debug('{} ver: {}'.format(dtale_name, ver_info))
        except BaseException:
            logger.debug('failure to retrieve metadata for: {}'.format(dtale_name))

        args = get_args(click_wrapper)
        click_wrapper(args)
        sys.exit(0)
    except Exception as ex:
        logger.exception("Fatal error: " + str(ex))
        sys.exit(1)
    finally:
        logger.info("Elapsed time: %s" % (datetime.now() - t1))


def loader_prop_keys(prop_cfgs):
    return [p if isinstance(p, string_types) else p['name'] for p in prop_cfgs]
