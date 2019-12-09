from logging import getLogger

import click

from dtale.app import find_free_port, show
from dtale.cli.clickutils import (LOG_LEVELS, get_log_options, run,
                                  setup_logging)
from dtale.cli.loaders import check_loaders, setup_loader_options

logger = getLogger(__name__)


@click.command(name='main', help='Run D-Tale from command-line')
@click.option('--host', type=str, help='hostname or IP address of process')
@click.option('--port', type=int, help='port number of process')
@click.option('--debug', is_flag=True, help="flag to switch on Flask's debug mode")
@click.option('--no-reaper', is_flag=True,
              help='flag to turn off auto-reaping (process cleanup after period of inactivity)')
@click.option('--open-browser', is_flag=True, help='flag to automatically open default web browser on startup')
@click.option('--name', type=str, help='name to apply to your D-Tale session')
@setup_loader_options()
@click.option('--log', 'logfile', help='Log file name')
@click.option('--log-level',
              help='Set the logging level',
              type=click.Choice(list(LOG_LEVELS.keys())),
              default='info',
              show_default=True)
@click.option('-v', '--verbose', help='Set the logging level to debug', is_flag=True)
def main(host=None, port=None, debug=False, no_reaper=False, open_browser=False, name=None, **kwargs):
    """
    Runs a local server for the D-Tale application.

    This local server is recommended when you have a pandas object stored in a CSV
    or retrievable from :class:`arctic.Arctic` data store.
    """
    log_opts = get_log_options(kwargs)
    setup_logging(log_opts.get('logfile'), log_opts.get('log_level'), log_opts.get('verbose'))

    data_loader = check_loaders(kwargs)

    show(host=host, port=int(port or find_free_port()), debug=debug, subprocess=False, data_loader=data_loader,
         reaper_on=not no_reaper, open_browser=open_browser, name=name, **kwargs)


if __name__ == '__main__':
    run(main)
