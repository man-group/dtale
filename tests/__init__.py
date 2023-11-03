from six import PY3

try:
    import pandas.util.testing as pdt
except BaseException:
    import pandas.testing as pdt  # noqa: F401


if PY3:
    from contextlib import ExitStack as ExitStack3

    ExitStack = ExitStack3
else:
    from contextlib2 import ExitStack as ExitStack2

    ExitStack = ExitStack2
