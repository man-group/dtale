import os
from collections import namedtuple

import mock
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

from dtale.cli import main
from dtale.clickutils import run

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_main():

    props = ['host', 'port', 'debug', 'subprocess', 'data_loader', 'reaper_on']
    with mock.patch('dtale.cli.show', mock.Mock()) as mock_show:
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['--host', 'test', '--port', '9999', '--csv-path', csv_path]
        main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == 'test'
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.show', mock.Mock()))
        mock_find_free_port = stack.enter_context(mock.patch('dtale.cli.find_free_port', mock.Mock(return_value=9999)))
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['--csv-path', csv_path, '--debug', '--no-reaper']
        main(args, standalone_mode=False)
        mock_show.assert_called_once()
        mock_find_free_port.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == '0.0.0.0'
        assert not subprocess
        assert debug
        assert port == 9999
        assert not reaper_on
        assert data_loader is not None
        df = data_loader()
        pdt.assert_frame_equal(df, pd.DataFrame([dict(a=1, b=2, c=3)]), 'loader should load csv')

    orig_import = __import__
    mock_arctic = mock.Mock()
    versioned_item = namedtuple('versioned_item', 'VersionedItem')

    def import_mock(name, *args, **kwargs):
        if name == 'arctic':
            return mock_arctic
        if name == 'arctic.store.versioned_item':
            return versioned_item(mock.Mock)
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.show', mock.Mock()))
        if PY3:
            stack.enter_context(mock.patch('builtins.__import__', side_effect=import_mock))
        else:
            stack.enter_context(mock.patch('__builtin__.__import__', side_effect=import_mock))
        args = [
            '--port', '9999',
            '--arctic-host', 'arctic_host',
            '--arctic-library', 'arctic_lib',
            '--arctic-node', 'arctic_node',
            '--arctic-start', '20000101',
            '--arctic-end', '20000102'
        ]
        main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        kwargs['data_loader']()
        assert mock_arctic.Arctic.call_args[0][0] == 'arctic_host'
        mock_arctic_instance = mock_arctic.Arctic.return_value
        assert mock_arctic_instance.get_library.call_args[0][0] == 'arctic_lib'
        mock_arctic_lib_instance = mock_arctic_instance.get_library.return_value
        args, kwargs = mock_arctic_lib_instance.read.call_args
        assert args[0] == 'arctic_node'
        assert kwargs['chunk_range'].min() == pd.Timestamp('20000101')
        assert kwargs['chunk_range'].max() == pd.Timestamp('20000102')

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.show', mock.Mock()))
        if PY3:
            stack.enter_context(mock.patch('builtins.__import__', side_effect=import_mock))
        else:
            stack.enter_context(mock.patch('__builtin__.__import__', side_effect=import_mock))
        args = [
            '--port', '9999',
            '--arctic-host', 'arctic_host',
            '--arctic-library', 'arctic_lib',
            '--arctic-node', 'arctic_node',
        ]
        main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        kwargs['data_loader']()
        mock_arctic_instance = mock_arctic.Arctic.return_value
        mock_arctic_lib_instance = mock_arctic_instance.get_library.return_value
        args, kwargs = mock_arctic_lib_instance.read.call_args
        assert 'chunk_range' not in kwargs


@pytest.mark.unit
def test_run():
    props = ['host', 'port', 'debug', 'subprocess', 'data_loader', 'reaper_on']
    with ExitStack() as stack:
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['dtale.clie.py', '--host', 'test', '--port', '9999', '--csv-path', csv_path, '--log-level', 'info']
        stack.enter_context(mock.patch('sys.argv', args))
        mock_exit = stack.enter_context(mock.patch('sys.exit', mock.Mock()))
        mock_show = stack.enter_context(mock.patch('dtale.cli.show', mock.Mock()))
        run(main)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == 'test'
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert mock_exit.called_with(0)

    with ExitStack() as stack:
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['dtale.cli.py', '--host', 'test', '--port', '9999', '--csv-path', csv_path]
        stack.enter_context(mock.patch('sys.argv', args))
        mock_exit = stack.enter_context(mock.patch('sys.exit', mock.Mock()))
        mock_show = stack.enter_context(mock.patch('dtale.cli.show', mock.Mock(side_effect=Exception())))
        run(main)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host == 'test'
        assert not subprocess
        assert not debug
        assert port == 9999
        assert reaper_on
        assert data_loader is not None
        assert mock_exit.called_with(1)
