from __future__ import division

import decimal
import json
import os
import socket
import sys
import time
from builtins import map, object
from functools import wraps
from logging import getLogger

from flask import jsonify as _jsonify

import numpy as np
import pandas as pd
from past.utils import old_div

logger = getLogger(__name__)


def running_with_pytest():
    """
    Checks to see if D-Tale has been initiated from test

    :return: `True` if executed from test, `False` otherwise
    :rtype: bool
    """
    return hasattr(sys, '_called_from_test')


def running_with_flask_debug():
    """
    Checks to see if D-Tale has been initiated from Flask

    :return: `True` if executed from test, `False` otherwise
    :rtype: bool
    """
    return os.environ.get('WERKZEUG_RUN_MAIN') == 'true'


def get_host(host=None):
    """
    Returns host input if it exists otherwise the output of :func:`python:socket.gethostname`

    :param host: hostname, can start with 'http://', 'https://' or just the hostname itself
    :type host: str, optional
    :return: str
    """

    def is_valid_host(host):
        try:
            socket.gethostbyname(host.split('://')[-1])
            return True
        except BaseException:
            return False

    if host is None:
        socket_host = socket.gethostname()
        if is_valid_host(socket_host):
            return socket_host
        return 'localhost'
    if is_valid_host(host):
        return host
    raise Exception('Hostname ({}) is not recognized'.format(host))


def build_url(port, host):
    """
    Returns full url combining host(if not specified will use the output of :func:`python:socket.gethostname`) & port

    :param port: integer string for the port to be used by the :class:`flask:flask.Flask` process
    :type port: str
    :param host: hostname, can start with 'http://', 'https://' or just the hostname itself
    :type host: str, optional
    :return: str
    """
    if host.startswith('http'):
        return '{}:{}'.format(host, port)
    return 'http://{}:{}'.format(host, port)


def build_shutdown_url(base):
    """
    Builds the shutdown endpoint for the specified port

    :param port: integer string for a D-Tale process's port
    :type port: str
    :return: URL string of the shutdown endpoint for the current server and port passed
    """
    return '{}/shutdown'.format(base)


def get_str_arg(r, name, default=None):
    """
    Retrieve argument from :attr:`flask:flask.request` and convert to string

    :param r: :attr:`flask:flask.request`
    :param name: argument name
    :type: str
    :param default: default value if parameter is non-existent, defaults to None
    :return: string argument value
    """
    val = r.args.get(name)
    if val is None or val == '':
        return default
    else:
        try:
            return str(val)
        except BaseException:
            return default


def get_int_arg(r, name, default=None):
    """
    Retrieve argument from :attr:`flask:flask.request` and convert to integer

    :param r: :attr:`flask:flask.request`
    :param name: argument name
    :type: str
    :param default: default value if parameter is non-existent, defaults to None
    :return: integer argument value
    """
    val = r.args.get(name)
    if val is None or val == '':
        return default
    else:
        try:
            return int(val)
        except BaseException:
            return default


def get_float_arg(r, name, default=None):
    """
    Retrieve argument from :attr:`flask:flask.request` and convert to float

    :param r: :attr:`flask:flask.request`
    :param name: argument name
    :type: str
    :param default: default value if parameter is non-existent, defaults to None
    :return: float argument value
    """
    val = r.args.get(name)
    if val is None or val == '':
        return default
    else:
        try:
            return float(val)
        except BaseException:
            return default


def get_bool_arg(r, name):
    """
    Retrieve argument from :attr:`flask:flask.request` and convert to boolean

    :param r: :attr:`flask:flask.request`
    :param name: argument name
    :type: str
    :return: `True` if lowercase value equals 'true', `False` otherwise
    """
    return r.args.get(name, 'false').lower() == 'true'


def json_string(x, nan_display=''):
    """
    convert value to string to be used within JSON output

    If a :class:`python.UnicodeEncodeError` occurs then :func:`python:str.encode` will be called on input

    :param x: value to be converted to string
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :return: string value
    :rtype: str
    """
    if x:
        try:
            return str(x)
        except UnicodeEncodeError:
            return x.encode('utf-8')
        except BaseException as ex:
            logger.exception(ex)
    return nan_display


def json_int(x, nan_display='', as_string=False):
    """
    Convert value to integer to be used within JSON output

    :param x: value to be converted to integer
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :param as_string: return integer as a formatted string (EX: 1,000,000)
    :return: integer value
    :rtype: int
    """
    try:
        if not np.isnan(x) and not np.isinf(x):
            return '{:,d}'.format(int(x)) if as_string else int(x)
        return nan_display
    except BaseException:
        return nan_display


# hack to solve issues with formatting floats with a precision more than 4 decimal points
# https://stackoverflow.com/questions/38847690/convert-float-to-string-without-scientific-notation-and-false-precision
DECIMAL_CTX = decimal.Context()
DECIMAL_CTX.prec = 20


def json_float(x, precision=2, nan_display='nan', as_string=False):
    """
    Convert value to float to be used within JSON output

    :param x: value to be converted to integer
    :param precision: precision of float to be returned
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :param as_string: return float as a formatted string (EX: 1,234.5643)
    :return: float value
    :rtype: float
    """
    try:
        if not np.isnan(x) and not np.isinf(x):
            output = float(round(x, precision))
            if as_string:
                str_output = format(DECIMAL_CTX.create_decimal(repr(x)), ',.{}f'.format(str(precision)))
                # drop trailing zeroes off & trailing decimal points if necessary
                return str_output.rstrip('0').rstrip('.')
            return output
        return nan_display
    except BaseException:
        return nan_display


def json_date(x, fmt='%Y-%m-%d %H:%M:%S', nan_display=''):
    """
    Convert value to date string to be used within JSON output

    :param x: value to be converted to date string
    :param fmt: the data string formatting to be applied
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :return: date string value
    :rtype: str (YYYY-MM-DD)
    """
    try:
        # calling unique on a pandas datetime column returns numpy datetime64
        output = (pd.Timestamp(x) if isinstance(x, np.datetime64) else x).strftime(fmt)
        empty_time = ' 00:00:00'
        if output.endswith(empty_time):
            return output[:-1 * len(empty_time)]
        return output
    except BaseException:
        return nan_display


def json_timestamp(x, nan_display=''):
    """
    Convert value to timestamp (milliseconds) to be used within JSON output

    :param x: value to be converted to milliseconds
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :return: millisecond value
    :rtype: bigint
    """
    try:
        output = (pd.Timestamp(x) if isinstance(x, np.datetime64) else x)
        output = int((time.mktime(output.timetuple()) + (old_div(output.microsecond, 1000000.0))) * 1000)
        return output
    except BaseException:
        return nan_display


class JSONFormatter(object):
    """
    Class for formatting dictionaries and lists of dictionaries into JSON compliant data

    :Example:

        >>> nan_display = 'nan'
        >>> f = JSONFormatter(nan_display)
        >>> f.add_int(1, 'a')
        >>> f.add_float(2, 'b')
        >>> f.add_string(3, 'c')
        >>> jsonify(f.format_dicts([dict(a=1, b=2.0, c='c')]))
    """

    def __init__(self, nan_display=''):
        self.fmts = []
        self.nan_display = nan_display

    def add_string(self, idx, name=None):
        self.fmts.append([idx, name, json_string])

    def add_int(self, idx, name=None, as_string=False):
        def f(x, nan_display):
            return json_int(x, nan_display=nan_display, as_string=as_string)
        self.fmts.append([idx, name, f])

    def add_float(self, idx, name=None, precision=6, as_string=False):
        def f(x, nan_display):
            return json_float(x, precision, nan_display=nan_display, as_string=as_string)
        self.fmts.append([idx, name, f])

    def add_timestamp(self, idx, name=None):
        self.fmts.append([idx, name, json_timestamp])

    def add_date(self, idx, name=None, fmt='%Y-%m-%d %H:%M:%S'):
        def f(x, nan_display):
            return json_date(x, fmt=fmt, nan_display=nan_display)
        self.fmts.append([idx, name, f])

    def add_json(self, idx, name=None):
        def f(x, nan_display):
            if x is None or pd.isnull(x):
                return None
            return x
        self.fmts.append([idx, name, f])

    def format_dict(self, lst):
        return {name: f(lst[idx], nan_display=self.nan_display) for idx, name, f in self.fmts}

    def format_dicts(self, lsts):
        return [self.format_dict(l) for l in lsts]

    def format_lists(self, df):
        return {name: [f(v, nan_display=self.nan_display) for v in df[name].values] for _idx, name, f in self.fmts}


def classify_type(type_name):
    """

    :param type_name: string label for value from :meth:`pandas:pandas.DataFrame.dtypes`
    :return: shortened string label for dtype
        S = str
        B = bool
        F = float
        I = int
        D = timestamp or datetime
        TD = timedelta
    :rtype: str
    """
    lower_type_name = type_name.lower()
    if lower_type_name.startswith('str'):
        return 'S'
    if lower_type_name.startswith('bool'):
        return 'B'
    if lower_type_name.startswith('float'):
        return 'F'
    if lower_type_name.startswith('int'):
        return 'I'
    if any([t for t in ['timestamp', 'datetime'] if lower_type_name.startswith(t)]):
        return 'D'
    if lower_type_name.startswith('timedelta'):
        return 'TD'
    return 'S'


def retrieve_grid_params(req, props=None):
    """
    Pull out grid parameters from :attr:`flask:flask.request` arguments and return as a `dict`

    :param req: :attr:`flask:flask.request`
    :param props: argument names
    :type props: list
    :return: dictionary of argument/value pairs
    :rtype: dict
    """
    params = dict()
    filters = get_str_arg(req, 'filters')
    if filters:
        params['filters'] = json.loads(filters)
    params['query'] = get_str_arg(req, 'query')

    params['page'] = get_int_arg(req, 'page', 1)
    params['page_size'] = get_int_arg(req, 'page_size')
    params['sort_column'] = get_str_arg(req, 'sortColumn')
    params['sort_direction'] = get_str_arg(req, 'sortDirection')
    sort = get_str_arg(req, 'sort')
    if sort:
        params['sort'] = json.loads(sort)
    if props:
        return filter_params(params, props)
    return params


def filter_params(params, props):
    """
    Return list of values from dictionary for list of keys
    """
    return list(map(params.get, props))


def sort_df_for_grid(df, params):
    """
    Sort dataframe based on 'sort' property in parameter dictionary. Sort
    configuration is of the following shape:
    {
        sort: [
            [col1, ASC],
            [col2, DESC],
            ...
        ]
    }

    :param df: dataframe
    :type df: :class:`pandas:pandas.DataFrame`
    :param params: arguments from :attr:`flask:flask.request`
    :type params: dict
    :return: sorted dataframe
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    if 'sort' in params:
        cols, dirs = [], []
        for col, dir in params['sort']:
            cols.append(col)
            dirs.append(dir == 'ASC')
        return df.sort_values(cols, ascending=dirs)
    return df.sort_index()


def filter_df_for_grid(df, params):
    """
    Filter dataframe based on 'filters' property in parameter dictionary. Filter
    configuration is of the following shape:
    {
        filters: {
            col1: {
                value: {
                    type: 1, # Equals
                    value: 1.0
                }
                type: 'NumericFilter'
            },
            col2: {
                value: {
                    type: 2, # Range
                    begin: 1.0,
                    end: 2.0
                }
                type: 'NumericFilter'
            },
            col3: {
                value: {
                    type: 3, # GreaterThan
                    value: 1.0
                }
                type: 'NumericFilter'
            },
            col4: {
                value: {
                    type: 4, # LessThan
                    value: 1.0
                }
                type: 'NumericFilter'
            },
            col5: {
                value: 'aaaa' # contains 'aaaa'
                type: 'StringFilter'
            },
            col6: {
                value: '2000-01-01' # contains '2000-01-01'
                type: 'StringFilter'
            },
            col7: {
                value: '=aaaa' # equals 'aaaa'
                type: 'StringFilter'
            }
        },
        query: 'col1 === 1'
    }

    :param df: dataframe
    :type df: :class:`pandas:pandas.DataFrame`
    :param params: arguments from :attr:`flask:flask.request`
    :type params: dict
    :return: filtering dataframe
    :rtype: :class:`pandas:pandas.DataFrame`
    """
    data_type_info = get_dtypes(df)
    for col, filter_cfg in params.get('filters', {}).items():
        filter_val = filter_cfg['value']
        if filter_cfg.get('type') == 'NumericFilter':
            for numeric_operation in filter_val:
                operation_type = numeric_operation['type']
                df_filter = None
                if operation_type == 2:  # Range
                    begin = numeric_operation.get('begin')
                    end = numeric_operation.get('end')
                    if begin is not None and end is not None:
                        df_filter = ((df[col] >= begin) & (df[col] <= end))
                elif numeric_operation.get('value') is not None:
                    operation_val = numeric_operation['value']
                    if operation_type == 1:  # Number
                        df_filter = df[col] == operation_val
                    elif operation_type == 3:  # GreaterThan
                        df_filter = df[col] > operation_val
                    elif operation_type == 4:  # LessThan
                        df_filter = df[col] < operation_val

                if df_filter is not None:
                    df = df[df_filter]
        else:  # this catches StringFilter values
            stringified_col = df[col]
            if classify_type(data_type_info[col]) == 'D':
                stringified_col = df[col].apply(lambda d: d.strftime('%Y-%m-%d'))
            if filter_val.startswith('='):
                df = df[stringified_col.astype(str) == filter_val[1:]]
            else:
                df = df[stringified_col.astype(str).str.lower().str.contains(filter_val.lower(), na=False)]
    if params.get('query'):
        df = df.query(params['query'])
    return df


def get_dtypes(df):
    """
    Build dictionary of column/dtype name pairs from :class:`pandas:pandas.DataFrame`
    """
    def _load():
        for col, dtype in df.dtypes.to_dict().items():
            if dtype.name == 'object':
                yield col, pd.api.types.infer_dtype(df[col], skipna=True)
            else:
                yield col, dtype.name
    return dict(list(_load()))


def grid_columns(df):
    """
    Build list of {name, dtype} dictionaries for columns in :class:`pandas:pandas.DataFrame`
    """
    data_type_info = get_dtypes(df)
    return [dict(name=c, dtype=data_type_info[c]) for c in df.columns]


DF_MAPPINGS = {
    'I': lambda f, i, c: f.add_int(i, c),
    'D': lambda f, i, c: f.add_date(i, c),
    'F': lambda f, i, c: f.add_float(i, c),
    'S': lambda f, i, c: f.add_string(i, c)
}


def find_dtype_formatter(dtype):
    type_classification = classify_type(dtype)
    if type_classification == 'I':
        return json_int
    if type_classification == 'D':
        return json_date
    if type_classification == 'F':
        return json_float
    return json_string


def grid_formatter(col_types, nan_display='', overrides=None):
    """
    Build :class:`dtale.utils.JSONFormatter` from :class:`pandas:pandas.DataFrame`
    """
    f = JSONFormatter(nan_display)
    mappings = dict_merge(DF_MAPPINGS, overrides or {})
    for i, ct in enumerate(col_types, 1):
        c, dtype = map(ct.get, ['name', 'dtype'])
        type_classification = classify_type(dtype)
        mappings.get(type_classification, DF_MAPPINGS['S'])(f, i, c)
    return f


def format_grid(df):
    """
    Translate :class:`pandas:pandas.DataFrame` to well-formed JSON.  Structure is as follows:
    {
        results: [
            {col1: val1_row1,...,colN: valN_row1},
            ...,
            {col1: val1_rowN,...,colN: valN_rowN},
        ],
        columns: [
            {name: col1, dtype: int},
            ...,
            {name: colN, dtype: float},
        ]
    }

    :param df: dataframe
    :type df: :class:`pandas:pandas.DataFrame`
    :return: JSON
    """
    col_types = grid_columns(df)
    f = grid_formatter(col_types)
    return {
        'results': f.format_dicts(df.itertuples()),
        'columns': col_types
    }


def handle_error(error_info):
    """
    Boilerplate exception messaging
    """
    logger.exception("Exception occurred while processing request: {}".format(error_info.get('error')))


def jsonify(return_data={}, **kwargs):
    """
    Overriding Flask's jsonify method to account for extra error handling

    :param return_data: dictionary of data to be passed to :meth:`flask:flask.jsonify`
    :param kwargs: Optional keyword arguments merged into return_data
    :return: output of :meth:`flask:flask.jsonify`
    """
    if isinstance(return_data, dict) and return_data.get('error'):
        handle_error(return_data)
        return _jsonify(dict_merge(dict(success=False), dict_merge(kwargs, return_data)))
    if len(kwargs):
        return _jsonify(dict_merge(kwargs, return_data))
    return _jsonify(return_data)


def find_selected_column(data, col):
    """
    In case we come across a series which after reset_index()
    it's columns are [date, security_id, values]
    in which case we want the last column

    :param data: dataframe
    :type data: :class:`pandas:pandas.DataFrame`
    :param col: column name
    :type col: str
    :return: column name if it exists within the dataframe's columns, the last column within the dataframe otherwise
    :rtype: str
    """

    return col if col in data.columns else data.columns[-1]


def make_list(vals):
    """
    Convert a value that is optionally list or scalar
    into a list
    """
    if vals is None:
        return []
    elif isinstance(vals, (list, tuple)):
        return vals
    else:
        return [vals]


def dict_merge(d1, d2):
    """
    Merges two dictionaries.  Items of the second dictionary will
    replace items of the first dictionary if there are any overlaps.
    Either dictionary can be None.  An empty dictionary {} will be
    returned if both dictionaries are None.

    :param d1: First dictionary can be None
    :type d1: dict
    :param d2: Second dictionary can be None
    :type d1: dict
    :return: new dictionary with the contents of d2 overlaying the contents of d1
    :rtype: dict
    """
    if not d1:
        return d2 or {}
    elif not d2:
        return d1 or {}
    return dict(list(d1.items()) + list(d2.items()))


def swag_from(path):
    try:
        from flasgger.utils import swag_from as flasgger_swag_from
        return flasgger_swag_from(path)
    except ImportError:
        def _swag_from(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                return f(*args, **kwargs)
            return decorated
        return _swag_from
