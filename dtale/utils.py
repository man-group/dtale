from __future__ import division

import decimal
import json
import os
import socket
import sys
import time
import traceback
import urllib
from builtins import map, object
from logging import getLogger

from flask import jsonify as _jsonify

import numpy as np
import pandas as pd
from pkg_resources import parse_version
from past.utils import old_div
from six import BytesIO, PY3, StringIO

logger = getLogger(__name__)


def running_with_pytest():
    """
    Checks to see if D-Tale has been initiated from test

    :return: `True` if executed from test, `False` otherwise
    :rtype: bool
    """
    return hasattr(sys, "_called_from_test")


def running_with_flask_debug():
    """
    Checks to see if D-Tale has been initiated from Flask

    :return: `True` if executed from test, `False` otherwise
    :rtype: bool
    """
    return os.environ.get("WERKZEUG_RUN_MAIN") == "true"


def get_url_unquote():
    """
    Returns URL unquote based on whether Python 2 or 3 is being used.
    """
    return urllib.parse.unquote if PY3 else urllib.unquote


def get_url_quote():
    """
    Returns URL quote based on whether Python 2 or 3 is being used.
    """
    return urllib.parse.quote if PY3 else urllib.quote


def get_host(host=None):
    """
    Returns host input if it exists otherwise the output of :func:`python:socket.gethostname`

    :param host: hostname, can start with 'http://', 'https://' or just the hostname itself
    :type host: str, optional
    :return: str
    """

    def is_valid_host(host):
        try:
            socket.gethostbyname(host.split("://")[-1])
            return True
        except BaseException:
            return False

    if host is None:
        socket_host = socket.gethostname()
        if is_valid_host(socket_host):
            return socket_host
        return "localhost"
    if is_valid_host(host):
        return host
    raise Exception("Hostname ({}) is not recognized".format(host))


def build_url(port, host):
    """
    Returns full url combining host(if not specified will use the output of :func:`python:socket.gethostname`) & port

    :param port: integer string for the port to be used by the :class:`flask:flask.Flask` process
    :type port: str
    :param host: hostname, can start with 'http://', 'https://' or just the hostname itself
    :type host: str, optional
    :return: str
    """
    final_port = ":{}".format(port) if port is not None else ""
    if (host or "").startswith("http"):
        return "{}{}".format(host, final_port)
    return "http://{}{}".format(host, final_port)


def build_shutdown_url(base):
    """
    Builds the shutdown endpoint for the specified port

    :param port: integer string for a D-Tale process's port
    :type port: str
    :return: URL string of the shutdown endpoint for the current server and port passed
    """
    return "{}/shutdown".format(base)


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
    if val is None or val == "":
        return default
    else:
        try:
            return str(val)
        except BaseException:
            return default


def get_json_arg(r, name, default=None):
    """
    Retrieve argument from :attr:`flask:flask.request` and parse JSON to python data structure

    :param r: :attr:`flask:flask.request`
    :param name: argument name
    :type: str
    :param default: default value if parameter is non-existent, defaults to None
    :return: parsed JSON
    """
    val = r.args.get(name)
    if val is None or val == "":
        return default
    else:
        return json.loads(val)


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
    if val is None or val == "":
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
    if val is None or val == "":
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
    return r.args.get(name, "false").lower() == "true"


def json_string(x, nan_display="", **kwargs):
    """
    convert value to string to be used within JSON output

    If a :class:`python.UnicodeEncodeError` occurs then :func:`python:str.encode` will be called on input

    :param x: value to be converted to string
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :return: string value
    :rtype: str
    """
    if pd.isnull(x):
        return nan_display
    if x or x in ["", False, 0, pd.Timedelta(0)]:
        try:
            return str(x)
        except UnicodeEncodeError:
            return x.encode("utf-8")
        except BaseException as ex:
            logger.exception(ex)
    return nan_display


def json_int(x, nan_display="", as_string=False, fmt="{:,d}"):
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
            return fmt.format(int(x)) if as_string else int(x)
        return nan_display
    except BaseException:
        return nan_display


# hack to solve issues with formatting floats with a precision more than 4 decimal points
# https://stackoverflow.com/questions/38847690/convert-float-to-string-without-scientific-notation-and-false-precision
DECIMAL_CTX = decimal.Context()
DECIMAL_CTX.prec = 20


def json_float(x, precision=2, nan_display="nan", inf_display="inf", as_string=False):
    """
    Convert value to float to be used within JSON output

    :param x: value to be converted to integer
    :param precision: precision of float to be returned
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :param inf_display: if `x` is :attr:`numpy:numpy.inf` then return this value
    :param as_string: return float as a formatted string (EX: 1,234.5643)
    :return: float value
    :rtype: float
    """
    try:
        if np.isinf(x):
            return inf_display
        if not np.isnan(x):
            output = float(round(x, precision))
            if as_string:
                str_output = format(
                    DECIMAL_CTX.create_decimal(repr(x)), ",.{}f".format(str(precision))
                )
                # drop trailing zeroes off & trailing decimal points if necessary
                return str_output.rstrip("0").rstrip(".")
            return output
        return nan_display
    except BaseException:
        return nan_display


def json_date(x, fmt="%Y-%m-%d %H:%M:%S.%f", nan_display="", **kwargs):
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
        empty_microseconds = ".000000"
        if output.endswith(empty_microseconds):
            output = output[: -1 * len(empty_microseconds)]
        empty_time = " 00:00:00"
        if output.endswith(empty_time):
            return output[: -1 * len(empty_time)]
        return output
    except BaseException:
        return nan_display


def json_timestamp(x, nan_display="", **kwargs):
    """
    Convert value to timestamp (milliseconds) to be used within JSON output
    :param x: value to be converted to milliseconds
    :param nan_display: if `x` is :attr:`numpy:numpy.nan` then return this value
    :return: millisecond value
    :rtype: bigint
    """
    try:
        output = pd.Timestamp(x) if isinstance(x, np.datetime64) else x
        output = int(
            (time.mktime(output.timetuple()) + (old_div(output.microsecond, 1000000.0)))
            * 1000
        )
        return str(output) if kwargs.get("as_string", False) else output
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

    def __init__(self, nan_display="", as_string=False):
        self.fmts = []
        self.nan_display = nan_display
        self.as_string = as_string

    def add_string(self, idx, name=None):
        def f(x, nan_display):
            return json_string(x, nan_display=nan_display)

        self.fmts.append([idx, name, f])

    def add_int(self, idx, name=None, as_string=False):
        def f(x, nan_display):
            return json_int(
                x, nan_display=nan_display, as_string=as_string or self.as_string
            )

        self.fmts.append([idx, name, f])

    def add_float(self, idx, name=None, precision=6, as_string=False):
        def f(x, nan_display):
            return json_float(
                x,
                precision,
                nan_display=nan_display,
                as_string=as_string or self.as_string,
            )

        self.fmts.append([idx, name, f])

    def add_timestamp(self, idx, name=None, as_string=False):
        def f(x, nan_display):
            return json_timestamp(
                x, nan_display=nan_display, as_string=as_string or self.as_string
            )

        self.fmts.append([idx, name, f])

    def add_date(self, idx, name=None, fmt="%Y-%m-%d %H:%M:%S.%f"):
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
        return {
            name: f(lst[idx], nan_display=self.nan_display)
            for idx, name, f in self.fmts
        }

    def format_dicts(self, lsts):
        return list(map(self.format_dict, lsts))

    def format_lists(self, df):
        return {
            name: [f(v, nan_display=self.nan_display) for v in df[name].values]
            for _idx, name, f in self.fmts
            if name in df.columns
        }

    def format_df(self, df):
        formatters = {col: f for _idx, col, f in self.fmts}
        cols = [col for col in df.columns if col in formatters]
        return pd.concat(
            [
                apply(
                    df[col], lambda v: formatters[col](v, nan_display=self.nan_display)
                )
                for col in cols
            ],
            axis=1,
        )


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
    lower_type_name = (type_name or "").lower()
    if lower_type_name.startswith("str"):
        return "S"
    if lower_type_name.startswith("bool"):
        return "B"
    if lower_type_name.startswith("float"):
        return "F"
    if lower_type_name.startswith("int"):
        return "I"
    if any([t for t in ["timestamp", "datetime"] if lower_type_name.startswith(t)]):
        return "D"
    if lower_type_name.startswith("timedelta"):
        return "TD"
    return "S"


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
    params["sort_column"] = get_str_arg(req, "sortColumn")
    params["sort_direction"] = get_str_arg(req, "sortDirection")
    sort = get_str_arg(req, "sort")
    if sort:
        params["sort"] = json.loads(sort)
    return params


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
    if "sort" in params:
        cols, dirs = [], []
        for col, dir in params["sort"]:
            cols.append(col)
            dirs.append(dir == "ASC")
        return df.sort_values(cols, ascending=dirs)
    return df.sort_index()


def find_dtype(s):
    """
    Helper function to determine the dtype of a :class:`pandas:pandas.Series`
    """
    if s.dtype.name == "object":
        return pd.api.types.infer_dtype(s, skipna=True)
    else:
        return s.dtype.name


def get_dtypes(df):
    """
    Build dictionary of column/dtype name pairs from :class:`pandas:pandas.DataFrame`
    """

    def _load():
        for col in df.columns:
            yield col, find_dtype(df[col])

    return dict(list(_load()))


def coord_type(s):
    if classify_type(find_dtype(s)) not in ["F", "I"]:
        return None
    is_pandas_1_3 = parse_version(pd.__version__) >= parse_version("1.3.0")
    inclusive = "both" if is_pandas_1_3 else True
    if "lat" in s.name.lower():
        return (
            None if (~s.dropna().between(-90, 90, inclusive=inclusive)).sum() else "lat"
        )
    if "lon" in s.name.lower():
        return (
            None
            if (~s.dropna().between(-180, 180, inclusive=inclusive)).sum()
            else "lon"
        )
    return None


def grid_columns(df):
    """
    Build list of {name, dtype} dictionaries for columns in :class:`pandas:pandas.DataFrame`
    """
    data_type_info = get_dtypes(df)
    return [dict(name=c, dtype=data_type_info[c]) for c in df.columns]


DF_MAPPINGS = {
    "I": lambda f, i, c: f.add_int(i, c),
    "D": lambda f, i, c: f.add_date(i, c),
    "F": lambda f, i, c: f.add_float(i, c),
    "S": lambda f, i, c: f.add_string(i, c),
}


def find_dtype_formatter(dtype, overrides=None):
    type_classification = classify_type(dtype)
    if type_classification in (overrides or {}):
        return overrides[type_classification]
    if type_classification == "I":
        return json_int
    if type_classification == "D":
        return json_date
    if type_classification == "F":
        return json_float
    return json_string


def grid_formatter(col_types, nan_display="", overrides=None, as_string=False):
    """
    Build :class:`dtale.utils.JSONFormatter` from :class:`pandas:pandas.DataFrame`
    """
    f = JSONFormatter(nan_display, as_string=as_string)
    mappings = dict_merge(DF_MAPPINGS, overrides or {})
    for i, ct in enumerate(col_types, 1):
        c, dtype = map(ct.get, ["name", "dtype"])
        type_classification = classify_type(dtype)
        mappings.get(type_classification, DF_MAPPINGS["S"])(f, i, c)
    return f


def build_formatters(df, nan_display=None):
    """
    Helper around :meth:`dtale.utils.grid_formatters` that will build a formatter for the data being fed into a chart as
    well as a formatter for the min/max values for each column used in the chart data.

    :param df: dataframe which contains column names and data types for formatters
    :type df: :class:`pandas:pandas.DataFrame`
    :return: json formatters for chart data and min/max values for each column used in the chart
    :rtype: (:class:`dtale.utils.JSONFormatter`, :class:`dtale.utils.JSONFormatter`)
    """
    cols = grid_columns(df)
    data_f = grid_formatter(cols, nan_display=nan_display)
    overrides = {"F": lambda f, i, c: f.add_float(i, c, precision=2)}
    range_f = grid_formatter(cols, overrides=overrides, nan_display=nan_display)
    return data_f, range_f


def format_grid(df, overrides=None):
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
    f = grid_formatter(col_types, overrides=overrides)
    return {"results": f.format_dicts(df.itertuples()), "columns": col_types}


def handle_error(error_info):
    """
    Boilerplate exception messaging
    """
    logger.exception(
        "Exception occurred while processing request: {}".format(
            error_info.get("error")
        )
    )


def jsonify(return_data={}, **kwargs):
    """
    Overriding Flask's jsonify method to account for extra error handling

    :param return_data: dictionary of data to be passed to :meth:`flask:flask.jsonify`
    :param kwargs: Optional keyword arguments merged into return_data
    :return: output of :meth:`flask:flask.jsonify`
    """
    if isinstance(return_data, dict) and return_data.get("error"):
        handle_error(return_data)
        return _jsonify(
            dict_merge(dict(success=False), dict_merge(kwargs, return_data))
        )
    if len(kwargs):
        return _jsonify(dict_merge(kwargs, return_data))
    return _jsonify(return_data)


class ChartBuildingError(Exception):
    """
    Exception for signalling there was an issue constructing the data for your chart.
    """

    def __init__(self, error, details=None):
        super(ChartBuildingError, self).__init__("Chart Error")
        self.error = error
        self.details = details


def jsonify_error(e):
    tb = traceback.format_exc()
    if isinstance(e, ChartBuildingError):
        if e.details:
            tb = e.details
        e = e.error
    return jsonify(dict(error=str(e), traceback=str(tb)))


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
    return [vals]


def dict_merge(d1, d2, *args):
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

    def _dict_merge(d11, d12):
        if not d11:
            return d12 or {}
        elif not d12:
            return d11 or {}
        return dict(list(d11.items()) + list(d12.items()))

    ret = _dict_merge(d1, d2)
    for d in args:
        ret = _dict_merge(ret, d)
    return ret


def flatten_lists(lists):
    """
    Take an iterable containing iterables and flatten them into one list.
        - [[1], [2], [3, 4]] => [1, 2, 3, 4]
    """
    return [item for sublist in lists for item in sublist]


def divide_chunks(lst, n):
    """
    Break list input 'l' up into smaller lists of size 'n'
    """
    # looping till length l
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


class DuplicateDataError(Exception):
    """
    Exception for signalling that similar data is trying to be loaded to D-Tale again.  Is this correct?
    """

    def __init__(self, data_id):
        super(DuplicateDataError, self).__init__("Duplicate Data")
        self.data_id = data_id


def triple_quote(val):
    return '"""{}"""'.format(val)


def export_to_csv_buffer(data, tsv=False):
    kwargs = dict(encoding="utf-8", index=False)
    if tsv:
        kwargs["sep"] = "\t"
    csv_buffer = StringIO()
    data.to_csv(csv_buffer, **kwargs)
    csv_buffer.seek(0)
    return csv_buffer


def export_to_parquet_buffer(data):
    try:
        import pyarrow  # noqa: F401
    except ImportError:
        raise ImportError(
            "In order to use the parquet exporter you must install pyarrow!"
        )
    kwargs = dict(compression="gzip", index=False)
    parquet_buffer = BytesIO()
    data.to_parquet(parquet_buffer, **kwargs)
    parquet_buffer.seek(0)
    return parquet_buffer


def is_app_root_defined(app_root):
    return app_root is not None and app_root != "/"


def fix_url_path(path):
    while "//" in path:
        path = path.replace("//", "/")
    return path


def apply(df, func, *args, **kwargs):
    try:
        import swifter  # noqa: F401

        return df.swifter.progress_bar(False).apply(func, *args, **kwargs)
    except ImportError:
        return df.apply(func, *args, **kwargs)


def optimize_df(df):
    for col in df.select_dtypes(include=["object"]):
        num_unique_values = len(df[col].unique())
        num_total_values = len(df[col])
        if num_unique_values / num_total_values < 0.5:
            df[col] = df[col].astype("category")
    return df


def read_file(file_path, encoding="utf-8"):
    open_kwargs = {}
    if PY3 and encoding:
        open_kwargs["encoding"] = encoding
    with open(file_path, "r", **open_kwargs) as file:
        output = file.read()
        if not PY3 and encoding:
            return output.decode(encoding)
        return output


def unique_count(s):
    return int(len(s.dropna().unique()))


def format_data(data, inplace=False, drop_index=False):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances data.  Some updates being made:
     - convert all column names to strings
     - drop any indexes back into the dataframe so what we are left is a natural index [0,1,2,...,n]
     - convert inputs that are indexes into dataframes
     - replace any periods in column names with underscores

    :param data: dataframe to build data type information for
    :type data: :class:`pandas:pandas.DataFrame`
    :param allow_cell_edits: If false, this will not allow users to edit cells directly in their D-Tale grid
    :type allow_cell_edits: bool, optional
    :param inplace: If true, this will call `reset_index(inplace=True)` on the dataframe used as a way to save memory.
                    Otherwise this will create a brand new dataframe, thus doubling memory but leaving the dataframe
                    input unchanged.
    :type inplace: bool, optional
    :param drop_index: If true, this will drop any pre-existing index on the dataframe input.
    :type drop_index: bool, optional
    :return: formatted :class:`pandas:pandas.DataFrame` and a list of strings constituting what columns were originally
             in the index
    :raises: Exception if the dataframe contains two columns of the same name
    """
    if isinstance(data, (pd.DatetimeIndex, pd.MultiIndex)):
        data = data.to_frame(index=False)

    if isinstance(data, (np.ndarray, list, dict)):
        try:
            data = pd.DataFrame(data)
        except BaseException:
            data = pd.Series(data).to_frame()

    index = [
        str(i) for i in make_list(data.index.name or data.index.names) if i is not None
    ]
    drop = True
    if not data.index.equals(pd.RangeIndex(0, len(data))):
        drop = False
        if not len(index):
            index = ["index"]

    if inplace:
        data.reset_index(inplace=True, drop=drop_index)
    else:
        data = data.reset_index(drop=drop_index)

    if drop_index:
        index = []

    if drop:
        if inplace:
            data.drop("index", axis=1, errors="ignore", inplace=True)
        else:
            data = data.drop("index", axis=1, errors="ignore")

    def _format_colname(colname):
        if isinstance(colname, tuple):
            formatted_vals = [
                find_dtype_formatter(type(v).__name__)(v, as_string=True)
                for v in colname
            ]
            return "_".join([v for v in formatted_vals if v])
        return str(colname).strip()

    data.columns = [_format_colname(c) for c in data.columns]
    if len(data.columns) > len(set(data.columns)):
        distinct_cols = set()
        dupes = set()
        for c in data.columns:
            if c in distinct_cols:
                dupes.add(c)
            distinct_cols.add(c)
        raise Exception(
            "data contains duplicated column names: {}".format(", ".join(sorted(dupes)))
        )

    for col in data.columns:
        dtype = find_dtype(data[col])
        all_null = data[col].isnull().all()
        if dtype.startswith("mixed") and not all_null:
            try:
                unique_count(data[col])
            except TypeError:
                # convert any columns with complex data structures (list, dict, etc...) to strings
                data.loc[:, col] = data[col].astype("str")
        elif dtype.startswith("period") and not all_null:
            # convert any pandas period_range columns to timestamps
            data.loc[:, col] = data[col].apply(lambda x: x.to_timestamp())
        elif dtype.startswith("datetime") and not all_null:
            # remove timezone information for filtering purposes
            data.loc[:, col] = data[col].dt.tz_localize(None)

    return data, index


def option(v):
    return dict(value=v, label="{}".format(v))
