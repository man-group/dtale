import os
from collections import namedtuple
from imp import reload

import mock
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

from dtale.cli import loaders, script
from dtale.cli.clickutils import run

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_main():

    props = ['host', 'port', 'debug', 'subprocess', 'data_loader', 'reaper_on']
    with mock.patch('dtale.cli.script.show', mock.Mock()) as mock_show:
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['--host', 'test', '--port', '9999', '--csv-path', csv_path]
        script.main(args, standalone_mode=False)
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
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock()))
        mock_find_free_port = stack.enter_context(
            mock.patch('dtale.cli.script.find_free_port', mock.Mock(return_value=9999))
        )
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['--csv-path', csv_path, '--debug', '--no-reaper']
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        mock_find_free_port.assert_called_once()
        _, kwargs = mock_show.call_args
        host, port, debug, subprocess, data_loader, reaper_on = map(kwargs.get, props)
        assert host is None
        assert not subprocess
        assert debug
        assert port == 9999
        assert not reaper_on
        assert data_loader is not None
        df = data_loader()
        pdt.assert_frame_equal(df, pd.DataFrame([dict(a=1, b=2, c=3)]), 'loader should load csv')

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock()))
        mock_arctic = stack.enter_context(mock.patch('dtale.cli.loaders.arctic_loader.Arctic', mock.Mock()))
        stack.enter_context(mock.patch(
            'dtale.cli.loaders.arctic_loader.VersionedItem',
            namedtuple('versioned_item', 'VersionedItem')
        ))
        args = [
            '--port', '9999',
            '--arctic-host', 'arctic_host',
            '--arctic-library', 'arctic_lib',
            '--arctic-node', 'arctic_node',
            '--arctic-start', '20000101',
            '--arctic-end', '20000102'
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        kwargs['data_loader']()
        assert mock_arctic.call_args[0][0] == 'arctic_host'
        mock_arctic_instance = mock_arctic.return_value
        assert mock_arctic_instance.get_library.call_args[0][0] == 'arctic_lib'
        mock_arctic_lib_instance = mock_arctic_instance.get_library.return_value
        args, kwargs = mock_arctic_lib_instance.read.call_args
        assert args[0] == 'arctic_node'
        assert kwargs['chunk_range'].min() == pd.Timestamp('20000101')
        assert kwargs['chunk_range'].max() == pd.Timestamp('20000102')

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock()))
        mock_arctic = stack.enter_context(mock.patch('dtale.cli.loaders.arctic_loader.Arctic', mock.Mock()))
        stack.enter_context(mock.patch(
            'dtale.cli.loaders.arctic_loader.VersionedItem',
            namedtuple('versioned_item', 'VersionedItem')
        ))
        args = [
            '--port', '9999',
            '--arctic-host', 'arctic_host',
            '--arctic-library', 'arctic_lib',
            '--arctic-node', 'arctic_node',
        ]
        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        kwargs['data_loader']()
        mock_arctic_instance = mock_arctic.return_value
        mock_arctic_lib_instance = mock_arctic_instance.get_library.return_value
        args, kwargs = mock_arctic_lib_instance.read.call_args
        assert 'chunk_range' not in kwargs


@pytest.mark.unit
def test_run():
    props = ['host', 'port', 'debug', 'subprocess', 'data_loader', 'reaper_on']
    with ExitStack() as stack:
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        args = ['dtale.cli.py', '--host', 'test', '--port', '9999', '--csv-path', csv_path, '--log-level', 'info']
        stack.enter_context(mock.patch('sys.argv', args))
        mock_exit = stack.enter_context(mock.patch('sys.exit', mock.Mock()))
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock()))
        run(script.main)
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
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock(side_effect=Exception())))
        run(script.main)
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


@pytest.mark.unit
def test_custom_cli_loaders():

    custom_loader_path = "/../".join([os.path.dirname(__file__), 'data'])
    os.environ['DTALE_CLI_LOADERS'] = custom_loader_path

    reload(loaders)
    reload(script)

    with ExitStack() as stack:
        mock_show = stack.enter_context(mock.patch('dtale.cli.script.show', mock.Mock()))
        args = ['--port', '9999', '--testcli']

        script.main(args, standalone_mode=False)
        mock_show.assert_called_once()
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        pdt.assert_frame_equal(kwargs['data_loader'](), pd.DataFrame([dict(security_id=1, foo=1.5)]))

        mock_show.reset_mock()
        args = ['--port', '9999', '--testcli2-prop', 'foo']
        script.main(args, standalone_mode=False)
        _, kwargs = mock_show.call_args
        assert kwargs['data_loader'] is not None
        pdt.assert_frame_equal(kwargs['data_loader'](), pd.DataFrame([dict(security_id=1, foo='foo')]))


@pytest.mark.unit
def test_loader_retrieval():
    from dtale.cli.loaders import custom_module_loader

    with ExitStack() as stack:
        stack.enter_context(mock.patch('platform.python_version_tuple', mock.Mock(return_value=(2, 7, 3))))
        mock_loader = stack.enter_context(mock.patch('dtale.cli.loaders.get_py2_loader', mock.Mock()))
        custom_module_loader()('custom.loaders', 'loader.py')
        assert mock_loader.called_once()

    with ExitStack() as stack:
        stack.enter_context(mock.patch('platform.python_version_tuple', mock.Mock(return_value=(3, 0, 0))))
        with pytest.raises(Exception) as error:
            custom_module_loader()
            assert error.startswith('Unsupported version of python used for custom CLI loaders, (3, 0, 0).')

    with ExitStack() as stack:
        stack.enter_context(mock.patch('platform.python_version_tuple', mock.Mock(return_value=(3, 3, 0))))
        mock_loader = stack.enter_context(mock.patch('dtale.cli.loaders.get_py33_loader', mock.Mock()))
        custom_module_loader()('custom.loaders', 'loader.py')
        assert mock_loader.called_once()

    with ExitStack() as stack:
        stack.enter_context(mock.patch('platform.python_version_tuple', mock.Mock(return_value=(3, 6, 1))))
        mock_loader = stack.enter_context(mock.patch('dtale.cli.loaders.get_py35_loader', mock.Mock()))
        custom_module_loader()('custom.loaders', 'loader.py')
        assert mock_loader.called_once()


@pytest.mark.unit
def test_loader_retrievers():
    from dtale.cli.loaders import get_py35_loader, get_py33_loader, get_py2_loader

    orig_import = __import__
    mock_importlib_util = mock.Mock()
    mock_importlib_machinery = mock.Mock()
    mock_imp = mock.Mock()

    def import_mock(name, *args, **kwargs):
        if name == 'importlib.util':
            return mock_importlib_util
        if name == 'importlib.machinery':
            return mock_importlib_machinery
        if name == 'imp':
            return mock_imp
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        if PY3:
            stack.enter_context(mock.patch('builtins.__import__', side_effect=import_mock))
        else:
            stack.enter_context(mock.patch('__builtin__.__import__', side_effect=import_mock))

        assert get_py35_loader('custom.loaders', 'loader.py') is not None
        assert mock_importlib_util.spec_from_file_location.called_once()
        mock_spec = mock_importlib_util.spec_from_file_location.return_value
        assert mock_importlib_util.module_from_spec.called_once()
        mock_loader = mock_spec.loader.return_value
        assert mock_loader.exec_module.called_once()
        assert get_py33_loader('custom.loaders', 'loader.py') is not None
        assert mock_importlib_machinery.SourceFileLoader.called_once()
        mock_sourcefileloader = mock_importlib_machinery.SourceFileLoader.return_value
        assert mock_sourcefileloader.load_module.called_once()
        assert get_py2_loader('custom.loaders', 'loader.py') is not None
        assert mock_imp.load_source.called_once()
