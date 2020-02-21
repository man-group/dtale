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
        stack.enter_context(mock.patch('dtale.views.DATA', {'1': None, '2': None}))
        assert views.head_data_id() == '1'

    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.views.DATA', {}))
        with pytest.raises(Exception) as error:
            views.head_data_id()
            assert error.startswith('No data associated with this D-Tale session')


@pytest.mark.unit
def test_startup(unittest):
    import dtale.views as views

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
    unittest.assertEqual(views.SETTINGS[instance._data_id], dict(locked=['date', 'security_id']),
                         'should lock index columns')

    test_data = test_data.reset_index()
    instance = views.startup(URL, data=test_data)
    pdt.assert_frame_equal(instance.data, test_data)
    unittest.assertEqual(views.SETTINGS[instance._data_id], dict(locked=[]), 'no index = nothing locked')

    test_data = pd.DataFrame([dict(date=pd.Timestamp('now'), security_id=1)])
    test_data = test_data.set_index('security_id').date
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.reset_index())
    unittest.assertEqual(views.SETTINGS[instance._data_id], dict(locked=['security_id']), 'should lock index columns')

    test_data = pd.DatetimeIndex([pd.Timestamp('now')], name='date')
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(views.SETTINGS[instance._data_id], dict(locked=[]), 'should lock index columns')

    test_data = pd.MultiIndex.from_arrays([[1, 2], [3, 4]], names=('a', 'b'))
    instance = views.startup(URL, data_loader=lambda: test_data)
    pdt.assert_frame_equal(instance.data, test_data.to_frame(index=False))
    unittest.assertEqual(views.SETTINGS[instance._data_id], dict(locked=[]), 'should lock index columns')

    test_data = pd.DataFrame([
        dict(date=pd.Timestamp('now'), security_id=1, foo=1.0, bar=2.0),
        dict(date=pd.Timestamp('now'), security_id=1, foo=2.0, bar=np.inf)
    ], columns=['date', 'security_id', 'foo', 'bar'])
    instance = views.startup(URL, data_loader=lambda: test_data)
    unittest.assertEqual(
        {'name': 'bar', 'dtype': 'float64', 'index': 3, 'visible': True},
        next((dt for dt in views.DTYPES[instance._data_id] if dt['name'] == 'bar'), None),
    )

    test_data = pd.DataFrame([dict(a=1, b=2)])
    test_data = test_data.rename(columns={'b': 'a'})
    with pytest.raises(Exception) as error:
        views.startup(URL, data_loader=lambda: test_data)
    assert str(error).endswith('Exception: data contains duplicated column names: a')


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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(test_data)}))
            stack.enter_context(mock.patch('dtale.views.METADATA', {c.port: dict(start=now, name='foo')}))
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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(test_data)}))
            stack.enter_context(mock.patch('dtale.views.METADATA', {}))
            response = c.get('/dtale/processes')
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_update_settings(unittest):
    settings = json.dumps(dict(locked=['a', 'b']))

    with app.test_client() as c:
        with mock.patch(
                'dtale.views.render_template', mock.Mock(return_value=json.dumps(dict(success=True)))
        ) as mock_render_template:
            response = c.get('/dtale/update-settings/1', query_string=dict(settings=settings))
            assert response.status_code == 200, 'should return 200 response'

            c.get('/dtale/main/1')
            _, kwargs = mock_render_template.call_args
            unittest.assertEqual(kwargs['settings'], settings, 'settings should be retrieved')

    settings = 'a'
    with app.test_client() as c:
        response = c.get('/dtale/update-settings/1', query_string=dict(settings=settings))
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
            stack.enter_context(mock.patch('dtale.views.DATA', data))
            stack.enter_context(mock.patch('dtale.views.DTYPES', dtypes))
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
            stack.enter_context(mock.patch('dtale.views.DATA', data))
            stack.enter_context(mock.patch('dtale.views.DTYPES', dtypes))
            stack.enter_context(mock.patch('dtale.views.SETTINGS', settings))

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
def test_update_visibility(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame([dict(a=1, b=2, c=3)])
    with app.test_client() as c:
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DTYPES', dtypes))
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
            stack.enter_context(mock.patch('dtale.views.DATA', data))
            stack.enter_context(mock.patch('dtale.views.DTYPES', dtypes))
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


@pytest.mark.unit
def test_build_column_bins(unittest):
    from dtale.views import build_dtypes_state

    df = pd.DataFrame(np.random.randn(100, 3), columns=['a', 'b', 'c'])
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', data))
            stack.enter_context(mock.patch('dtale.views.DTYPES', dtypes))
            cfg = dict(col='a', operation='cut', bins=4)
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='cut', cfg=json.dumps(cfg))
            )
            assert data[c.port]['cut'].values[0] is not None
            assert dtypes[c.port][-1]['name'] == 'cut'
            assert dtypes[c.port][-1]['dtype'] == ('string' if PY3 else 'unicode')

            cfg = dict(col='a', operation='cut', bins=4, labels='foo,bar,biz,baz')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='cut2', cfg=json.dumps(cfg))
            )
            assert data[c.port]['cut2'].values[0] in ['foo', 'bar', 'biz', 'baz']
            assert dtypes[c.port][-1]['name'] == 'cut2'
            assert dtypes[c.port][-1]['dtype'] == ('string' if PY3 else 'unicode')

            cfg = dict(col='a', operation='qcut', bins=4)
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='qcut', cfg=json.dumps(cfg))
            )
            assert data[c.port]['qcut'].values[0] is not None
            assert dtypes[c.port][-1]['name'] == 'qcut'
            assert dtypes[c.port][-1]['dtype'] == ('string' if PY3 else 'unicode')

            cfg = dict(col='a', operation='qcut', bins=4, labels='foo,bar,biz,baz')
            c.get(
                '/dtale/build-column/{}'.format(c.port),
                query_string=dict(type='bins', name='qcut2', cfg=json.dumps(cfg))
            )
            assert data[c.port]['qcut2'].values[0] in ['foo', 'bar', 'biz', 'baz']
            assert dtypes[c.port][-1]['name'] == 'qcut2'
            assert dtypes[c.port][-1]['dtype'] == ('string' if PY3 else 'unicode')


@pytest.mark.unit
def test_dtypes(test_data):
    from dtale.views import build_dtypes_state, format_data

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(test_data)}))
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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: lots_of_groups}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(lots_of_groups)}))
            response = c.get('/dtale/dtypes/{}'.format(c.port))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/describe/{}/{}'.format(c.port, 'a'))
            response_data = json.loads(response.data)
            assert response_data['uniques']['top']
            assert response_data['success']

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DTYPES', {}))
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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(df)}))
            response = c.get('/dtale/describe/{}/{}'.format(c.port, 'bar'))
            response_data = json.loads(response.data)
            assert response_data['describe']['min'] == '2'
            assert response_data['describe']['max'] == 'inf'


@pytest.mark.unit
def test_test_filter(test_data):
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
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
    if PY3:
        df = pd.DataFrame([dict(a=1)])
        df['a.b'] = 2
        with app.test_client() as c:
            with mock.patch('dtale.views.DATA', {c.port: df}):
                response = c.get('/dtale/test-filter/{}'.format(c.port), query_string=dict(query='a.b == 2'))
                response_data = json.loads(response.data)
                assert response_data['success']


@pytest.mark.unit
def test_get_data(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
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
                    dict(dtype='int64', name='security_id', index=1, visible=True),
                    dict(dtype='int64', name='foo', index=2, visible=True),
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
            unittest.assertEqual(views.SETTINGS[c.port], {'sort': [['security_id', 'DESC']]}, 'should update settings')

            params = dict(ids=json.dumps(['1']), sort=json.dumps([['security_id', 'ASC']]))
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(views.SETTINGS[c.port], {'sort': [['security_id', 'ASC']]}, 'should update settings')

            params = dict(ids=json.dumps(['0']), query='security_id == 1')
            response = c.get('/dtale/data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            expected = {'0': dict(date='2000-01-01', security_id=1, dtale_index=0, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(views.SETTINGS[c.port], {'query': 'security_id == 1'}, 'should update settings')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/data/{}'.format(c.port),
                             query_string=dict(ids=json.dumps(['0']), query="missing_col == 'blah'"))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle data exception'
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            mocked_data = stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            mocked_dtypes = stack.enter_context(
                mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)})
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


@pytest.mark.unit
def test_get_histogram(unittest, test_data):
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/histogram/{}'.format(c.port), query_string=dict(col='foo'))
            response_data = json.loads(response.data)
            expected = dict(
                labels=[
                    '0.5', '0.6', '0.6', '0.7', '0.7', '0.8', '0.8', '0.9', '0.9', '0.9', '1.0', '1.1', '1.1', '1.1',
                    '1.2', '1.2', '1.3', '1.4', '1.4', '1.5', '1.5'
                ],
                data=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                desc={
                    'count': '50', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                }
            )
            unittest.assertEqual(response_data, expected, 'should return 20-bin histogram for foo')

            response = c.get('/dtale/histogram/{}'.format(c.port), query_string=dict(col='foo', bins=5))
            response_data = json.loads(response.data)
            expected = dict(
                labels=['0.5', '0.7', '0.9', '1.1', '1.3', '1.5'],
                data=[0, 0, 50, 0, 0],
                desc={
                    'count': '50', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                }
            )
            unittest.assertEqual(response_data, expected, 'should return 5-bin histogram for foo')

            response = c.get('/dtale/histogram/{}'.format(c.port),
                             query_string=dict(col='foo', bins=5, query='security_id > 10'))
            response_data = json.loads(response.data)
            expected = dict(
                labels=['0.5', '0.7', '0.9', '1.1', '1.3', '1.5'],
                data=[0, 0, 39, 0, 0],
                desc={
                    'count': '39', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                }
            )
            unittest.assertEqual(response_data, expected, 'should return a filtered 5-bin histogram for foo')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('numpy.histogram', mock.Mock(side_effect=Exception('histogram failure'))))

            response = c.get('/dtale/histogram/{}'.format(c.port), query_string=dict(col='foo'))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], 'histogram failure', 'should handle histogram exception')


@pytest.mark.unit
def test_get_correlations(unittest, test_data, rolling_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=[],
                rolling=False
            )
            unittest.assertEqual(response_data, expected, 'should return correlations')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations/{}'.format(c.port), query_string=dict(query="missing_col == 'blah'"))
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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            expected = expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=['date'],
                rolling=False
            )
            unittest.assertEqual(response_data, expected, 'should return correlations')

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            response = c.get('/dtale/correlations/{}'.format(c.port))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['dates'], ['date'], 'should return correlation date columns')
            assert response_data['rolling']


def build_ts_data(size=5, days=5):
    start = pd.Timestamp('20000101')
    for d in pd.date_range(start, start + Day(days - 1)):
        for i in range(size):
            yield dict(date=d, security_id=i, foo=i, bar=i)


@pytest.mark.unit
def test_get_correlations_ts(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(size=50), columns=['date', 'security_id', 'foo', 'bar'])

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
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
            unittest.assertEqual(response_data, expected, 'should return timeseries correlation')

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(dateCol='date', cols=json.dumps(['0', '1']), rollingWindow='4')
            response = c.get('/dtale/correlations-ts/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['success'], True, 'should return rolling correlation')

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get(
                '/dtale/correlations-ts/{}'.format(c.port),
                query_string=dict(query="missing_col == 'blah'")
            )
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )


@pytest.mark.unit
def test_get_scatter(unittest, rolling_data):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(), columns=['date', 'security_id', 'foo', 'bar'])
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            params = dict(
                dateCol='date',
                cols=json.dumps(['foo', 'bar']),
                date='20000101',
                query="date == '20000101'"
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
            unittest.assertEqual(response_data, expected, 'should return scatter')

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
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
            unittest.assertEqual(response_data, expected, 'should return scatter')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            params = dict(
                dateCol='date',
                cols=json.dumps(['foo', 'bar']),
                date='20000101',
                query="missing_col == 'blah'"
            )
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
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
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
            unittest.assertEqual(response_data, expected, 'should return chart data')

    test_data.loc[:, 'baz'] = 'baz'

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(x='date', y=json.dumps(['security_id']), group=json.dumps(['baz']), agg='mean')
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['min']['security_id'] == 24.5
            assert response_data['max']['security_id'] == 24.5
            assert response_data['data']['baz']['x'][-1] == '2000-01-05'
            assert len(response_data['data']['baz']['security_id']) == 5
            assert sum(response_data['data']['baz']['security_id']) == 122.5

    df, _ = views.format_data(rolling_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='date', y=json.dumps(['0']), agg='rolling', rollingWin=10, rollingComp='count')
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['success']

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(x='baz', y=json.dumps(['foo']))
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['error'] == 'baz contains duplicates, please specify group or additional filtering'

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(x='date', y=json.dumps(['foo']), group=json.dumps(['security_id']))
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            assert response_data['error'] == (
                'Group (security_id) contains more than 15 unique values, please add '
                'additional filter or else chart will be unreadable'
            )

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/chart-data/{}'.format(c.port),
                             query_string=dict(query="missing_col == 'blah'"))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], "name 'missing_col' is not defined",
                                 'should handle data exception')

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=dict(query="security_id == 51"))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], 'query "security_id == 51" found no data, please alter'
            )

    df = pd.DataFrame([dict(a=i, b=np.nan) for i in range(100)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='a', y=json.dumps(['b']), allowDupes=True)
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], 'All data for column "b" is NaN!')

    df = pd.DataFrame([dict(a=i, b=i) for i in range(15500)])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            params = dict(x='a', y=json.dumps(['b']), allowDupes=True)
            response = c.get('/dtale/chart-data/{}'.format(c.port), query_string=params)
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], 'Dataset exceeds 15000 records, cannot render. Please apply filter...'
            )


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
def test_main():
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(), columns=['date', 'security_id', 'foo', 'bar'])
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.METADATA', {c.port: dict(name='test_name')}))
            stack.enter_context(mock.patch('dtale.views.SETTINGS', {c.port: dict(locked=[])}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/iframe/{}'.format(c.port))
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/popup/test/{}'.format(c.port), query_string=dict(col='foo'))
            assert '<title>D-Tale (test_name) - test (col: foo)</title>' in str(response.data)

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.METADATA', {c.port: dict()}))
            stack.enter_context(mock.patch('dtale.views.SETTINGS', {c.port: dict(locked=[])}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert '<title>D-Tale</title>' in str(response.data)


@pytest.mark.unit
def test_200():
    paths = ['/dtale/main/1', '/dtale/iframe/1', '/dtale/popup/test/1', 'site-map', 'version-info', 'health',
             '/charts/1', '/charts/popup/1']
    with app.test_client() as c:
        for path in paths:
            response = c.get(path)
            assert response.status_code == 200, '{} should return 200 response'.format(path)


@pytest.mark.unit
def test_302():
    import dtale.views as views

    df = pd.DataFrame([1, 2, 3])
    df, _ = views.format_data(df)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            for path in ['/', '/dtale', '/dtale/main', '/dtale/iframe', '/dtale/popup/test', '/favicon.ico']:
                response = c.get(path)
                assert response.status_code == 302, '{} should return 302 response'.format(path)


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
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.dash_application.views.DATA', {c.port: df}))
            response = c.get('/dtale/main/{}'.format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)
            response = c.get('/charts/{}'.format(c.port))
            assert 'span id="forkongithub"' not in str(response.data)

    with build_app(url=URL, github_fork=True).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: df}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(df)}))
            stack.enter_context(mock.patch('dtale.dash_application.views.DATA', {c.port: df}))
            response = c.get('/dtale/main/1')
            assert 'span id="forkongithub"' in str(response.data)
            response = c.get('/charts/{}'.format(c.port))
            assert 'span id="forkongithub"' in str(response.data)


@pytest.mark.unit
def test_build_context_variables():
    import dtale.views as views

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
        stack.enter_context(mock.patch('dtale.views.CONTEXT_VARIABLES', {data_id: {}}))
        views.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'cat'})
        views.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'2': 'dog'})
        assert ((views.CONTEXT_VARIABLES[data_id]['1'] == 'cat') & (views.CONTEXT_VARIABLES[data_id]['2'] == 'dog'))

    # verify that new values will replace old ones if they share the same name
    with ExitStack() as stack:
        stack.enter_context(mock.patch('dtale.views.CONTEXT_VARIABLES', {data_id: {}}))
        views.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'cat'})
        views.CONTEXT_VARIABLES[data_id] = views.build_context_variables(data_id, {'1': 'dog'})
        assert (views.CONTEXT_VARIABLES[data_id]['1'] == 'dog')


@pytest.mark.unit
def test_get_context_variables(unittest):
    with app.test_client() as c:
        with ExitStack() as stack:
            data_id = '1'
            context_vars = {
                '1': ['cat', 'dog'],
                '2': 420346,
                '3': pd.Series(range(1000)),
                '4': 'A' * 2000,
            }
            expected_return_value = {k: str(v)[:1000] for k, v in context_vars.items()}
            stack.enter_context(mock.patch('dtale.views.CONTEXT_VARIABLES', {data_id: context_vars}))
            response = c.get('/dtale/context-variables/{}'.format(data_id))
            response_data = json.loads(response.data)
            assert response_data['success']
            unittest.assertEqual(response_data['context_variables'], expected_return_value, 'should match expected')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.CONTEXT_VARIABLES', None))
            response = c.get('dtale/context-variables/1')
            response_data = json.loads(response.data)
            assert response_data['error'], 'An error should be returned since CONTEXT_VARIABLES is None'
