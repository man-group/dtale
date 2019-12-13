import mock
import pandas as pd
import pytest
from six import PY3

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_ipython_import_error():
    from dtale.views import DtaleData

    builtin_pkg = '__builtin__'
    if PY3:
        builtin_pkg = 'builtins'

    orig_import = __import__

    def import_mock(name, *args, **kwargs):
        if name in ['IPython', 'IPython.display']:
            raise ImportError
        if name == 'requests':
            raise ImportError
        return orig_import(name, *args, **kwargs)

    df = pd.DataFrame([1, 2, 3])
    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.__import__'.format(builtin_pkg), side_effect=import_mock))
        stack.enter_context(mock.patch('dtale.views.in_ipython_frontend', return_value=False))
        stack.enter_context(mock.patch('dtale.views.DATA', {9999: df}))
        instance = DtaleData(9999, 'http://localhost:9999')

        assert not instance.is_up()
        assert instance._build_iframe() is None
        assert instance.notebook() == df.__repr__()
        assert str(instance) == str(df)
        assert instance.__repr__() == 'http://localhost:9999/dtale/main/9999'
        instance.adjust_cell_dimensions(width=5, height=5)

        instance._notebook_handle = mock.Mock()
        instance._build_iframe = mock.Mock()
        instance.adjust_cell_dimensions(width=5, height=5)
        instance._notebook_handle.update.assert_called_once()
        instance._build_iframe.assert_called_once()
        assert {'width': 5, 'height': 5} == instance._build_iframe.call_args[1]

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.__import__'.format(builtin_pkg), side_effect=import_mock))
        stack.enter_context(mock.patch('dtale.views.in_ipython_frontend', return_value=True))
        stack.enter_context(mock.patch('dtale.views.DATA', return_value={9999: df}))
        instance = DtaleData(9999, 'http://localhost:9999')

        instance.notebook = mock.Mock()
        assert str(instance) == ''
        instance.notebook.assert_called_once()
        instance.notebook.reset_mock()
        assert instance.__repr__() == 'http://localhost:9999/dtale/main/9999'
        instance.notebook.assert_called_once()
