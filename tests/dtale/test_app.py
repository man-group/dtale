from collections import namedtuple

import mock
import numpy as np
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_initialize_process_props():
    from dtale import app

    ups = [True, True, False]

    def mock_is_up(_base):
        if len(ups):
            return ups.pop(0)
        return True

    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.app.is_up', mock_is_up))
        mock_kill = stack.enter_context(mock.patch('dtale.app.kill', mock.Mock()))
        mock_sleep = stack.enter_context(mock.patch('time.sleep', mock.Mock()))
        app.initialize_process_props(host='localhost', port=40000, force=True)
        assert app.ACTIVE_HOST == 'localhost'
        assert app.ACTIVE_PORT == 40000
        app.initialize_process_props(host='localhost', port=40000, force=True)
        mock_kill.assert_called_once()
        mock_sleep.assert_called_once()
        assert app.ACTIVE_HOST == 'localhost'
        assert app.ACTIVE_PORT == 40000

    app.ACTIVE_PORT = None
    app.ACTIVE_HOST = None

    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.app.is_up', mock_is_up))
        stack.enter_context(mock.patch('dtale.app.kill', mock.Mock(side_effect=Exception('test'))))
        stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=40001)))
        with pytest.raises(IOError) as excinfo:
            app.initialize_process_props(host='localhost', port=40000, force=True)
        assert str(excinfo).endswith((
            'Could not kill process at http://localhost:40000, possibly something else is running at '
            'port 40000. Please try another port.'
        ))

    app.ACTIVE_PORT = None
    app.ACTIVE_HOST = None


@pytest.mark.unit
def test_find_free_port():
    from dtale.app import find_free_port

    with ExitStack() as stack:
        mock_socket = stack.enter_context(mock.patch('socket.socket', mock.Mock()))

        assert find_free_port() == 40000
        mock_socket.assert_called_once()
        mock_socket.return_value.connect_ex.assert_called_once()

    class MockSocket(object):
        def connect_ex(self, addr):
            (host, port) = addr
            if port == 40000:
                return 0
            return 1

        def close(self):
            pass

    with ExitStack() as stack:
        stack.enter_context(mock.patch('socket.socket', mock.Mock(return_value=MockSocket())))
        assert find_free_port() == 40001

    class MockSocket2(object):
        def connect_ex(self, _addr):
            return 0

        def close(self):
            pass

    with ExitStack() as stack:
        stack.enter_context(mock.patch('socket.socket', mock.Mock(return_value=MockSocket2())))
        with pytest.raises(IOError) as excinfo:
            find_free_port()
        assert str(excinfo).endswith((
            'D-Tale could not find an open port from 40000 to 49000, please increase your range by altering '
            'the environment variables DTALE_MIN_PORT & DTALE_MAX_PORT.'
        ))


@pytest.mark.unit
def test_show(unittest):
    from dtale.app import show
    import dtale.views as views

    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        mock_find_free_port = stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='localhost')))
        stack.enter_context(mock.patch('dtale.app.is_up', mock.Mock(return_value=False)))
        mock_requests = stack.enter_context(mock.patch('requests.get', mock.Mock()))
        instance = show(data=test_data, subprocess=False, name='foo')
        mock_run.assert_called_once()
        mock_find_free_port.assert_called_once()

        pdt.assert_frame_equal(instance.data, test_data)
        tmp = test_data.copy()
        tmp['biz'] = 2.5
        instance.data = tmp
        unittest.assertEqual(
            views.DTYPES[instance._data_id],
            views.build_dtypes_state(tmp),
            'should update app data/dtypes'
        )

        instance.kill()
        mock_requests.assert_called_once()
        mock_requests.call_args[0][0] == 'http://localhost:9999/shutdown'
        assert views.METADATA['1']['name'] == 'foo'

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        mock_find_free_port = stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('dtale.app.is_up', mock.Mock(return_value=False)))
        mock_data_loader = mock.Mock(return_value=test_data)
        instance = show(data_loader=mock_data_loader, subprocess=False, port=9999, force=True, debug=True)
        mock_run.assert_called_once()
        mock_find_free_port.assert_not_called()
        mock_data_loader.assert_called_once()
        _, kwargs = mock_run.call_args

        assert '9999' in instance._url

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='localhost')))
        stack.enter_context(mock.patch('dtale.app.is_up', mock.Mock(return_value=True)))
        mock_data_loader = mock.Mock(return_value=test_data)
        mock_webbrowser = stack.enter_context(mock.patch('webbrowser.get'))
        instance = show(data_loader=mock_data_loader, subprocess=False, port=9999, open_browser=True)
        mock_run.assert_not_called()
        webbrowser_instance = mock_webbrowser.return_value
        assert 'http://localhost:9999/dtale/main/3' == webbrowser_instance.open.call_args[0][0]
        instance.open_browser()
        assert 'http://localhost:9999/dtale/main/3' == webbrowser_instance.open.mock_calls[1][1][0]

    # RangeIndex test
    test_data = pd.DataFrame([1, 2, 3])
    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='localhost')))
        stack.enter_context(mock.patch('dtale.app.is_up', mock.Mock(return_value=False)))
        stack.enter_context(mock.patch('dtale.app.logger', mock.Mock()))
        instance = show(data=test_data, subprocess=False, name='foo')
        assert np.array_equal(instance.data['0'].values, test_data[0].values)

    builtin_pkg = '__builtin__'
    if PY3:
        builtin_pkg = 'builtins'

    orig_import = __import__

    mock_swaggu = mock.Mock()

    def import_mock(name, *args, **kwargs):
        if name == 'flasgger':
            return mock_swaggu
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.__import__'.format(builtin_pkg), side_effect=import_mock))
        stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='localhost')))
        stack.enter_context(mock.patch('dtale.app.is_up', mock.Mock(return_value=False)))
        stack.enter_context(mock.patch('dtale.app.logger', mock.Mock()))
        stack.enter_context(mock.patch('dtale.views.in_ipython_frontend', mock.Mock(return_value=False)))

        get_calls = {'ct': 0}
        getter = namedtuple('get', 'ok')

        def mock_requests_get(url, verify=True):
            if url.endswith('/health'):
                is_ok = get_calls['ct'] > 0
                get_calls['ct'] += 1
                return getter(is_ok)
            return getter(True)
        stack.enter_context(mock.patch('requests.get', mock_requests_get))
        mock_display = stack.enter_context(mock.patch('IPython.display.display', mock.Mock()))
        mock_iframe = stack.enter_context(mock.patch('IPython.display.IFrame', mock.Mock()))
        instance = show(data=test_data, subprocess=True, name='foo', notebook=True)
        mock_display.assert_called_once()
        mock_iframe.assert_called_once()
        assert mock_iframe.call_args[0][0] == 'http://localhost:9999/dtale/iframe/5'

        assert type(instance.__str__()).__name__ == 'str'
        assert type(instance.__repr__()).__name__ == 'str'

    def mock_run(self, *args, **kwargs):
        assert self.jinja_env.auto_reload
        assert self.config['TEMPLATES_AUTO_RELOAD']

    with mock.patch('dtale.app.DtaleFlask.run', mock_run):
        show(data=test_data, subprocess=False, port=9999, debug=True)

    with mock.patch('dtale.app._thread.start_new_thread', mock.Mock()) as mock_thread:
        show(data=test_data, subprocess=True)
        mock_thread.assert_called()
    # cleanup
    views.DATA = {}
    views.DTYPES = {}
    views.SETTINGS = {}
    views.METADATA = {}


@pytest.mark.unit
def test_DtaleFlask():
    from dtale.app import DtaleFlask, REAPER_TIMEOUT

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('flask.Flask.run', mock.Mock()))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer'))

        tmp = DtaleFlask('dtale', static_url_path='', url='http://test:9999')
        tmp.run(port='9999')

        assert tmp.reaper_on
        assert tmp.shutdown_url == 'http://test:9999/shutdown'
        mock_timer.assert_called_once()
        args, _ = mock_timer.call_args
        assert args[0] == REAPER_TIMEOUT
        mock_run.assert_called_once()
        assert tmp.reaper is not None
        timer_instance = mock_timer.return_value
        timer_instance.start.assert_called_once()

        tmp.clear_reaper()
        timer_instance.cancel.assert_called_once()

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('flask.Flask.run', mock.Mock()))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer', mock.Mock()))

        tmp = DtaleFlask('dtale', static_url_path='', reaper_on=False)
        tmp.run(port='9999')

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('flask.Flask.run', mock.Mock()))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer', mock.Mock()))

        tmp = DtaleFlask('dtale', static_url_path='')
        tmp.run(debug=True, port='9999')

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()
