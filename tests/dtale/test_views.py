import json
from builtins import str

import mock
import numpy as np
import pandas as pd
import pandas.util.testing as pdt
import pytest
from pandas.tseries.offsets import Day
from six import PY3

from dtale.app import build_app
from dtale.utils import DuplicateDataError

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack

URL = 'http://localhost:40000'
app = build_app(url=URL)


@pytest.mark.unit
def test_head_data_id():
    import dtale.views as views

    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.global_state.DATA', {'1': None, '2': None}))
        assert views.head_data_id() == '1'

    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.global_state.DATA', {}))
        with pytest.raises(Exception) as error:
            views.head_data_id()
            assert error.startswith('No data associated with this D-Tale session')


@pytest.mark.unit
def test_startup(unittest):
    import dtale.views as views
    import dtale.global_state as global_state

    with pytest.raises(BaseException) as error:
        views.startup(URL)
    assert 'data loaded is None!' in str(error.value)

    with pytest.raises(BaseException) as error:
        views.startup(URL, dict())
    assert 'data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex'\
           in str(error.value)

    test_data = pd.DataFrame([dict(date=pd.Timestamp('now'), security_id=1, foo=1.5)])
    test_data = test_data.set_index(['date', 'security_id'])
    instance = views.startup(URL, data_loader=lambda: test_data)

    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(global_state.SETTINGS[instance._data_id], dict(locked=['date', 'security_id']),
                         'should lock index columns')

    test_data = test_data.reset_index()
    with pytest.raises(DuplicateDataError):
        views.startup(URL, data=test_data)

    instance = views.startup(URL, data=test_data, ignore_duplicate=True)
    pdt.assert_frame_equal(instance.data, test_data)
    unittest.assertEqual(global_state.SETTINGS[instance._data_id], dict(locked=[]), 'no index = nothing locked')

    test_data = pd.DataFrame([dict(date=pd.Timestamp('now'), security_id=1)])
    test_data = test_data.set_index('security_id').date
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(global_state.SETTINGS[instance._data_id], dict(locked=['security_id']),
                         'should lock index columns')

    test_data = pd.DatetimeIndex([pd.Timestamp('now')], name='date')
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(global_state.SETTINGS[instance._data_id], dict(locked=[]), 'should lock index columns')

    test_data = pd.MultiIndex.from_arrays([[1, 2], [3, 4]], names=('a', 'b'))
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(global_state.SETTINGS[instance._data_id], dict(locked=[]), 'should lock index columns')

    test_data = pd.DataFrame([
        dict(date=pd.Timestamp('now'), security_id=1, foo=1.0, bar=2.0),
        dict(date=pd.Timestamp('now'), security_id=1, foo=2.0, bar=np.inf)
    ], columns=['date', 'security_id', 'foo', 'bar'])
    instance = views.startup(URL, data_loader=lambda: test_data)
    unittest.assertEqual(
        {'name': 'bar', 'dtype': 'float64', 'index': 3, 'visible': True},
        next((dt for dt in global_state.DTYPES[instance._data_id] if dt['name'] == 'bar'), None),
    )

    test_data = pd.DataFrame([dict(a=1, b=2)])
    test_data = test_data.rename(columns={'b': 'a'})
    with pytest.raises(Exception) as error:
        views.startup(URL, data_loader=lambda: test_data)
    assert 'data contains duplicated column names: a' in str(error)


@pytest.mark.unit
def test_in_ipython_frontend(builtin_pkg):
    import dtale.views as views

    orig_import = __import__

    mock_ipython = mock.Mock()

    class zmq(object):
        __name__ = 'zmq'

        def __init__(self):
            pass

    mock_ipython.get_ipython = lambda: zmq()

    def import_mock(name, *args, **kwargs):
        if name == 'IPython':
            return mock_ipython
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.__import__'.format(builtin_pkg), side_effect=import_mock))
        assert views.in_ipython_frontend()

    def import_mock(name, *args, **kwargs):
        if name == 'IPython':
            raise ImportError()
        return orig_import(name, *args, **kwargs)

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.__import__'.format(builtin_pkg), side_effect=import_mock))
        assert not views.in_ipython_frontend()


@pytest.mark.unit
def test_shutdown(unittest):
    with app.test_client() as c:
        try:
            c.get('/shutdown')
            unittest.fail()
        except:  # noqa
            pass
        mock_shutdown = mock.Mock()
        resp = c.get('/shutdown', environ_base={'werkzeug.server.shutdown': mock_shutdown}).data
        assert 'Server shutting down...' in str(resp)
        mock_shutdown.assert_called()


@pytest.mark.unit
def test_get_send_file_max_age():
    with app.app_context():
        assert 43200 == app.get_send_file_max_age('test')
        assert 60 == app.get_send_file_max_age('dist/test.js')


@pytest.mark.unit
def test_processes(test_data, unittest):
    from dtale.views import build_dtypes_state

    now = pd.Timestamp('20180430 12:36:44').tz_localize('US/Eastern')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: build_dtypes_state(test_data)}))
            stack.enter_context(mock.patch('dtale.global_state.METADATA', {c.port: dict(start=now, name='foo')}))
            response = c.get('/dtale/processes')
            response_data = json.loads(response.data)
            unittest.assertEqual(
                [{
                    'rows': 50,
                    'name': u'foo',
                    'ts': 1525106204000,
                    'start': '2018-04-30 12:36:44',
                    'names': u'date,security_id,foo,bar,baz',
                    'data_id': c.port,
                    'columns': 5
                }],
                response_data['data']
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: build_dtypes_state(test_data)}))
            stack.enter_context(mock.patch('dtale.global_state.METADATA', {}))
            response = c.get('/dtale/processes')
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_update_settings(unittest):
    settings = json.dumps(dict(locked=['a', 'b']))

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: None}))
            mock_render_template = stack.enter_context(mock.patch(
                'dtale.views.render_template', mock.Mock(return_value=json.dumps(dict(success=True)))
            ))
            response = c.get('/dtale/update-settings/{}'.format(c.port), query_string=dict(settings=settings))
            assert response.status_code == 200, 'should return 200 response'

            c.get('/dtale/main/{}'.format(c.port))
            _, kwargs = mock_render_template.call_args
            unittest.assertEqual(kwargs['settings'], settings, 'settings should be retrieved')

    settings = 'a'
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: None}))
            response = c.get('/dtale/update-settings/{}'.format(c.port), query_string=dict(settings=settings))
            assert response.status_code == 200, 'should return 200 response'
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_update_column_position():
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    tests = [
        ('front', 0),
        ('front', 0),
        ('left', 0),
        ('back', -1),
        ('back', -1),
        ('left', -2),
        ('right', -1),
        ('right', -1),
    ]
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            for action, col_idx in tests:
                c.get('/dtale/update-column-position/{}'.format(c.port), query_string=dict(action=action, col='c'))
                assert data[c.port].columns[col_idx] == 'c'
                assert dtypes[c.port][col_idx]['name'] == 'c'

            resp = c.get('/dtale/update-column-position/-1')
            assert 'error' in json.loads(resp.data)


@pytest.mark.unit
def test_update_locked(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        settings = {c.port: dict(locked=[])}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))

            c.get('/dtale/update-locked/{}'.format(c.port), query_string=dict(action='lock', col='c'))
            unittest.assertEqual(['c'], settings[c.port]['locked'])
            assert data[c.port].columns[0] == 'c'
            assert dtypes[c.port][0]['name'] == 'c'

            c.get('/dtale/update-locked/{}'.format(c.port), query_string=dict(action='lock', col='c'))
            unittest.assertEqual(['c'], settings[c.port]['locked'])
            assert data[c.port].columns[0] == 'c'
            assert dtypes[c.port][0]['name'] == 'c'

            c.get('/dtale/update-locked/{}'.format(c.port), query_string=dict(action='unlock', col='c'))
            unittest.assertEqual([], settings[c.port]['locked'])
            assert data[c.port].columns[0] == 'c'
            assert dtypes[c.port][0]['name'] == 'c'

            resp = c.get('/dtale/update-locked/-1')
            assert 'error' in json.loads(resp.data)


@pytest.mark.unit
def test_delete_col(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            settings = {c.port: {'locked': ['a']}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            c.get('/dtale/delete-col/{}/a'.format(c.port))
            assert 'a' not in data[c.port].columns
            assert next((dt for dt in dtypes[c.port] if dt['name'] == 'a'), None) is None
            assert len(settings[c.port]['locked']) == 0

            resp = c.get('/dtale/delete-col/-1/d'.format(c.port))
            assert 'error' in json.loads(resp.data)


@pytest.mark.unit
def test_outliers(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame.from_dict({
        'a': [1, 2, 3, 4, 1000, 5, 3, 5, 55, 12, 13, 10000, 221, 12, 2000],
        'b': list(range(15)),
        'c': ['a'] * 15
    })
    with app.test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            settings = {c.port: {'locked': ['a']}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            dtypes = {c.port: build_dtypes_state(df)}
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            resp = c.get('/dtale/outliers/{}/a'.format(c.port))
            resp = json.loads(resp.data)
            unittest.assertEqual(resp['outliers'], [1000, 10000, 2000])
            c.get('/dtale/save-column-filter/{}/a'.format(c.port), query_string=dict(
                cfg=json.dumps(dict(type='outliers', query=resp['query']))
            ))
            resp = c.get('/dtale/outliers/{}/a'.format(c.port))
            resp = json.loads(resp.data)
            assert resp['queryApplied']
            c.get('/dtale/save-column-filter/{}/a'.format(c.port), query_string=dict(
                cfg=json.dumps(dict(type='outliers'))
            ))
            resp = c.get('/dtale/outliers/{}/a'.format(c.port))
            resp = json.loads(resp.data)
            assert not resp['queryApplied']
            resp = c.get('/dtale/outliers/{}/b'.format(c.port))
            resp = json.loads(resp.data)
            unittest.assertEqual(resp['outliers'], [])
            resp = c.get('/dtale/outliers/{}/c'.format(c.port))
            resp = json.loads(resp.data)
            assert 'error' in resp


@pytest.mark.unit
def test_update_visibility(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            c.post(
                '/dtale/update-visibility/{}'.format(c.port),
                data=dict(visibility=json.dumps({'a': True, 'b': True, 'c': False})),
            )
            unittest.assertEqual([True, True, False], [col['visible'] for col in dtypes[c.port]])
            c.post('/dtale/update-visibility/{}'.format(c.port), data=dict(toggle='c'))
            unittest.assertEqual([True, True, True], [col['visible'] for col in dtypes[c.port]])

            resp = c.post('/dtale/update-visibility/-1', data=dict(toggle='foo'))
            assert 'error' in json.loads(resp.data)


@pytest.mark.unit
def test_build_column(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3, d=pd.Timestamp('20200101'))])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            resp = c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='not_implemented', name='test', cfg=json.dumps({}))
            )
            response_data = json.loads(resp.data)
            assert response_data['error'] == "'not_implemented' column builder not implemented yet!"

            resp = c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', cfg=json.dumps({}))
            )
            response_data = json.loads(resp.data)
            assert response_data['error'] == "'name' is required for new column!"

            cfg = dict(left=dict(col='a'), right=dict(col='b'), operation='sum')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='sum', cfg=json.dumps(cfg))
            )
            assert data[c.port]['sum'].values[0] == 3
            assert dtypes[c.port][-1]['name'] == 'sum'
            assert dtypes[c.port][-1]['dtype'] == 'int64'

            resp = c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='sum', cfg=json.dumps(cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['error'] == "A column named 'sum' already exists!"

            cfg = dict(left=dict(col='a'), right=dict(col='b'), operation='difference')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='diff', cfg=json.dumps(cfg))
            )
            assert data[c.port]['diff'].values[0] == -1
            assert dtypes[c.port][-1]['name'] == 'diff'
            assert dtypes[c.port][-1]['dtype'] == 'int64'
            cfg = dict(left=dict(col='a'), right=dict(col='b'), operation='multiply')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='mult', cfg=json.dumps(cfg))
            )
            assert data[c.port]['mult'].values[0] == 2
            assert dtypes[c.port][-1]['name'] == 'mult'
            assert dtypes[c.port][-1]['dtype'] == 'int64'
            cfg = dict(left=dict(col='a'), right=dict(col='b'), operation='divide')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='div', cfg=json.dumps(cfg))
            )
            assert data[c.port]['div'].values[0] == 0.5
            assert dtypes[c.port][-1]['name'] == 'div'
            assert dtypes[c.port][-1]['dtype'] == 'float64'
            cfg = dict(left=dict(col='a'), right=dict(val=100), operation='divide')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='div2', cfg=json.dumps(cfg))
            )
            assert data[c.port]['div2'].values[0] == 0.01
            assert dtypes[c.port][-1]['name'] == 'div2'
            assert dtypes[c.port][-1]['dtype'] == 'float64'
            cfg = dict(left=dict(val=100), right=dict(col='b'), operation='divide')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='numeric', name='div3', cfg=json.dumps(cfg))
            )
            assert data[c.port]['div3'].values[0] == 50
            assert dtypes[c.port][-1]['name'] == 'div3'
            assert dtypes[c.port][-1]['dtype'] == 'float64'

            cfg = dict(col='d', property='weekday')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='datetime', name='datep', cfg=json.dumps(cfg))
            )
            assert data[c.port]['datep'].values[0] == 2
            assert dtypes[c.port][-1]['name'] == 'datep'
            assert dtypes[c.port][-1]['dtype'] == 'int64'

            for p in ['minute', 'hour', 'time', 'date', 'month', 'quarter', 'year']:
                c.get(
                    '/dtale/build-column/{}'.format(c.port),
                    query_string=dict(type='datetime', name=p, cfg=json.dumps(dict(col='d', property=p)))
                )

            cfg = dict(col='d', conversion='month_end')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='datetime', name='month_end', cfg=json.dumps(cfg))
            )
            assert pd.Timestamp(data[c.port]['month_end'].values[0]).strftime('%Y%m%d') == '20200131'
            assert dtypes[c.port][-1]['name'] == 'month_end'
            assert dtypes[c.port][-1]['dtype'] == 'datetime64[ns]'

            for conv in ['month_start', 'quarter_start', 'quarter_end', 'year_start', 'year_end']:
                c.get(
                    '/dtale/build-column/{}'.format(c.port),
                    query_string=dict(type='datetime', name=conv, cfg=json.dumps(dict(col='d', conversion=conv)))
                )

            response = c.get('/dtale/code-export/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            for dt in ['float', 'int', 'string', 'date', 'bool', 'choice']:
                c.get(
                    '/dtale/build-column/{}'.format(c.port),
                    query_string=dict(type='random', name='random_{}'.format(dt), cfg=json.dumps(dict(type=dt)))
                )

            cfg = dict(type='string', chars='ABCD')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='random', name='random_string2', cfg=json.dumps(cfg))
            )

            cfg = dict(type='date', timestamps=True, businessDay=True)
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='random', name='random_date2', cfg=json.dumps(cfg))
            )

            response = c.get('/dtale/code-export/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']


@pytest.mark.unit
def test_build_column_bins(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(np.random.randn(100, 3), columns=['a', 'b', 'c'])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            cfg = dict(col='a', operation='cut', bins=4)
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='cut', cfg=json.dumps(cfg))
            )
            assert data[c.port]['cut'].values[0] is not None
            assert dtypes[c.port][-1]['name'] == 'cut'
            assert dtypes[c.port][-1]['dtype'] == 'string'

            cfg = dict(col='a', operation='cut', bins=4, labels='foo,bar,biz,baz')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='cut2', cfg=json.dumps(cfg))
            )
            assert data[c.port]['cut2'].values[0] in ['foo', 'bar', 'biz', 'baz']
            assert dtypes[c.port][-1]['name'] == 'cut2'
            assert dtypes[c.port][-1]['dtype'] == 'string'

            cfg = dict(col='a', operation='qcut', bins=4)
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='qcut', cfg=json.dumps(cfg))
            )
            assert data[c.port]['qcut'].values[0] is not None
            assert dtypes[c.port][-1]['name'] == 'qcut'
            assert dtypes[c.port][-1]['dtype'] == 'string'

            cfg = dict(col='a', operation='qcut', bins=4, labels='foo,bar,biz,baz')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='qcut2', cfg=json.dumps(cfg))
            )
            assert data[c.port]['qcut2'].values[0] in ['foo', 'bar', 'biz', 'baz']
            assert dtypes[c.port][-1]['name'] == 'qcut2'
            assert dtypes[c.port][-1]['dtype'] == 'string'


@pytest.mark.unit
def test_cleanup_error(unittest):
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.cleanup', mock.Mock(side_effect=Exception)))
            resp = c.get('/dtale/cleanup/1')
            assert 'error' in json.loads(resp.data)


@pytest.mark.unit
@pytest.mark.parametrize('custom_data', [dict(rows=1000, cols=3)], indirect=True)
def test_reshape(custom_data, unittest):
    from dtale.views import build_dtypes_state

    with app.test_client() as c:
        data = {c.port: custom_data}
        dtypes = {c.port: build_dtypes_state(custom_data)}
        settings = {c.port: {}}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', data))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', dtypes))
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            reshape_cfg = dict(index='date', columns='security_id', values=['Col0'])
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='pivot', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            new_key = str(int(c.port) + 1)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual([d['name'] for d in dtypes[new_key]], ['date', '100000', '100001'])
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None

            resp = c.get('/dtale/cleanup/{}'.format(new_key))
            assert json.loads(resp.data)['success']
            assert len(data.keys()) == 1

            reshape_cfg['columnNameHeaders'] = True
            reshape_cfg['aggfunc'] = 'sum'
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='pivot', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual(
                [d['name'] for d in dtypes[new_key]],
                ['date', 'security_id-100000', 'security_id-100001']
            )
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg['columnNameHeaders'] = False
            reshape_cfg['values'] = ['Col0', 'Col1']
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='pivot', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual(
                [d['name'] for d in dtypes[new_key]],
                ['date', 'Col0 100000', 'Col0 100001', 'Col1 100000', 'Col1 100001']
            )
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg = dict(index='date', agg=dict(type='col', cols={'Col0': ['sum', 'mean'], 'Col1': ['count']}))
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='aggregate', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual([d['name'] for d in dtypes[new_key]], ['date', 'Col0 sum', 'Col0 mean', 'Col1 count'])
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg = dict(index='date', agg=dict(type='func', func='mean', cols=['Col0', 'Col1']))
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='aggregate', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual([d['name'] for d in dtypes[new_key]], ['date', 'Col0', 'Col1'])
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg = dict(index='date', agg=dict(type='func', func='mean'))
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='aggregate', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual(
                [d['name'] for d in dtypes[new_key]],
                ['date', 'security_id', 'int_val', 'Col0', 'Col1', 'Col2', 'bool_val']
            )
            assert len(data[new_key]) == 365
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg = dict(index=['security_id'], columns=['Col0'])
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='transpose', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert 'error' in response_data

            min_date = custom_data['date'].min().strftime('%Y-%m-%d')
            settings[c.port] = dict(query="date == '{}'".format(min_date))
            reshape_cfg = dict(index=['date', 'security_id'], columns=['Col0'])
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='new', type='transpose', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == new_key
            assert len(data.keys()) == 2
            unittest.assertEqual(
                [d['name'] for d in dtypes[new_key]],
                ['{} 00:00:00 100000'.format(min_date), '{} 00:00:00 100001'.format(min_date)]
            )
            assert len(data[new_key]) == 1
            assert settings[new_key].get('startup_code') is not None
            c.get('/dtale/cleanup/{}'.format(new_key))

            reshape_cfg = dict(index=['date', 'security_id'])
            resp = c.get(
                '/dtale/reshape/{}'.format(c.port),
                query_string=dict(output='override', type='transpose', cfg=json.dumps(reshape_cfg))
            )
            response_data = json.loads(resp.data)
            assert response_data['data_id'] == c.port


@pytest.mark.unit
def test_dtypes(test_data):
    from dtale.views import build_dtypes_state, format_data

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: build_dtypes_state(test_data)}))
            response = c.get('/dtale/dtypes/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            for col in test_data.columns:
                response = c.get('/dtale/describe/{}/{}'.format(c.port, col))
                response_data = json.loads(response.data)
                assert response_data['success']

    lots_of_groups = pd.DataFrame([dict(a=i, b=1) for i in range(150)])
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: lots_of_groups}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: build_dtypes_state(lots_of_groups)}))
            response = c.get('/dtale/dtypes/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/describe/{}/{}'.format(c.port, 'a'))
            response_data = json.loads(response.data)
            assert response_data['uniques']['top']
            assert response_data['success']

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.get_dtypes', side_effect=Exception))
            response = c.get('/dtale/dtypes/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert 'error' in response_data

            response = c.get('/dtale/describe/{}/foo'.format(c.port))
            response_data = json.loads(response.data)
            assert 'error' in response_data

    df = pd.DataFrame([
        dict(date=pd.Timestamp('now'), security_id=1, foo=1.0, bar=2.0),
        dict(date=pd.Timestamp('now'), security_id=1, foo=2.0, bar=np.inf)
    ], columns=['date', 'security_id', 'foo', 'bar'])
    df, _ = format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: build_dtypes_state(df)}))
            response = c.get('/dtale/describe/{}/{}'.format(c.port, 'bar'))
            response_data = json.loads(response.data)
            assert response_data['describe']['min'] == '2'
            assert response_data['describe']['max'] == 'inf'


@pytest.mark.unit
def test_test_filter(test_data):
    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query='date == date'))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query='foo == 1'))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query="date == '20000101'"))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query="baz == 'baz'"))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query="bar > 1.5"))
            response_data = json.loads(response.data)
            assert not response_data['success']
            assert response_data['error'] == 'query "bar > 1.5" found no data, please alter'

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query='foo2 == 1'))
            response_data = json.loads(response.data)
            assert 'error' in response_data

            response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query=None, save='true'))
            response_data = json.loads(response.data)
            assert response_data['success']
    if PY3:
        df = pd.DataFrame([dict(a=1)])
        df['a.b'] = 2
        with app.test_client() as c:
            with mock.patch('dtale.global_state.DATA', {c.port: df}):
                response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query='a.b == 2'))
                response_data = json.loads(response.data)
                assert response_data['success']


@pytest.mark.unit
def test_get_data(unittest, test_data):
    import dtale.views as views
    import dtale.global_state as global_state

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/data/{}'.format(c.port))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data, {}, 'if no "ids" parameter an empty dict should be returned')

            response = c.get('/dtale/data/{}'.format(c.port), query_string=dict(ids=json.dumps(['1'])))
            response_data = json.loads(response.data)
            expected = dict(
                total=50,
                results={'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz')},
                columns=[
                    dict(dtype='int64', name='dtale_index', visible=True),
                    dict(dtype='datetime64[ns]', name='date', index=0, visible=True),
                    dict(dtype='int64', name='security_id', max=49, min=0, index=1, visible=True),
                    dict(dtype='int64', name='foo', min=1, max=1, index=2, visible=True),
                    dict(dtype='float64', name='bar', min=1.5, max=1.5, index=3, visible=True),
                    dict(dtype='string', name='baz', index=4, visible=True),
                ]
            )
            unittest.assertEqual(response_data, expected, 'should return data at index 1')

            response = c.get('/dtale/data/{}'.format(c.port), query_string=dict(ids=json.dumps(['1-2'])))
            response_data = json.loads(response.data)
            expected = {
                '1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz'),
                '2': dict(date='2000-01-01', security_id=2, dtale_index=2, foo=1, bar=1.5, baz='baz'),
            }
            unittest.assertEqual(response_data['results'], expected, 'should return data at indexes 1-2')

            params = dict(ids=json.dumps(['1']), sort=json.dumps([['security_id', 'DESC']]))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {'1': dict(date='2000-01-01', security_id=48, dtale_index=1, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(global_state.SETTINGS[c.port], {'sort': [['security_id', 'DESC']]},
                                 'should update settings')

            params = dict(ids=json.dumps(['1']), sort=json.dumps([['security_id', 'ASC']]))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(global_state.SETTINGS[c.port], {'sort': [['security_id', 'ASC']]},
                                 'should update settings')

            response = c.get('/dtale/code-export/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter/{}'.format(c.port),
                             query_string=dict(query='security_id == 1', save='true'))
            response_data = json.loads(response.data)
            assert response_data['success']
            unittest.assertEqual(global_state.SETTINGS[c.port]['query'], 'security_id == 1', 'should update settings')

            params = dict(ids=json.dumps(['0']))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {'0': dict(date='2000-01-01', security_id=1, dtale_index=0, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')

            response = c.get('/dtale/code-export/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            global_state.SETTINGS[c.port]['query'] = 'security_id == 50'
            params = dict(ids=json.dumps(['0']))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert len(response_data['results']) == 0

            response = c.get('/dtale/data-export/{}'.format(c.port))
            assert response.content_type == 'text/csv'

            response = c.get('/dtale/data-export/{}'.format(c.port), query_string=dict(tsv='true'))
            assert response.content_type == 'text/tsv'

            response = c.get('/dtale/data-export/a', query_string=dict(tsv='true'))
            response_data = json.loads(response.data)
            assert 'error' in response_data

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS',
                                           {c.port: dict(query="missing_col == 'blah'")}))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=dict(ids=json.dumps(['0'])))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle data exception'
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            mocked_data = stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            mocked_dtypes = stack.enter_context(
                mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)})
            )
            response = c.get('/dtale/data/{}'.format(c.port), query_string=dict(ids=json.dumps(['1'])))
            assert response.status_code == 200

            tmp = mocked_data[c.port].copy()
            tmp['biz'] = 2.5
            mocked_data[c.port] = tmp
            response = c.get('/dtale/data/{}'.format(c.port), query_string=dict(ids=json.dumps(['1'])))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['results'],
                {'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz', biz=2.5)},
                'should handle data updates'
            )
            unittest.assertEqual(
                mocked_dtypes[c.port][-1],
                dict(index=5, name='biz', dtype='float64', min=2.5, max=2.5, visible=True),
                'should update dtypes on data structure change'
            )


HISTOGRAM_CODE = '''# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import numpy as np
import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

chart = np.histogram(df[~pd.isnull(df['foo'])][['foo']], bins=20)
# main statistics
stats = df['foo'].describe().to_frame().T'''


@pytest.mark.unit
def test_get_column_analysis(unittest, test_data):
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            settings = {c.port: {}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            response = c.get('/dtale/column-analysis/{}'.format(c.port), query_string=dict(col='foo'))
            response_data = json.loads(response.data)
            expected = dict(
                labels=[
                    '0.5', '0.6', '0.6', '0.7', '0.7', '0.8', '0.8', '0.9', '0.9', '0.9', '1.0', '1.1', '1.1', '1.1',
                    '1.2', '1.2', '1.3', '1.4', '1.4', '1.5', '1.5'
                ],
                data=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                desc={
                    'count': '50', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                },
                cols=None,
                chart_type='histogram',
                dtype='int64',
                query=''
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return 20-bin histogram for foo'
            )
            unittest.assertEqual(response_data['code'], HISTOGRAM_CODE)

            response = c.get('/dtale/column-analysis/{}'.format(c.port), query_string=dict(col='foo', bins=5))
            response_data = json.loads(response.data)
            expected = dict(
                labels=['0.5', '0.7', '0.9', '1.1', '1.3', '1.5'],
                data=[0, 0, 50, 0, 0],
                desc={
                    'count': '50', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                },
                chart_type='histogram',
                dtype='int64',
                cols=None,
                query=''
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return 5-bin histogram for foo'
            )
            settings[c.port] = dict(query='security_id > 10')
            response = c.get('/dtale/column-analysis/{}'.format(c.port),
                             query_string=dict(col='foo', bins=5))
            response_data = json.loads(response.data)
            expected = dict(
                labels=['0.5', '0.7', '0.9', '1.1', '1.3', '1.5'],
                data=[0, 0, 39, 0, 0],
                desc={
                    'count': '39', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                },
                chart_type='histogram',
                dtype='int64',
                cols=None,
                query='security_id > 10'
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return a filtered 5-bin histogram for foo'
            )
            settings[c.port] = dict()
            response = c.get(
                '/dtale/column-analysis/{}'.format(c.port),
                query_string=dict(col='foo', type='value_counts', top=2)
            )
            response_data = json.loads(response.data)
            assert response_data['chart_type'] == 'value_counts'

            response = c.get(
                '/dtale/column-analysis/{}'.format(c.port),
                query_string=dict(col='foo', type='value_counts', ordinalCol='bar', ordinalAgg='mean')
            )
            response_data = json.loads(response.data)
            assert 'ordinal' in response_data

            response = c.get(
                '/dtale/column-analysis/{}'.format(c.port),
                query_string=dict(col='foo', type='value_counts', ordinalCol='bar', ordinalAgg='pctsum')
            )
            response_data = json.loads(response.data)
            assert 'ordinal' in response_data

            response = c.get(
                '/dtale/column-analysis/{}'.format(c.port),
                query_string=dict(col='bar', type='categories', categoryCol='foo', categoryAgg='mean')
            )
            response_data = json.loads(response.data)
            assert 'count' in response_data

            response = c.get(
                '/dtale/column-analysis/{}'.format(c.port),
                query_string=dict(col='bar', type='categories', categoryCol='foo', categoryAgg='pctsum')
            )
            response_data = json.loads(response.data)
            assert 'count' in response_data

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('numpy.histogram', mock.Mock(side_effect=Exception('histogram failure'))))

            response = c.get('/dtale/column-analysis/{}'.format(c.port), query_string=dict(col='foo'))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], 'histogram failure', 'should handle histogram exception')


CORRELATIONS_CODE = '''# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import numpy as np
import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

corr_cols = [
\t'security_id', 'foo', 'bar'
]
corr_data = np.corrcoef(df[corr_cols].values, rowvar=False)
corr_data = pd.DataFrame(corr_data, columns=[corr_cols], index=[corr_cols])
corr_data.index.name = str('column')
corr_data = corr_data.reset_index()'''


@pytest.mark.unit
def test_get_correlations(unittest, test_data, rolling_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=[]
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return correlations'
            )
            unittest.assertEqual(response_data['code'], CORRELATIONS_CODE)

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            settings = {c.port: {'query': "missing_col == 'blah'"}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data.loc[test_data.security_id == 1, 'bar'] = np.nan
            test_data2 = test_data.copy()
            test_data2.loc[:, 'date'] = pd.Timestamp('20000102')
            test_data = pd.concat([test_data, test_data2], ignore_index=True)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            expected = expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=[dict(name='date', rolling=False)]
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return correlations'
            )

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['dates'],
                [dict(name='date', rolling=True)],
                'should return correlation date columns'
            )


def build_ts_data(size=5, days=5):
    start = pd.Timestamp('20000101')
    for d in pd.date_range(start, start + Day(days - 1)):
        for i in range(size):
            yield dict(date=d, security_id=i, foo=i, bar=i)


CORRELATIONS_TS_CODE = '''# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

corr_ts = df.groupby('date')['foo', 'bar'].corr(method='pearson')
corr_ts.index.names = ['date', 'column']
corr_ts = corr_ts[corr_ts.column == 'foo'][['date', 'bar']]

corr_ts.columns = ['date', 'corr']'''


@pytest.mark.unit
def test_get_correlations_ts(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(size=50), columns=['date', 'security_id', 'foo', 'bar'])

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            params = dict(
                dateCol='date',
                cols=json.dumps(['foo', 'bar'])
            )
            response = c.get('/dtale/correlations-ts/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {
                'data': {'all': {
                    'x': ['2000-01-01', '2000-01-02', '2000-01-03', '2000-01-04', '2000-01-05'],
                    'corr': [1.0, 1.0, 1.0, 1.0, 1.0]
                }},
                'max': {'corr': 1.0, 'x': '2000-01-05'},
                'min': {'corr': 1.0, 'x': '2000-01-01'},
                'success': True,
            }
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return timeseries correlation'
            )
            unittest.assertEqual(response_data['code'], CORRELATIONS_TS_CODE)

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(dateCol='date', cols=json.dumps(['0', '1']), rollingWindow='4')
            response = c.get('/dtale/correlations-ts/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['success'], True, 'should return rolling correlation')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            settings = {c.port: {'query': "missing_col == 'blah'"}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            response = c.get('/dtale/correlations-ts/{}'.format(c.port))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )


SCATTER_CODE = '''# DISCLAIMER: 'df' refers to the data you passed in when calling 'dtale.show'

import pandas as pd

if isinstance(df, (pd.DatetimeIndex, pd.MultiIndex)):
\tdf = df.to_frame(index=False)

# remove any pre-existing indices for ease of use in the D-Tale code, but this is not required
df = df.reset_index().drop('index', axis=1, errors='ignore')
df.columns = [str(c) for c in df.columns]  # update columns to strings in case they are numbers

scatter_data = df[df['date'] == '20000101']
scatter_data = scatter_data['foo', 'bar'].dropna(how='any')
scatter_data['index'] = scatter_data.index
s0 = scatter_data['foo']
s1 = scatter_data['bar']
pearson = s0.corr(s1, method='pearson')
spearman = s0.corr(s1, method='spearman')
only_in_s0 = len(scatter_data[scatter_data['foo'].isnull()])
only_in_s1 = len(scatter_data[scatter_data['bar'].isnull()])'''


@pytest.mark.unit
def test_get_scatter(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(), columns=['date', 'security_id', 'foo', 'bar'])
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            params = dict(
                dateCol='date',
                cols=json.dumps(['foo', 'bar']),
                date='20000101'
            )
            response = c.get('/dtale/scatter/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                y='bar',
                stats={
                    'pearson': 0.9999999999999999,
                    'correlated': 5,
                    'only_in_s0': 0,
                    'only_in_s1': 0,
                    'spearman': 0.9999999999999999
                },
                data={
                    'all': {
                        'bar': [0, 1, 2, 3, 4],
                        'index': [0, 1, 2, 3, 4],
                        'x': [0, 1, 2, 3, 4]
                    }
                },
                max={'bar': 4, 'index': 4, 'x': 4},
                min={'bar': 0, 'index': 0, 'x': 0},
                x='foo'
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return scatter'
            )
            unittest.assertEqual(response_data['code'], SCATTER_CODE)

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(
                dateCol='date',
                cols=json.dumps(['0', '1']),
                date='20191201',
                rolling=True,
                window='4'
            )
            response = c.get('/dtale/scatter/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert len(response_data['data']['all']['1']) == 4
            assert sorted(response_data['data']['all']) == ['1', 'date', 'index', 'x']
            unittest.assertEqual(
                sorted(response_data['data']['all']['date']),
                ['2019-11-28', '2019-11-29', '2019-11-30', '2019-12-01'],
                'should return scatter'
            )

    test_data = pd.DataFrame(build_ts_data(size=15001, days=1), columns=['date', 'security_id', 'foo', 'bar'])

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            params = dict(dateCol='date', cols=json.dumps(['foo', 'bar']), date='20000101')
            response = c.get('/dtale/scatter/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                stats={
                    'correlated': 15001,
                    'only_in_s0': 0,
                    'only_in_s1': 0,
                    'pearson': 1.0,
                    'spearman': 1.0,
                },
                error='Dataset exceeds 15,000 records, cannot render scatter. Please apply filter...'
            )
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return scatter'
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            settings = {c.port: {'query': "missing_col == 'blah'"}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            params = dict(dateCol='date', cols=json.dumps(['foo', 'bar']), date='20000101')
            response = c.get('/dtale/scatter/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )


@pytest.mark.unit
def test_get_chart_data(unittest, test_data, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(size=50), columns=['date', 'security_id', 'foo', 'bar'])
    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            params = dict(x='date', y=json.dumps(['security_id']), agg='count')
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {
                u'data': {u'all': {
                    u'x': ['2000-01-01', '2000-01-02', '2000-01-03', '2000-01-04', '2000-01-05'],
                    u'security_id': [50, 50, 50, 50, 50]
                }},
                u'max': {'security_id': 50, 'x': '2000-01-05'},
                u'min': {'security_id': 50, 'x': '2000-01-01'},
                u'success': True,
            }
            unittest.assertEqual(
                {k: v for k, v in response_data.items() if k != 'code'},
                expected,
                'should return chart data'
            )

    test_data.loc[:, 'baz'] = 'baz'

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            params = dict(x='date', y=json.dumps(['security_id']), group=json.dumps(['baz']), agg='mean')
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['min']['security_id'] == 24.5
            assert response_data['max']['security_id'] == 24.5
            series_key = "baz == 'baz'"
            assert response_data['data'][series_key]['x'][-1] == '2000-01-05'
            assert len(response_data['data'][series_key]['security_id']) == 5
            assert sum(response_data['data'][series_key]['security_id']) == 122.5

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='date', y=json.dumps(['0']), agg='rolling', rollingWin=10, rollingComp='count')
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['success']

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            params = dict(x='baz', y=json.dumps(['foo']))
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['error'] == (
                "baz contains duplicates, please specify group or additional filtering or select 'No Aggregation' "
                'from Aggregation drop-down.'
            )

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            params = dict(x='date', y=json.dumps(['foo']), group=json.dumps(['security_id']))
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert 'Group (security_id) contains more than 30 unique values' in str(response_data['error'])

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            response = c.get('/dtale/chart-data/{}'.format(c.port),
                             query_string=dict(query="missing_col == 'blah'"))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], "name 'missing_col' is not defined",
                                 'should handle data exception')

    with app.test_client() as c:
        with mock.patch('dtale.global_state.DATA', {c.port: test_data}):
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=dict(query="security_id == 51"))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], 'query "security_id == 51" found no data, please alter'
            )

    df = pd.DataFrame([dict(a=i, b=np.nan) for i in range(100)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='a', y=json.dumps(['b']), allowDupes=True)
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], 'All data for column "b" is NaN!')

    df = pd.DataFrame([dict(a=i, b=i) for i in range(15500)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='a', y=json.dumps(['b']), allowDupes=True)
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], 'Dataset exceeds 15000 records, cannot render. Please apply filter...'
            )


@pytest.mark.unit
def test_code_export():
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.build_code_export', mock.Mock(side_effect=Exception())))
            response = c.get('/dtale/code-export/{}'.format(c.port))
            assert 'error' in json.loads(response.data)

        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.get_data',
                                           mock.Mock(return_value={c.port: pd.DataFrame([dict(a=1), dict(a=2)])})))
            stack.enter_context(
                mock.patch('dtale.global_state.get_settings', mock.Mock(return_value={c.port: {'query': 'a in @a'}}))
            )
            stack.enter_context(
                mock.patch('dtale.global_state.get_context_variables', mock.Mock(return_value={c.port: {'a': [1, 2]}}))
            )
            stack.enter_context(mock.patch('dtale.views.build_code_export', mock.Mock(side_effect=Exception())))
            response = c.get('/dtale/code-export/{}'.format(c.port))
            assert 'error' in json.loads(response.data)

        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.get_data',
                                           mock.Mock(return_value={c.port: pd.DataFrame([dict(a=1), dict(a=2)])})))
            stack.enter_context(
                mock.patch('dtale.global_state.get_settings', mock.Mock(return_value={c.port: {'query': 'a == 1'}}))
            )
            response = c.get('/dtale/code-export/{}'.format(c.port))
            assert json.loads(response.data)['success']


@pytest.mark.unit
def test_version_info():
    with app.test_client() as c:
        with mock.patch(
                'dtale.cli.clickutils.pkg_resources.get_distribution',
                mock.Mock(side_effect=Exception('blah'))
        ):
            response = c.get('version-info')
            assert 'unknown' in str(response.data)


@pytest.mark.unit
@pytest.mark.parametrize('custom_data', [dict(rows=1000, cols=3)], indirect=True)
def test_chart_exports(custom_data, state_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: custom_data}))
            stack.enter_context(
                mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(custom_data)})
            )
            params = dict(chart_type='invalid')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'application/json'

            params = dict(chart_type='line', x='date', y=json.dumps(['Col0']), agg='sum', query='Col5 == 50')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'application/json'

            params = dict(chart_type='bar', x='date', y=json.dumps(['Col0']), agg='sum')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='line', x='date', y=json.dumps(['Col0']), agg='sum')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='scatter', x='Col0', y=json.dumps(['Col1']))
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='3d_scatter', x='date', y=json.dumps(['security_id']), z='Col0')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='surface', x='date', y=json.dumps(['security_id']), z='Col0')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='pie', x='security_id', y=json.dumps(['Col0']), agg='sum',
                          query='security_id >= 100000 and security_id <= 100010')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            params = dict(chart_type='heatmap', x='date', y=json.dumps(['security_id']), z='Col0')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

            del params['x']
            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'application/json'

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: state_data}))
            stack.enter_context(
                mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(state_data)})
            )
            params = dict(chart_type='maps', map_type='choropleth', loc_mode='USA-states', loc='Code', map_val='val',
                          agg='raw')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'

    df = pd.DataFrame({
        'lat': np.random.uniform(-40, 40, 50),
        'lon': np.random.uniform(-40, 40, 50),
        'val': np.random.randint(0, high=100, size=50)
    })
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(
                mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)})
            )
            params = dict(chart_type='maps', map_type='scattergeo', lat='lat', lon='lon', map_val='val', scope='world',
                          agg='raw')
            response = c.get('/dtale/chart-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/html'

            response = c.get('/dtale/chart-csv-export/{}'.format(c.port), query_string=params)
            assert response.content_type == 'text/csv'


@pytest.mark.unit
def test_main():
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(), columns=['date', 'security_id', 'foo', 'bar'])
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.METADATA', {c.port: dict(name='test_name')}))
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', {c.port: dict(locked=[])}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/iframe/{}'.format(c.port))
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/popup/test/{}'.format(c.port), query_string=dict(col='foo'))
            assert '<title>D-Tale (test_name) - Test (col: foo)</title>' in str(response.data)

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.global_state.METADATA', {c.port: dict()}))
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', {c.port: dict(locked=[])}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert '<title>D-Tale</title>' in str(response.data)


@pytest.mark.unit
def test_200():
    paths = ['/dtale/main/{port}', '/dtale/iframe/{port}', '/dtale/popup/test/{port}', 'site-map', 'version-info',
             'health', '/charts/{port}', '/charts/popup/{port}', '/dtale/code-popup', '/missing-js',
             'images/fire.jpg', 'images/projections/miller.png', 'images/map_type/choropleth.png',
             'maps/usa_110m.json']
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: None}))
            for path in paths:
                response = c.get(path.format(port=c.port))
                assert response.status_code == 200, '{} should return 200 response'.format(path)


@pytest.mark.unit
def test_302():
    import dtale.views as views

    df = pd.DataFrame([1, 2, 3])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            for path in ['/', '/dtale', '/dtale/main', '/dtale/iframe', '/dtale/popup/test', '/favicon.ico']:
                response = c.get(path)
                assert response.status_code == 302, '{} should return 302 response'.format(path)


@pytest.mark.unit
def test_missing_js():
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: pd.DataFrame([1, 2, 3])}))
            stack.enter_context(mock.patch('os.listdir', mock.Mock(return_value=[])))
            response = c.get('/')
            assert response.status_code == 302


@pytest.mark.unit
def test_404():
    response = app.test_client().get('/dtale/blah')
    assert response.status_code == 404
    # make sure custom 404 page is returned
    assert 'The page you were looking for <code>/dtale/blah</code> does not exist.' in str(response.data)


@pytest.mark.unit
def test_500():
    with app.test_client() as c:
        with mock.patch('dtale.views.render_template', mock.Mock(side_effect=Exception("Test"))):
            for path in ['/dtale/main/1', '/dtale/main', '/dtale/iframe', '/dtale/popup/test']:
                response = c.get(path)
                assert response.status_code == 500
                assert '<h1>Internal Server Error</h1>' in str(response.data)


@pytest.mark.unit
def test_jinja_output():
    import dtale.views as views

    df = pd.DataFrame([1, 2, 3])
    df, _ = views.format_data(df)
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)
            response = c.get('/charts/{}'.format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)

    with build_app(url=URL, github_fork=True).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert 'span id="forkongithub"' in str(response.data)
            response = c.get('/charts/{}'.format(c.port))
            assert 'span id="forkongithub"' in str(response.data)


@pytest.mark.unit
def test_build_context_variables():
    import dtale.views as views
    import dtale.global_state as global_state

    data_id = '1'

    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {1: 'foo'})
    assert 'context variables must be a valid string' in str(error.value)

    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {'#!f_o#o': 'bar'})
    assert 'context variables can only contain letters, digits, or underscores' in str(error.value)

    with pytest.raises(SyntaxError) as error:
        views.build_context_variables(data_id, {'_foo': 'bar'})
    assert 'context variables can not start with an underscore' in str(error.value)

    # verify that pre-existing variables are not dropped when new ones are added
    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.global_state.CONTEXT_VARIABLES', {data_id: {}}))
        global_state.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'cat'})
        global_state.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'2': 'dog'})
        assert ((global_state.CONTEXT_VARIABLES[data_id]['1'] == 'cat')
                & (global_state.CONTEXT_VARIABLES[data_id]['2'] == 'dog'))
    # verify that new values will replace old ones if they share the same name
    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.global_state.CONTEXT_VARIABLES', {data_id: {}}))
        global_state.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'cat'})
        global_state.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'dog'})
        assert (global_state.CONTEXT_VARIABLES[data_id]['1'] == 'dog')


@pytest.mark.unit
def test_get_filter_info(unittest):
    with app.test_client() as c:
        with ExitStack() as stack:
            data_id = '1'
            context_vars = {
                '1': ['cat', 'dog'],
                '2': 420346,
                '3': pd.Series(range(1000)),
                '4': 'A' * 2000,
            }
            expected_return_value = [dict(name=k, value=str(v)[:1000]) for k, v in context_vars.items()]
            stack.enter_context(mock.patch('dtale.global_state.CONTEXT_VARIABLES', {data_id: context_vars}))
            response = c.get('/dtale/filter-info/{}'.format(data_id))
            response_data = json.loads(response.data)
            assert response_data['success']
            unittest.assertEqual(response_data['contextVars'], expected_return_value, 'should match expected')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.CONTEXT_VARIABLES', None))
            response = c.get('dtale/filter-info/1')
            response_data = json.loads(response.data)
            assert response_data['error'], 'An error should be returned since CONTEXT_VARIABLES is None'


@pytest.mark.unit
@pytest.mark.parametrize('custom_data', [dict(rows=1000, cols=3)], indirect=True)
def test_get_column_filter_data(unittest, custom_data):
    import dtale.views as views

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'bool_val'))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data, {u'hasMissing': False, u'uniques': [u'False', u'True'], u'success': True}
            )
            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'str_val'))
            response_data = json.loads(response.data)
            assert response_data['hasMissing']
            assert all(k in response_data for k in [u'hasMissing', u'uniques', u'success'])
            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'int_val'))
            response_data = json.loads(response.data)
            assert not response_data['hasMissing']
            assert all(k in response_data for k in [u'max', u'hasMissing', u'uniques', u'success', u'min'])
            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'Col0'))
            response_data = json.loads(response.data)
            assert not response_data['hasMissing']
            assert all(k in response_data for k in ['max', 'hasMissing', 'success', u'min'])
            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'date'))
            response_data = json.loads(response.data)
            assert not response_data['hasMissing']
            assert all(k in response_data for k in ['max', 'hasMissing', 'success', u'min'])

            response = c.get('/dtale/column-filter-data/{}/{}'.format(c.port, 'missing_col'))
            response_data = json.loads(response.data)
            assert not response_data['success']


@pytest.mark.unit
@pytest.mark.parametrize('custom_data', [dict(rows=1000, cols=3)], indirect=True)
def test_save_column_filter(unittest, custom_data):
    import dtale.views as views

    df, _ = views.format_data(custom_data)
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.global_state.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            settings = {c.port: {}}
            stack.enter_context(mock.patch('dtale.global_state.SETTINGS', settings))
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'bool_val'),
                query_string=dict(cfg=json.dumps({"type": "string", "value": ["False"]}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['bool_val'],
                {u'query': u'bool_val == False', u'value': [u'False']}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'str_val'),
                query_string=dict(cfg=json.dumps({"type": "string", "value": ["a", "b"]}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['str_val'],
                {u'query': "str_val in ('a', 'b')", u'value': ['a', 'b']}
            )
            for col, f_type in [('bool_val', 'string'), ('int_val', 'int'), ('date', 'date')]:
                response = c.get(
                    '/dtale/save-column-filter/{}/{}'.format(c.port, col),
                    query_string=dict(cfg=json.dumps({"type": f_type, "missing": True}))
                )
                unittest.assertEqual(
                    json.loads(response.data)['currFilters'][col],
                    {u'query': u'{col} != {col}'.format(col=col), u'missing': True}
                )
            response = c.get('/dtale/save-column-filter/{}/{}'.format(c.port, 'bool_val'), query_string=dict(cfg=None))
            response_data = json.loads(response.data)
            assert 'error' in response_data

            for operand in ['=', '<', '>', '<=', '>=']:
                response = c.get(
                    '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                    query_string=dict(cfg=json.dumps({"type": "int", 'operand': operand, "value": '5'}))
                )
                query = 'int_val {} 5'.format('==' if operand == '=' else operand)
                unittest.assertEqual(
                    json.loads(response.data)['currFilters']['int_val'],
                    {u'query': query, u'value': '5', 'operand': operand}
                )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '=', "value": ['5', '4']}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val in (5, 4)', u'value': ['5', '4'], 'operand': '='}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '[]', 'min': '4', 'max': '5'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val >= 4 and int_val <= 5', 'min': '4', 'max': '5', 'operand': '[]'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '()', 'min': '4', 'max': '5'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val > 4 and int_val < 5', 'min': '4', 'max': '5', 'operand': '()'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '()', 'min': '4', 'max': None}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val > 4', 'min': '4', 'operand': '()'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '()', 'min': None, 'max': '5'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val < 5', 'max': '5', 'operand': '()'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'int_val'),
                query_string=dict(cfg=json.dumps({"type": "int", 'operand': '()', 'min': '4', 'max': '4'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['int_val'],
                {u'query': 'int_val == 4', 'min': '4', 'max': '4', 'operand': '()'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'date'),
                query_string=dict(cfg=json.dumps({"type": "date", 'start': '20000101', 'end': '20000101'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['date'],
                {u'query': "date == '20000101'", 'start': '20000101', 'end': '20000101'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'date'),
                query_string=dict(cfg=json.dumps({"type": "date", 'start': '20000101', 'end': '20000102'}))
            )
            unittest.assertEqual(
                json.loads(response.data)['currFilters']['date'],
                {u'query': "date >= '20000101' and date <= '20000102'", 'start': '20000101', 'end': '20000102'}
            )
            response = c.get(
                '/dtale/save-column-filter/{}/{}'.format(c.port, 'date'),
                query_string=dict(cfg=json.dumps({"type": "date", 'missing': False}))
            )
            assert 'date' not in json.loads(response.data)['currFilters']


@pytest.mark.unit
def test_build_dtypes_state(test_data):
    import dtale.views as views

    state = views.build_dtypes_state(test_data.set_index('security_id').T)
    assert all('min' not in r and 'max' not in r for r in state)
