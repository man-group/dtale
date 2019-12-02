import json
import re
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

app = build_app()


@pytest.mark.unit
def test_startup(unittest):
    import dtale.views as views

    with pytest.raises(BaseException) as error:
        views.startup()
    assert 'data loaded is None!' in str(error.value)

    with pytest.raises(BaseException) as error:
        views.startup(dict())
    assert 'data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex'\
           in str(error.value)

    test_data = pd.DataFrame([dict(date=pd.Timestamp('now'), security_id=1, foo=1.5)])
    test_data = test_data.set_index(['date', 'security_id'])
    port = '80'
    views.startup(data_loader=lambda: test_data, port=port)

    pdt.assert_frame_equal(views.DATA[port], test_data.reset_index())
    unittest.assertEqual(views.SETTINGS[port], dict(locked=['date', 'security_id']), 'should lock index columns')

    test_data = test_data.reset_index()
    port = '81'
    views.startup(data=test_data, port=port)
    pdt.assert_frame_equal(views.DATA[port], test_data)
    unittest.assertEqual(views.SETTINGS[port], dict(locked=[]), 'no index = nothing locked')

    test_data = pd.DataFrame([dict(date=pd.Timestamp('now'), security_id=1)])
    test_data = test_data.set_index('security_id').date
    port = '82'
    views.startup(data_loader=lambda: test_data, port=port)
    pdt.assert_frame_equal(views.DATA[port], test_data.reset_index())
    unittest.assertEqual(views.SETTINGS[port], dict(locked=['security_id']), 'should lock index columns')

    test_data = pd.DatetimeIndex([pd.Timestamp('now')], name='date')
    port = '83'
    views.startup(data_loader=lambda: test_data, port=port)
    pdt.assert_frame_equal(views.DATA[port], test_data.to_frame(index=False))
    unittest.assertEqual(views.SETTINGS[port], dict(locked=[]), 'should lock index columns')

    test_data = pd.MultiIndex.from_arrays([[1, 2], [3, 4]], names=('a', 'b'))
    port = '84'
    views.startup(data_loader=lambda: test_data, port=port)
    pdt.assert_frame_equal(views.DATA[port], test_data.to_frame(index=False))
    unittest.assertEqual(views.SETTINGS[port], dict(locked=[]), 'should lock index columns')


@pytest.mark.unit
def test_in_ipython_frontend():
    import dtale.views as views

    builtin_pkg = '__builtin__'
    if PY3:
        builtin_pkg = 'builtins'

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
                    'port': c.port,
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
            response = c.get('/dtale/update-settings', query_string=dict(settings=settings))
            assert response.status_code == 200, 'should return 200 response'

            c.get('/dtale/main')
            _, kwargs = mock_render_template.call_args
            unittest.assertEqual(kwargs['settings'], settings, 'settings should be retrieved')

    settings = 'a'
    with app.test_client() as c:
        response = c.get('/dtale/update-settings', query_string=dict(settings=settings))
        assert response.status_code == 200, 'should return 200 response'

        response_data = json.loads(response.data)
        assert 'error' in response_data


@pytest.mark.unit
def test_dtypes(test_data):
    from dtale.views import build_dtypes_state

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: build_dtypes_state(test_data)}))
            response = c.get('/dtale/dtypes')
            response_data = json.loads(response.data)
            assert response_data['success']

            for col in test_data.columns:
                response = c.get('/dtale/describe/{}'.format(col))
                response_data = json.loads(response.data)
                assert response_data['success']

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DTYPES', {}))
            response = c.get('/dtale/dtypes')
            response_data = json.loads(response.data)
            assert 'error' in response_data

            response = c.get('/dtale/describe/foo')
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_test_filter(test_data):
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/test-filter', query_string=dict(query='date == date'))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter', query_string=dict(query='foo == 1'))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter', query_string=dict(query="date == '20000101'"))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter', query_string=dict(query="baz == 'baz'"))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter', query_string=dict(query="bar > 1.5"))
            response_data = json.loads(response.data)
            assert response_data['success']

            response = c.get('/dtale/test-filter', query_string=dict(query='foo2 == 1'))
            response_data = json.loads(response.data)
            assert 'error' in response_data


@pytest.mark.unit
def test_get_data(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/data')
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data, {}, 'if no "ids" parameter an empty dict should be returned')

            response = c.get('/dtale/data', query_string=dict(ids=json.dumps(['1'])))
            response_data = json.loads(response.data)
            expected = dict(
                total=50,
                results={'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz')},
                columns=[
                    dict(dtype='int64', name='dtale_index'),
                    dict(dtype='datetime64[ns]', name='date', index=0),
                    dict(dtype='int64', name='security_id', index=1),
                    dict(dtype='int64', name='foo', index=2),
                    dict(dtype='float64', name='bar', min=1.5, max=1.5, index=3),
                    dict(dtype='string', name='baz', index=4)
                ]
            )
            unittest.assertEqual(response_data, expected, 'should return data at index 1')

            response = c.get('/dtale/data', query_string=dict(ids=json.dumps(['1-2'])))
            response_data = json.loads(response.data)
            expected = {
                '1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz'),
                '2': dict(date='2000-01-01', security_id=2, dtale_index=2, foo=1, bar=1.5, baz='baz'),
            }
            unittest.assertEqual(response_data['results'], expected, 'should return data at indexes 1-2')

            params = dict(ids=json.dumps(['1']), sort=json.dumps([['security_id', 'DESC']]))
            response = c.get('/dtale/data', query_string=params)
            response_data = json.loads(response.data)
            expected = {'1': dict(date='2000-01-01', security_id=48, dtale_index=1, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(views.SETTINGS[c.port], {'sort': [['security_id', 'DESC']]}, 'should update settings')

            params = dict(ids=json.dumps(['1']), sort=json.dumps([['security_id', 'ASC']]))
            response = c.get('/dtale/data', query_string=params)
            response_data = json.loads(response.data)
            expected = {'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(views.SETTINGS[c.port], {'sort': [['security_id', 'ASC']]}, 'should update settings')

            params = dict(ids=json.dumps(['0']), query='security_id == 1')
            response = c.get('/dtale/data', query_string=params)
            response_data = json.loads(response.data)
            expected = {'0': dict(date='2000-01-01', security_id=1, dtale_index=0, foo=1, bar=1.5, baz='baz')}
            unittest.assertEqual(response_data['results'], expected, 'should return data at index 1 w/ sort')
            unittest.assertEqual(views.SETTINGS[c.port], {'query': 'security_id == 1'}, 'should update settings')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/data', query_string=dict(ids=json.dumps(['0']), query="missing_col == 'blah'"))
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
            response = c.get('/dtale/data', query_string=dict(ids=json.dumps(['1'])))
            assert response.status_code == 200

            tmp = mocked_data[c.port].copy()
            tmp['biz'] = 2.5
            mocked_data[c.port] = tmp
            response = c.get('/dtale/data', query_string=dict(ids=json.dumps(['1'])))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['results'],
                {'1': dict(date='2000-01-01', security_id=1, dtale_index=1, foo=1, bar=1.5, baz='baz', biz=2.5)},
                'should handle data updates'
            )
            unittest.assertEqual(
                mocked_dtypes[c.port][-1],
                dict(index=5, name='biz', dtype='float64', min=2.5, max=2.5),
                'should update dtypes on data structure change'
            )


@pytest.mark.unit
def test_get_histogram(unittest, test_data):
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/histogram', query_string=dict(col='foo'))
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

            response = c.get('/dtale/histogram', query_string=dict(col='foo', bins=5))
            response_data = json.loads(response.data)
            expected = dict(
                labels=['0.5', '0.7', '0.9', '1.1', '1.3', '1.5'],
                data=[0, 0, 50, 0, 0],
                desc={
                    'count': '50', 'std': '0', 'min': '1', 'max': '1', '50%': '1', '25%': '1', '75%': '1', 'mean': '1'
                }
            )
            unittest.assertEqual(response_data, expected, 'should return 5-bin histogram for foo')

            response = c.get('/dtale/histogram', query_string=dict(col='foo', bins=5, query='security_id > 10'))
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

            response = c.get('/dtale/histogram', query_string=dict(col='foo'))
            response_data = json.loads(response.data)
            unittest.assertEqual(response_data['error'], 'histogram failure', 'should handle histogram exception')


@pytest.mark.unit
def test_get_correlations(unittest, test_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            test_data, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations')
            response_data = json.loads(response.data)
            expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=[]
            )
            unittest.assertEqual(response_data, expected, 'should return correlations')

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/correlations', query_string=dict(query="missing_col == 'blah'"))
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
            response = c.get('/dtale/correlations')
            response_data = json.loads(response.data)
            expected = expected = dict(
                data=[
                    dict(column='security_id', security_id=1.0, foo=None, bar=None),
                    dict(column='foo', security_id=None, foo=None, bar=None),
                    dict(column='bar', security_id=None, foo=None, bar=None)
                ],
                dates=['date']
            )
            unittest.assertEqual(response_data, expected, 'should return correlations')


def build_ts_data(size=5, days=5):
    start = pd.Timestamp('20000101')
    for d in pd.date_range(start, start + Day(days - 1)):
        for i in range(size):
            yield dict(date=d, security_id=i, foo=i, bar=i)


@pytest.mark.unit
def test_get_correlations_ts(unittest):
    test_data = pd.DataFrame(build_ts_data(size=50), columns=['date', 'security_id', 'foo', 'bar'])

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/correlations-ts', query_string=dict(dateCol='date', cols='foo,bar'))
            response_data = json.loads(response.data)
            expected = dict(data={
                ':corr:corr': {
                    'max': 1.0,
                    'data': [
                        {'date': 946702800000, 'corr': 1.0},
                        {'date': 946789200000, 'corr': 1.0},
                        {'date': 946875600000, 'corr': 1.0},
                        {'date': 946962000000, 'corr': 1.0},
                        {'date': 947048400000, 'corr': 1.0}
                    ],
                    'min': 1.0
                }
            })
            unittest.assertEqual(response_data, expected, 'should return timeseries correlation')

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/correlations-ts', query_string=dict(query="missing_col == 'blah'"))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )


@pytest.mark.unit
def test_get_scatter(unittest):
    import dtale.views as views

    test_data = pd.DataFrame(build_ts_data(), columns=['date', 'security_id', 'foo', 'bar'])
    test_data, _ = views.format_data(test_data)
    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get(
                '/dtale/scatter',
                query_string=dict(dateCol='date', cols='foo,bar', date='20000101', query="date == '20000101'")
            )
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
                data=[
                    {u'index': 0, u'foo': 0, u'bar': 0},
                    {u'index': 1, u'foo': 1, u'bar': 1},
                    {u'index': 2, u'foo': 2, u'bar': 2},
                    {u'index': 3, u'foo': 3, u'bar': 3},
                    {u'index': 4, u'foo': 4, u'bar': 4}
                ],
                x='foo'
            )
            unittest.assertEqual(response_data, expected, 'should return scatter')

    test_data = pd.DataFrame(build_ts_data(size=15001, days=1), columns=['date', 'security_id', 'foo', 'bar'])

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.DATA', {c.port: test_data}))
            stack.enter_context(mock.patch('dtale.views.DTYPES', {c.port: views.build_dtypes_state(test_data)}))
            response = c.get('/dtale/scatter', query_string=dict(dateCol='date', cols='foo,bar', date='20000101'))
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
            response = c.get(
                '/dtale/scatter',
                query_string=dict(dateCol='date', cols='foo,bar', date='20000101', query="missing_col == 'blah'")
            )
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
            )


@pytest.mark.unit
def test_get_coverage(unittest, test_data):
    test_data = pd.DataFrame(build_ts_data(size=50), columns=['date', 'security_id', 'foo', 'bar'])
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(col='security_id', group=json.dumps([{'name': 'date', 'freq': 'Y'}]))
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(data={"security_id": [250]}, labels=[{"date": "2000-12-31"}], success=True)
            unittest.assertEqual(response_data, expected, 'should return YTD coverage')

            params['filters'] = json.dumps([{'name': 'date', 'prevFreq': 'Y', 'freq': 'Q', 'date': '20000331'}])
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(data={"security_id": [250]}, labels=[{"date": "2000-03-31"}], success=True)
            unittest.assertEqual(response_data, expected, 'should return QTD coverage')

            params['filters'] = json.dumps([{'name': 'date', 'prevFreq': 'Q', 'freq': 'M', 'date': '20000131'}])
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(data={"security_id": [250]}, labels=[{"date": "2000-01-31"}], success=True)
            unittest.assertEqual(response_data, expected, 'should return MTD coverage')

            params['filters'] = json.dumps([{'name': 'date', 'prevFreq': 'M', 'freq': 'W', 'date': '20000109'}])
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                data={"security_id": [100, 150]},
                labels=[{"date": "2000-01-02"}, {"date": "2000-01-09"}],
                success=True
            )
            unittest.assertEqual(response_data, expected, 'should return WTD coverage')

            params['filters'] = json.dumps([{'name': 'date', 'prevFreq': 'M', 'freq': 'D', 'date': '20000131'}])
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                data={"security_id": [50, 50, 50, 50, 50]},
                labels=[
                    {"date": "2000-01-01"},
                    {"date": "2000-01-02"},
                    {"date": "2000-01-03"},
                    {"date": "2000-01-04"},
                    {"date": "2000-01-05"},
                ],
                success=True
            )
            unittest.assertEqual(response_data, expected, 'should return coverage')

    test_data.loc[:, 'baz'] = 'baz'

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(col='security_id', group=json.dumps([{'name': 'baz'}, {'name': 'date', 'freq': 'D'}]))
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                data={"baz": [50, 50, 50, 50, 50]},
                labels=[
                    {"date": "2000-01-01"},
                    {"date": "2000-01-02"},
                    {"date": "2000-01-03"},
                    {"date": "2000-01-04"},
                    {"date": "2000-01-05"},
                ],
                success=True
            )
            unittest.assertEqual(response_data, expected, 'should return coverage')

    test_data = pd.DataFrame(build_ts_data(days=15001, size=1), columns=['date', 'security_id', 'foo', 'bar'])
    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            params = dict(col='security_id', group=json.dumps([{'name': 'date', 'freq': 'D'}]))
            response = c.get('/dtale/coverage', query_string=params)
            response_data = json.loads(response.data)
            expected = dict(
                error=('Your grouping created 15001 groups, chart will not render. '
                       'Try making date columns a higher frequency (W, M, Q, Y)'),
                success=False
            )
            unittest.assertEqual(response_data, expected, 'should return coverage')

    with app.test_client() as c:
        with mock.patch('dtale.views.DATA', {c.port: test_data}):
            response = c.get('/dtale/coverage', query_string=dict(query="missing_col == 'blah'"))
            response_data = json.loads(response.data)
            unittest.assertEqual(
                response_data['error'], "name 'missing_col' is not defined", 'should handle correlations exception'
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
            response = c.get('/dtale/main')
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/iframe')
            assert '<title>D-Tale (test_name)</title>' in str(response.data)
            response = c.get('/dtale/popup/test', query_string=dict(col='foo'))
            assert '<title>D-Tale (test_name) - test (col: foo)</title>' in str(response.data)

    with app.test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.views.METADATA', {c.port: dict()}))
            stack.enter_context(mock.patch('dtale.views.SETTINGS', {c.port: dict(locked=[])}))
            response = c.get('/dtale/main')
            assert '<title>D-Tale</title>' in str(response.data)


@pytest.mark.unit
def test_200():
    paths = ['/dtale/main', '/dtale/iframe', '/dtale/popup/test', 'site-map', 'version-info', 'health']
    try:
        # flake8: NOQA
        from flasgger import Swagger
        paths.append('apidocs/')
    except ImportError:
        pass
    with app.test_client() as c:
        for path in paths:
            response = c.get(path)
            assert response.status_code == 200, '{} should return 200 response'.format(path)


@pytest.mark.unit
def test_302():
    with app.test_client() as c:
        for path in ['/', '/dtale', '/favicon.ico']:
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
            response = c.get('/dtale/main')
            assert response.status_code == 500
            assert '<h1>Internal Server Error</h1>' in str(response.data)
