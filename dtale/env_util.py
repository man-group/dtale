import os
import platform
import subprocess


_system = platform.system()
IS_WINDOWS = _system == "Windows"
IS_DARWIN = _system == "Darwin"
IS_LINUX_OR_BSD = (_system == "Linux") or ("BSD" in _system)


def is_executable_in_path(name):
    """Check if executable is in OS path."""
    from distutils.spawn import find_executable

    return find_executable(name) is not None


def _open_browser_with_webbrowser(url):
    import webbrowser

    webbrowser.open(url)


def _open_browser_with_command(command, url):
    cmd_line = [command, url]
    with open(os.devnull, "w") as devnull:
        subprocess.Popen(cmd_line, stdout=devnull, stderr=subprocess.STDOUT)


def open_browser(url):
    """Open a web browser pointing to a given URL.

    We use this function instead of Python's `webbrowser` module because this
    way we can capture stdout/stderr to avoid polluting the terminal with the
    browser's messages. For example, Chrome always prints things like "Created
    new window in existing browser session", and those get on the user's way.

    url : str
        The URL. Must include the protocol.

    """

    # Treat Windows separately because:
    # 1. /dev/null doesn't exist.
    # 2. subprocess.Popen(['start', url]) doesn't actually pop up the
    #    browser even though 'start url' works from the command prompt.
    # Fun!
    # Also, use webbrowser if we are on Linux and xdg-open is not installed.
    #
    # We don't use the webbrowser module on Linux and Mac because some browsers
    # (ahem... Chrome) always print "Opening in existing browser session" to
    # the terminal, which is spammy and annoying. So instead we start the
    # browser ourselves and send all its output to /dev/null.

    if IS_WINDOWS:
        _open_browser_with_webbrowser(url)
        return
    if IS_LINUX_OR_BSD:
        if is_executable_in_path("xdg-open"):
            _open_browser_with_command("xdg-open", url)
            return
        _open_browser_with_webbrowser(url)
        return
    if IS_DARWIN:
        _open_browser_with_command("open", url)
        return

    import platform

    raise Error('Cannot open browser in platform "%s"' % platform.system())


class Error(Exception):
    pass
