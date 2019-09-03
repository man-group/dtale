import json
from collections import namedtuple

import mock
import numpy as np
import pandas as pd
import pandas.util.testing as pdt
import pytest
from six import PY3

import dtale.utils as utils


def build_req_tuple(args):
    req = namedtuple('req', 'args')
    return req(args)


@pytest.mark.unit
def test_getters():
    builtin_pkg = '__builtin__'
    if PY3:
        builtin_pkg = 'builtins'

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

    date = pd.Timestamp('20180430').tz_localize('US/Eastern')
    data = [['hello', 1, 1.6666666, date, date, {'a': 1}]]
    unittest.assertEqual(
        formatters.format_dicts(data),
        [{'int': 1, 'date': '2018-04-30', 'float': 1.666667, 'str': 'hello', 'timestamp': 1525060800000,
          'json': {'a': 1}}]
    )
    bad_data = [[None, np.nan, np.nan, np.nan, np.nan, np.nan]]
    unittest.assertEqual(
        formatters.format_dicts(bad_data),
        [{'int': '', 'date': '', 'float': '', 'str': '', 'timestamp': '', 'json': None}]
    )
    bad_data = [['hello', 'hello', 'hello', 'hello', 'hello', 'hello']]
    unittest.assertEqual(
        formatters.format_dicts(bad_data),
        [{'int': '', 'date': '', 'float': '', 'str': 'hello', 'timestamp': '', 'json': 'hello'}]
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
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req))
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({
        'filters': json.dumps({
            'security_id': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 1}]},
            'bar': {'type': 'NumericFilter', 'value': [{'begin': 1, 'end': 2, 'type': 2}]},
            'baz': {'type': 'StringFilter', 'value': '=baz'}
        })
    })
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req))
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({
        'filters': json.dumps({
            'security_id': {'type': 'NumericFilter', 'value': [{'value': 1, 'type': 1}]},
            'bar': {'type': 'NumericFilter', 'value': [{'value': 2, 'type': 4}]},
            'date': {'type': 'StringFilter', 'value': '2000-01-01'}
        })
    })
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req))
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])

    req = build_req_tuple({'query': 'security_id == 1'})
    results = utils.filter_df_for_grid(test_data, utils.retrieve_grid_params(req))
    pdt.assert_frame_equal(results, test_data[test_data.security_id == 1])


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
