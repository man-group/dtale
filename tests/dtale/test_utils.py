import json
from collections import namedtuple

import mock
import numpy as np
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

import dtale.utils as utils

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


def build_req_tuple(args):
    req = namedtuple('req', 'args')
    return req(args)


@pytest.mark.unit
def test_getters(builtin_pkg):
    req = build_req_tuple(
        {'int': '1', 'empty_int': '', 'str': 'hello', 'empty_str': '', 'bool': 'true', 'float': '1.1'}
    )
    val = utils.get_str_arg(req, 'str')
    assert isinstance(val, str) and val == 'hello'
    val = utils.get_str_arg(req, 'str_def', default='def')
    assert val == 'def'
    val = utils.get_str_arg(req, 'empty_str')
    assert val is None
    with mock.patch('{}.str'.format(builtin_pkg), mock.Mock(side_effect=Exception)):
        val = utils.get_str_arg(req, 'str', default='def')
        assert val == 'def'
    val = utils.get_int_arg(req, 'int')
    assert isinstance(val, int) and val == 1
    val = utils.get_int_arg(req, 'int_def', default=2)
    assert val == 2
    val = utils.get_int_arg(req, 'empty_int')
    assert val is None
    with mock.patch('{}.int'.format(builtin_pkg), mock.Mock(side_effect=Exception)):
        val = utils.get_int_arg(req, 'int', default=2)
        assert val == 2
    val = utils.get_bool_arg(req, 'bool')
    assert isinstance(val, bool) and val

    val = utils.get_float_arg(req, 'float')
    assert isinstance(val, float) and val == 1.1
    val = utils.get_float_arg(req, 'int_def', default=2.0)
    assert val == 2.0
    val = utils.get_float_arg(req, 'empty_float')
    assert val is None
    with mock.patch('{}.float'.format(builtin_pkg), mock.Mock(side_effect=Exception)):
        val = utils.get_float_arg(req, 'float', default=2.0)
        assert val == 2


@pytest.mark.unit
def test_formatters(unittest):
    formatters = utils.JSONFormatter()
    formatters.add_string(0, name='str')
    formatters.add_int(1, name='int')
    formatters.add_float(2, name='float')
    formatters.add_date(3, name='date')
    formatters.add_timestamp(4, name='timestamp')
    formatters.add_json(5, name='json')
    formatters.add_date(6, name='ts_date')

    date = pd.Timestamp('20180430').tz_localize('US/Eastern')
    timestamp = pd.Timestamp('20180430 12:36:44').tz_localize('US/Eastern')
    data = [['hello', 1, 1.6666666, date, date, {'a': 1}, timestamp]]
    unittest.assertEqual(
        formatters.format_dicts(data),
        [{'int': 1, 'date': '2018-04-30', 'float': 1.666667, 'str': 'hello', 'timestamp': 1525060800000,
          'json': {'a': 1}, 'ts_date': '2018-04-30 12:36:44'}]
    )
    bad_data = [[None, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan]]
    unittest.assertEqual(
        formatters.format_dicts(bad_data),
        [{'int': '', 'date': '', 'float': '', 'str': '', 'timestamp': '', 'json': None, 'ts_date': ''}]
    )
    bad_data = [['hello', 'hello', 'hello', 'hello', 'hello', 'hello', 'hello']]
    unittest.assertEqual(
        formatters.format_dicts(bad_data),
        [{'int': '', 'date': '', 'float': '', 'str': 'hello', 'timestamp': '', 'json': 'hello', 'ts_date': ''}]
    )

    unittest.assertEqual(
        formatters.format_lists(
            pd.DataFrame(data, columns=['str', 'int', 'float', 'date', 'timestamp', 'json', 'ts_date'])
        ),
        {
            'int': [1], 'timestamp': [1525075200000], 'float': [1.666667], 'ts_date': ['2018-04-30 16:36:44'],
            'json': [{'a': 1}], 'str': ['hello'], 'date': ['2018-04-30 04:00:00']
        }
    )


@pytest.mark.unit
def test_filter_df_for_grid(test_data):
    req = build_req_tuple({
        'filters': json.dumps({
            'security_id': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 1}]},
            'bar': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 3}]},
            'baz': {'type': 'StringFilter', 'value': 'baz'}
        })
    })
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req), dict())
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({
        'filters': json.dumps({
            'security_id': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 1}]},
            'bar': {'type': 'NumericFilter', 'value': [{'begin': 1, 'end': 2, 'type': 2}]},
            'baz': {'type': 'StringFilter', 'value': '=baz'}
        })
    })
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req), dict())
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({
        'filters': json.dumps({
            'security_id': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 1}]},
            'bar': {'type': 'NumericFilter', 'value': [{'value': 2, 'type': 4}]},
            'date': {'type': 'StringFilter', 'value': '2000-01-01'}
        })
    })
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req), dict())
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({'query': 'security_id == 1'})
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req), dict())
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({'page': 1, 'page_size': 50})
    page, page_size = utils.retrieve_grid_params(req, props=['page', 'page_size'])
    assert page == 1
    assert page_size == 50


@pytest.mark.unit
def test_format_grid(unittest):
    output = utils.format_grid(pd.DataFrame([dict(a=1, b='foo', c=3.5, d=pd.Timestamp('20190101'))]))
    unittest.assertEqual(output, {
        'results': [{'a': 1, 'c': 3.5, 'b': 'foo', 'd': '2019-01-01'}],
        'columns': [
            {'dtype': 'int64', 'name': 'a'},
            {'dtype': 'string', 'name': 'b'},
            {'dtype': 'float64', 'name': 'c'},
            {'dtype': 'datetime64[ns]', 'name': 'd'}
        ]
    }, 'should format dataframe correctly')


@pytest.mark.unit
def test_make_list():
    assert utils.make_list(None) == []
    assert utils.make_list([1]) == [1]
    assert utils.make_list(1) == [1]


@pytest.mark.unit
def test_dict_merge():
    assert utils.dict_merge(dict(a=1), dict(b=2)) == dict(a=1, b=2)
    assert utils.dict_merge(dict(a=1), dict(a=2)) == dict(a=2)
    assert utils.dict_merge(None, dict(b=2)) == dict(b=2)
    assert utils.dict_merge(dict(a=1), None) == dict(a=1)


@pytest.mark.unit
def test_classify_type():
    assert utils.classify_type('string') == 'S'
    assert utils.classify_type('boolean') == 'B'
    assert utils.classify_type('float64') == 'F'
    assert utils.classify_type('integer64') == 'I'
    assert utils.classify_type('timestamp') == 'D'
    assert utils.classify_type('timedelta') == 'TD'
    assert utils.classify_type('foo') == 'S'


@pytest.mark.unit
def test_build_url():
    assert utils.build_url(8080, 'localhost') == 'http://localhost:8080'
    assert utils.build_url(8080, 'http://localhost') == 'http://localhost:8080'
    assert utils.build_url(8080, 'https://localhost') == 'https://localhost:8080'


@pytest.mark.unit
def test_get_host():
    with mock.patch('socket.gethostname', mock.Mock(return_value='test')),\
            mock.patch('socket.gethostbyname', mock.Mock(return_value='127.0.0.1')):
        assert utils.get_host() == 'test'
    with mock.patch('socket.gethostbyname', mock.Mock(return_value='127.0.0.1')):
        assert utils.get_host('test') == 'test'
    with mock.patch('socket.gethostname', mock.Mock(return_value='http://test')),\
            mock.patch('socket.gethostbyname', mock.Mock(side_effect=Exception)):
        assert utils.get_host() == 'localhost'
    with mock.patch('socket.gethostbyname', mock.Mock(side_effect=Exception)):
        with pytest.raises(Exception) as error:
            utils.get_host('test')
        assert str(error.value).startswith('Hostname (test) is not recognized')


@pytest.mark.unit
def test_json_string(builtin_pkg):
    assert utils.json_string(None, nan_display='nan') == 'nan'
    assert utils.json_string(u"\u25B2") is not None

    class MockStr(object):
        def __init__(self, string=''):
            raise Exception('test')

    class MockLogger(object):
        def exception(self, v):
            pass

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.str'.format(builtin_pkg), mock.Mock(side_effect=MockStr)))
        stack.enter_context(mock.patch('dtale.utils.logger', MockLogger()))
        assert utils.json_string('blah', nan_display='nan') == 'nan'


@pytest.mark.unit
def test_json_string2(builtin_pkg):
    class MockLogger(object):
        def exception(self, v):
            pass

    class MockStr(object):
        def __init__(self, string=''):
            if PY3:
                raise UnicodeEncodeError('', '', 0, 0, '')
            else:
                raise UnicodeEncodeError('', u'', 0, 0, '')

    class TestStr(object):
        def encode(self, encoding=None, errors=None):
            pass

    with ExitStack() as stack:
        stack.enter_context(mock.patch('{}.str'.format(builtin_pkg), mock.Mock(side_effect=MockStr)))
        stack.enter_context(mock.patch('dtale.utils.logger', MockLogger()))
        utils.json_string(TestStr(), nan_display='nan')


@pytest.mark.unit
def test_make_timeout_request():
    class MockProcess(object):
        def __init__(self, target=None, args=None, kwargs=None):
            pass

        def start(self):
            pass

        def join(self, timeout=None):
            pass

        def is_alive(self):
            return True

        def terminate(self):
            pass

    with mock.patch('dtale.utils.Process', mock.Mock(side_effect=MockProcess)):
        with pytest.raises(Exception) as error:
            utils.make_timeout_request(utils.dict_merge, args=({}, {}))
    assert str(error.value).endswith('Request took longer than 60 seconds. Please try adding additional filtering...')
