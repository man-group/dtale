import mock
import pandas as pd
import pytest
from six import PY3

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_show():
    from dtale.app import show
    import dtale.views as views

    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        mock_find_free_port = stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        stack.enter_context(mock.patch('socket.gethostname', mock.Mock(return_value='localhost')))
        mock_logger = stack.enter_context(mock.patch('dtale.app.logger', mock.Mock()))
        show(data=test_data, subprocess=False)
        mock_run.assert_called_once()
        mock_find_free_port.assert_called_once()
        assert mock_logger.info.call_args[0][0] == 'D-Tale started at: http://localhost:9999'

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('dtale.app.DtaleFlask.run', mock.Mock()))
        mock_find_free_port = stack.enter_context(mock.patch('dtale.app.find_free_port', mock.Mock(return_value=9999)))
        mock_data_loader = mock.Mock(return_value=test_data)
        show(data_loader=mock_data_loader, subprocess=False, port=9999, debug=True)
        mock_run.assert_called_once()
        mock_find_free_port.assert_not_called()
        mock_data_loader.assert_called_once()
        _, kwargs = mock_run.call_args

    def mock_run(self, *args, **kwargs):
        assert self.jinja_env.auto_reload
        assert self.config['TEMPLATES_AUTO_RELOAD']

    with mock.patch('dtale.app.DtaleFlask.run', mock_run):
        show(data=test_data, subprocess=False, port=9999, debug=True)

    with mock.patch('dtale.app._thread.start_new_thread', mock.Mock()) as mock_thread:
        show(data=test_data, subprocess=True)
        mock_thread.assert_called()
    # cleanup
    views.DATA = None
    views.SETTINGS = {}


@pytest.mark.unit
def test_find_free_port():
    from dtale.app import find_free_port

    assert find_free_port() is not None


@pytest.mark.unit
def test_DtaleFlask():
    from dtale.app import DtaleFlask, REAPER_TIMEOUT

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('flask.Flask.run', mock.Mock()))
        stack.enter_context(mock.patch('dtale.app.socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer'))

        tmp = DtaleFlask('dtale', static_url_path='')
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
        stack.enter_context(mock.patch('dtale.app.socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer', mock.Mock()))

        tmp = DtaleFlask('dtale', static_url_path='')
        tmp.run(reaper_on=False, port='9999')

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()

    with ExitStack() as stack:
        mock_run = stack.enter_context(mock.patch('flask.Flask.run', mock.Mock()))
        stack.enter_context(mock.patch('dtale.app.socket.gethostname', mock.Mock(return_value='test')))
        mock_timer = stack.enter_context(mock.patch('dtale.app.Timer', mock.Mock()))

        tmp = DtaleFlask('dtale', static_url_path='')
        tmp.run(debug=True, port='9999')

        mock_run.assert_called_once()
        assert not tmp.reaper_on
        mock_timer.assert_not_called()
