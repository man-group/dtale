import os
import platform
from logging import getLogger

import click

from dtale.cli.loaders import arctic_loader, csv_loader

logger = getLogger(__name__)


def build_custom_module_loader_args(fname, path):
    return 'dtale.cli.loaders.{}'.format(fname), '{}/{}.py'.format(path, fname)


def get_py35_loader(fname, path):
    """
    Utility function for loading dynamic modules (CLI configurations) when python_version >= 3.5

    """
    import importlib.util

    spec = importlib.util.spec_from_file_location(*build_custom_module_loader_args(fname, path))
    custom_loader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(custom_loader)
    return custom_loader


def get_py33_loader(fname, path):
    """
    Utility function for loading dynamic modules (CLI configurations) when python_version in (3.3, 3.4)

    """
    from importlib.machinery import SourceFileLoader
    return SourceFileLoader(*build_custom_module_loader_args(fname, path)).load_module()


def get_py2_loader(fname, path):
    """
    Utility function for loading dynamic modules (CLI configurations) when python_version < 3

    """
    import imp
    return imp.load_source(*build_custom_module_loader_args(fname, path))


def unsupported_python_version(version_tuple):
    return (
        'Unsupported version of python used for custom CLI loaders, {}. If you do not plan on using any custom '
        'CLI loaders please remove your DTALE_CLI_LOADERS environment variable.'
    ).format(version_tuple)


def custom_module_loader():
    """
    Utility function for using different module loaders based on python version:
    * :func:dtale.cli.loaders.get_py35_loader
    * :func:dtale.cli.loaders.get_py33_loader
    * :func:dtale.cli.loaders.get_py2_loader

    """
    major, minor, revision = [int(i) for i in platform.python_version_tuple()]
    if major == 2:
        return get_py2_loader
    if major == 3:
        if minor >= 5:
            return get_py35_loader
        elif minor in (3, 4):
            return get_py33_loader
    raise ValueError(unsupported_python_version(platform.python_version_tuple()))


LOADERS = {
    arctic_loader.LOADER_KEY: arctic_loader,
    csv_loader.LOADER_KEY: csv_loader
}


def build_loaders():
    """
    Utility function executed at runtime to load dynamic CLI options from the environment variable, DTALE_CLI_LOADERS.
    You either override one of the two default loader configurations, arctic or csv, or create a brand new
    configuration which can be referenced from the command line.

    """
    global LOADERS

    custom_loader_path = os.environ.get('DTALE_CLI_LOADERS')
    if custom_loader_path is not None:
        custom_loader_func = custom_module_loader()
        for full_filename in os.listdir(custom_loader_path):
            filename, file_extension = os.path.splitext(full_filename)
            if file_extension == '.py':
                custom_loader = custom_loader_func(filename, custom_loader_path)
                if hasattr(custom_loader, 'LOADER_KEY') and hasattr(custom_loader, 'LOADER_PROPS'):
                    LOADERS[custom_loader.LOADER_KEY] = custom_loader


def setup_loader_options():
    """
    Utility function executed at runtime to find dynamic CLI options as well as the defaults and create their
    `click` decorators to keyword arguments will be processed accordingly.

    """
    build_loaders()

    def decorator(f):
        for cli_loader in LOADERS.values():
            if len(cli_loader.LOADER_PROPS):
                for p in cli_loader.LOADER_PROPS:
                    f = click.option(
                        '--' + cli_loader.LOADER_KEY + '-' + p, help='Override {} {}'.format(cli_loader.LOADER_KEY, p)
                    )(f)
            else:
                f = click.option(
                    '--' + cli_loader.LOADER_KEY, is_flag=True,
                    help='Use {} loader'.format(cli_loader.LOADER_KEY)
                )(f)
        return f
    return decorator


def check_loaders(kwargs):
    """
    Utility function to find which CLI loader is being used based on the `click` options/flags provided from the
    command line

    """
    for cli_loader in LOADERS.values():
        cli_loader_func = cli_loader.find_loader(kwargs)
        if cli_loader_func is not None:
            return cli_loader_func
    return None
