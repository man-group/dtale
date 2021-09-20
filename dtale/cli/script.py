from logging import getLogger

import click
import sys

from dtale.app import find_free_port, show
from dtale.cli.clickutils import LOG_LEVELS, get_log_options, run, setup_logging
from dtale.cli.loaders import check_loaders, setup_loader_options

logger = getLogger(__name__)


def validate_allow_cell_edits(ctx, param, value):
    if "--no-cell-edits" in sys.argv:
        return value
    return None


@click.command(name="main", help="Run D-Tale from command-line")
@click.option("--host", type=str, help="hostname or IP address of process")
@click.option("--port", type=int, help="port number of process")
@click.option("--debug", is_flag=True, help="flag to switch on Flask's debug mode")
@click.option(
    "--no-reaper",
    is_flag=True,
    help="flag to turn off auto-reaping (process cleanup after period of inactivity)",
)
@click.option(
    "--open-browser",
    is_flag=True,
    help="flag to automatically open default web browser on startup",
)
@click.option("--name", type=str, help="name to apply to your D-Tale session")
@click.option(
    "--no-cell-edits",
    is_flag=True,
    callback=validate_allow_cell_edits,
    help="flag to turn off cell editing in the grid",
)
@click.option(
    "--hide-shutdown", is_flag=True, help='flag to hide "Shutdown" button from users'
)
@click.option(
    "--github-fork",
    is_flag=True,
    help='flag to show "Fork Me On GitHub" link in upper right-hand corner of the app',
)
@click.option("--app-root", type=str)
@click.option(
    "--hide-drop-rows", is_flag=True, help='flag to hide "Drop Rows" button from users'
)
@click.option(
    "--theme",
    default="light",
    type=click.Choice(["light", "dark"]),
    help='theme you would like used for D-Tale, the default is "light"',
)
@click.option(
    "--precision",
    default=2,
    type=int,
    help="Default precision displayed by columns containing float data (default: 2)",
)
@click.option(
    "--show-columns",
    help="Comma-separated string of column names you would like displayed on load",
)
@click.option(
    "--hide-columns",
    help="Comma-separated string of column names you would like hidden on load",
)
@click.option(
    "--query-engine",
    default="python",
    type=click.Choice(["python", "numexpr"]),
    help='query engine you would like used for D-Tale, the default is "python"',
)
@click.option(
    "--sort",
    help=(
        "Comma-separated string of pipe-separated column names/sort directions you would like applied on load. "
        "EX: col1|ASC,col2|DESC"
    ),
)
@click.option(
    "--locked",
    help="Comma-separated string of column names you would like locked on the left-hand side of your grid on load",
)
@setup_loader_options()
@click.option("--log", "logfile", help="Log file name")
@click.option(
    "--log-level",
    help="Set the logging level",
    type=click.Choice(list(LOG_LEVELS.keys())),
    default="info",
    show_default=True,
)
@click.option("-v", "--verbose", help="Set the logging level to debug", is_flag=True)
def main(
    host=None,
    port=None,
    debug=None,
    no_reaper=None,
    open_browser=False,
    name=None,
    no_cell_edits=None,
    hide_shutdown=None,
    github_fork=None,
    app_root=None,
    hide_drop_rows=None,
    **kwargs
):
    """
    Runs a local server for the D-Tale application.

    This local server is recommended when you have a pandas object stored in a CSV
    or retrievable from :class:`arctic.Arctic` data store.
    """
    log_opts = get_log_options(kwargs)
    setup_logging(
        log_opts.get("logfile"), log_opts.get("log_level"), log_opts.get("verbose")
    )

    data_loader = check_loaders(kwargs)

    # in order to handle the hierarchy of inputs if "--no-cell-edits" is not specified
    # then we'll update it to None
    allow_cell_edits = False if no_cell_edits is not None else None
    kwargs["show_columns"] = (
        kwargs["show_columns"].split(",") if kwargs.get("show_columns") else None
    )
    kwargs["hide_columns"] = (
        kwargs["hide_columns"].split(",") if kwargs.get("hide_columns") else None
    )
    kwargs["sort"] = (
        [tuple(sort.split("|")) for sort in kwargs["sort"].split(",")]
        if kwargs.get("sort")
        else None
    )
    kwargs["locked"] = kwargs["locked"].split(",") if kwargs.get("locked") else None
    show(
        host=host,
        port=int(port or find_free_port()),
        debug=debug,
        subprocess=False,
        data_loader=data_loader,
        reaper_on=not no_reaper,
        open_browser=open_browser,
        name=name,
        allow_cell_edits=allow_cell_edits,
        hide_shutdown=hide_shutdown,
        github_fork=github_fork,
        app_root=app_root,
        hide_drop_rows=hide_drop_rows,
        **kwargs
    )


if __name__ == "__main__":
    run(main)
