from builtins import map
from logging import getLogger

import click
import pandas as pd

from dtale.app import find_free_port, show
from dtale.clickutils import (LOG_LEVELS, get_loader_options, get_log_options,
                              loader_options, run, setup_logging)

logger = getLogger(__name__)


@click.command(name='main', help='Run dtale from command-line')
@click.option('--host', type=str, default='0.0.0.0')
@click.option('--port', type=int)
@click.option('--debug', is_flag=True)
@click.option('--no-reaper', is_flag=True)
@loader_options('arctic', ['host', 'library', 'node', 'start', 'end'])
@loader_options('csv', ['path', 'parse_dates'])
@click.option('--log', 'logfile', help='Log file name')
@click.option('--log-level',
              help='Set the logging level',
              type=click.Choice(list(LOG_LEVELS.keys())),
              default='info',
              show_default=True)
@click.option('-v', '--verbose', help='Set the logging level to debug', is_flag=True)
def main(host, port=None, debug=False, no_reaper=False, **kwargs):
    """
    Runs a local server for the D-Tale application.

    This local server is recommended when you have a pandas object stored in a CSV
    or retrievable from :class:`arctic.Arctic` data store.
    """
    log_opts = get_log_options(kwargs)
    setup_logging(log_opts.get('logfile'), log_opts.get('log_level'), log_opts.get('verbose'))

    # Setup arctic loader
    arctic_opts = get_loader_options('arctic', kwargs)
    if len([f for f in arctic_opts.values() if f]):
        def _arctic_loader():
            try:
                from arctic import Arctic
                from arctic.store.versioned_item import VersionedItem
            except BaseException as ex:
                logger.exception('In order to use the arctic loader you must install ahl.core!')
                raise ex
            host = Arctic(arctic_opts['host'])
            lib = host.get_library(arctic_opts['library'])
            read_kwargs = {}
            start, end = map(arctic_opts.get, ['start', 'end'])
            if start and end:
                read_kwargs['chunk_range'] = pd.date_range(start, end)
            data = lib.read(arctic_opts['node'], **read_kwargs)
            if isinstance(data, VersionedItem):
                data = data.data
            return data

        data_loader = _arctic_loader

    # Setup csv loader
    csv_opts = get_loader_options('csv', kwargs)
    if len([f for f in csv_opts.values() if f]):
        def _csv_loader():
            csv_arg_parsers = {  # TODO: add additional arg parsers
                'parse_dates': lambda v: v.split(',') if v else None
            }
            kwargs = {k: csv_arg_parsers.get(k, lambda v: v)(v) for k, v in csv_opts.items() if k != 'path'}
            return pd.read_csv(csv_opts['path'], **kwargs)
        data_loader = _csv_loader

    show(host=host, port=int(port or find_free_port()), debug=debug, subprocess=False, data_loader=data_loader,
         reaper_on=not no_reaper, **kwargs)


if __name__ == '__main__':
    run(main)
