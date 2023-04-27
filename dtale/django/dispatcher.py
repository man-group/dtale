import sys

from threading import Lock
from werkzeug.wsgi import get_path_info

_default_encoding = sys.getdefaultencoding()


def _to_str(x, charset=_default_encoding, errors="strict", allow_none_charset=False):
    if x is None or isinstance(x, str):
        return x

    if not isinstance(x, (bytes, bytearray)):
        return str(x)

    if charset is None:
        if allow_none_charset:
            return x

    return x.decode(charset, errors)


def pop_path_info(environ, charset="utf-8", errors="replace"):
    """Removes and returns the next segment of `PATH_INFO`, pushing it onto
    `SCRIPT_NAME`.  Returns `None` if there is nothing left on `PATH_INFO`.
    If the `charset` is set to `None` bytes are returned.
    If there are empty segments (``'/foo//bar``) these are ignored but
    properly pushed to the `SCRIPT_NAME`:
    >>> env = {'SCRIPT_NAME': '/foo', 'PATH_INFO': '/a/b'}
    >>> pop_path_info(env)
    'a'
    >>> env['SCRIPT_NAME']
    '/foo/a'
    >>> pop_path_info(env)
    'b'
    >>> env['SCRIPT_NAME']
    '/foo/a/b'
    .. deprecated:: 2.2
        Will be removed in Werkzeug 2.3.
    .. versionadded:: 0.5
    .. versionchanged:: 0.9
       The path is now decoded and a charset and encoding
       parameter can be provided.
    :param environ: the WSGI environment that is modified.
    :param charset: The ``encoding`` parameter passed to
        :func:`bytes.decode`.
    :param errors: The ``errors`` paramater passed to
        :func:`bytes.decode`.
    """

    path = get_path_info(environ)
    if not path:
        return None

    script_name = environ.get("SCRIPT_NAME", "")

    # shift multiple leading slashes over
    old_path = path
    path = path.lstrip("/")
    if path != old_path:
        script_name += "/" * (len(old_path) - len(path))

    if "/" not in path:
        environ["PATH_INFO"] = ""
        environ["SCRIPT_NAME"] = script_name + path
        rv = path.encode("latin1")
    else:
        segment, path = path.split("/", 1)
        environ["PATH_INFO"] = "/{}".format(path)
        environ["SCRIPT_NAME"] = script_name + segment
        rv = segment.encode("latin1")

    return _to_str(rv, charset, errors, allow_none_charset=True)  # type: ignore


def peek_path_info(environ, charset="utf-8", errors="replace"):
    """Returns the next segment on the `PATH_INFO` or `None` if there
    is none.  Works like :func:`pop_path_info` without modifying the
    environment:
    >>> env = {'SCRIPT_NAME': '/foo', 'PATH_INFO': '/a/b'}
    >>> peek_path_info(env)
    'a'
    >>> peek_path_info(env)
    'a'
    If the `charset` is set to `None` bytes are returned.
    .. deprecated:: 2.2
        Will be removed in Werkzeug 2.3.
    .. versionadded:: 0.5
    .. versionchanged:: 0.9
       The path is now decoded and a charset and encoding
       parameter can be provided.
    :param environ: the WSGI environment that is checked.
    """

    segments = get_path_info(environ).lstrip("/").split("/", 1)
    if segments:
        return _to_str(  # type: ignore
            segments[0].encode("latin1"), charset, errors, allow_none_charset=True
        )
    return None


class PathDispatcher(object):
    def __init__(self, default_app, create_app):
        self.default_app = default_app
        self.create_app = create_app
        self.lock = Lock()
        self.instances = {}

    def get_application(self, prefix):
        with self.lock:
            app = self.instances.get(prefix)
            if app is None:
                app = self.create_app(prefix)
                if app is not None:
                    self.instances[prefix] = app
            return app

    def __call__(self, environ, start_response):
        # TODO: update to use get_path_info
        app = self.get_application(peek_path_info(environ))
        if app is not None:
            pop_path_info(environ)
        else:
            app = self.default_app
        return app(environ, start_response)
