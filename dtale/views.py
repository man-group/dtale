from __future__ import absolute_import, division

import traceback
import webbrowser
from builtins import map, range, str, zip
from logging import getLogger

from flask import json, render_template, request

import numpy as np
import pandas as pd
import requests
from flasgger.utils import swag_from
from future.utils import string_types
from pandas.tseries.offsets import Day, MonthBegin, QuarterBegin, YearBegin

from dtale import dtale
from dtale.cli.clickutils import retrieve_meta_info_and_version
from dtale.utils import (build_shutdown_url, build_url, dict_merge,
                         filter_df_for_grid, find_dtype_formatter,
                         find_selected_column, get_dtypes, get_int_arg,
                         get_str_arg, grid_columns, grid_formatter, json_date,
                         json_float, json_int, json_timestamp, jsonify,
                         make_list, retrieve_grid_params, running_with_flask,
                         running_with_pytest, sort_df_for_grid)

logger = getLogger(__name__)

DATA = {}
DTYPES = {}
SETTINGS = {}
METADATA = {}


class DtaleData(object):
    """
    Wrapper class to abstract the global state of a D-Tale process while allowing
    a user to programatically interact with a running D-Tale instance

    :param port: integer string for a D-Tale process's port
    :type port: str

    :Example:

        >>> import dtale
        >>> import pandas as pd
        >>> df = pd.DataFrame([dict(a=1,b=2,c=3)])
        >>> d = dtale.show(df)
        >>> tmp = d.data.copy()
        >>> tmp['d'] = 4
        >>> d.data = tmp
        >>> d.kill()
    """

    def __init__(self, port):
        self._port = port
        self._url = build_url(port)

    @property
    def data(self):
        return DATA[self._port]

    @data.setter
    def data(self, data):
        startup(data=data, port=self._port)

    def kill(self):
        requests.get(build_shutdown_url(self._port))

    def open_browser(self):
        webbrowser.get().open(self._url)


def build_dtypes_state(data):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances columns & data types

    :param data: dataframe to build data type information for
    :type data: pandas.DataFrame
    :return: a list of dictionaries containing column names, indexes and data types
    """
    dtypes = get_dtypes(data)
    return [dict(name=c, dtype=dtypes[c], index=i) for i, c in enumerate(data.columns)]


def format_data(data):
    if isinstance(data, (pd.DatetimeIndex, pd.MultiIndex)):
        data = data.to_frame(index=False)

    logger.debug('pytest: {}, flask: {}'.format(running_with_pytest(), running_with_flask()))
    index = [str(i) for i in make_list(data.index.name or data.index.names) if i is not None]
    data = data.reset_index().drop('index', axis=1, errors='ignore')
    data.columns = [str(c) for c in data.columns]
    return data, index


def startup(data=None, data_loader=None, port=None, name=None):
    """
    Loads and stores data globally
    - If data has indexes then it will lock save those columns as locked on the front-end
    - If data has column named index it will be dropped so that it won't collide with row numbering (dtale_index)
    - Create location in memory for storing settings which can be manipulated from the front-end (sorts, filter, ...)

    :param data: pandas.DataFrame or pandas.Series
    :param data_loader: function which returns pandas.DataFrame
    :param port: integer port for running Flask process
    """
    global DATA, DTYPES, SETTINGS, METADATA

    if data_loader is not None:
        data = data_loader()

    if data is not None:
        if not isinstance(data, (pd.DataFrame, pd.Series, pd.DatetimeIndex, pd.MultiIndex)):
            raise Exception(
                'data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex'
            )

        if isinstance(data, (pd.DatetimeIndex, pd.MultiIndex)):
            data = data.to_frame(index=False)

        logger.debug('pytest: {}, flask: {}'.format(running_with_pytest(), running_with_flask()))
        data, curr_index = format_data(data)
        port_key = str(port)
        if port_key in SETTINGS:
            curr_settings = SETTINGS[port_key]
            curr_locked = curr_settings.get('locked', [])
            # filter out previous locked columns that don't exist
            curr_locked = [c for c in curr_locked if c in data.columns]
            # add any new columns in index
            curr_locked += [c for c in curr_index if c not in curr_locked]
        else:
            logger.debug('pre-locking index columns ({}) to settings[{}]'.format(curr_index, port))
            curr_locked = curr_index
            METADATA[port_key] = dict(start=pd.Timestamp('now'), name=name)

        # in the case that data has been updated we will drop any sorts or filter for ease of use
        SETTINGS[port_key] = dict(locked=curr_locked)
        DATA[port_key] = data
        DTYPES[port_key] = build_dtypes_state(data)
        return DtaleData(port_key)
    else:
        raise Exception('data loaded is None!')


def cleanup(port):
    """
    Helper function for cleanup up state related to a D-Tale process with a specific port

    :param port: integer string for a D-Tale process's port
    :type port: str
    """
    global DATA, DTYPES, SETTINGS

    # use pop() because in some pytests port is not available
    DATA.pop(port, None)
    SETTINGS.pop(port, None)
    DTYPES.pop(port, None)


def get_port():
    return get_str_arg(request, 'port', request.environ.get('SERVER_PORT', 'curr'))


@dtale.route('/main')
@swag_from('swagger/dtale/views/main.yml')
def view_main():
    """
    Flask route which serves up base jinja template housing JS files

    :return: HTML
    """
    curr_settings = SETTINGS.get(get_port(), {})
    _, version = retrieve_meta_info_and_version('dtale')
    return render_template(
        'dtale/main.html', settings=json.dumps(curr_settings), version=str(version), processes=len(DATA)
    )


@dtale.route('/processes')
@swag_from('swagger/dtale/views/test-filter.yml')
def get_processes():
    """
    Flask route which returns list of running D-Tale processes within current python process

    :return: JSON {
        data: [
            {
                port: 1, name: 'name1', rows: 5, columns: 5, names: 'col1,...,col5', start: '2018-04-30 12:36:44',
                ts: 1525106204000
            },
            ...,
            {
                port: N, name: 'nameN', rows: 5, columns: 5, names: 'col1,...,col5', start: '2018-04-30 12:36:44',
                ts: 1525106204000
            }
        ],
        success: True/False
    }
    """
    def _load_process(port):
        data = DATA[port]
        dtypes = DTYPES[port]
        mdata = METADATA[port]
        return dict(
            port=port,
            rows=len(data),
            columns=len(dtypes),
            names=','.join([c['name'] for c in dtypes]),
            start=json_date(mdata['start']),
            ts=json_timestamp(mdata['start']),
            name=mdata['name']
        )

    try:
        processes = sorted([_load_process(port) for port in DATA], key=lambda p: p['ts'])
        return jsonify(dict(data=processes, success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/update-settings')
@swag_from('swagger/dtale/views/update-settings.yml')
def update_settings():
    """
    Flask route which updates global SETTINGS for current port

    :param port: number string from flask.request.environ['SERVER_PORT']
    :param settings: JSON string from flask.request.args['settings'] which gets decoded and stored in SETTINGS variable
    :return: JSON
    """
    try:
        global SETTINGS

        port = get_port()
        curr_settings = SETTINGS.get(port, {})
        updated_settings = dict_merge(curr_settings, json.loads(get_str_arg(request, 'settings', '{}')))
        SETTINGS[port] = updated_settings
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def _test_filter(data, query):
    if query is not None and len(query):
        data.query(query)


@dtale.route('/test-filter')
@swag_from('swagger/dtale/views/test-filter.yml')
def test_filter():
    """
    Flask route which will test out pandas query before it gets applied to DATA and return exception information to the
    screen if there is any

    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :return: JSON {success: True/False}
    """
    try:
        query = get_str_arg(request, 'query')
        _test_filter(DATA[get_port()], query)
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/dtypes')
@swag_from('swagger/dtale/views/dtypes.yaml')
def dtypes():
    """
    Flask route which returns a list of column names and dtypes to the front-end as JSON

    :return: JSON {
        dtypes: [
            {index: 1, name: col1, dtype: int64},
            ...,
            {index: N, name: colN, dtype: float64}
        ],
        success: True/False
    }
    """
    try:
        return jsonify(dtypes=DTYPES[get_port()], success=True)
    except BaseException as e:
        return jsonify(error=str(e), traceback=str(traceback.format_exc()))


def load_describe(column_series):
    """
    Helper function for grabbing the output from pandas.Series.describe in a JSON serializable format

    :param column_series: data to describe
    :type column_series: pandas.Series
    :return: JSON serializable dictionary of the output from calling pandas.Series.describe
    """
    desc = column_series.describe().to_frame().T
    desc_f_overrides = {
        'I': lambda f, i, c: f.add_int(i, c, as_string=True),
        'F': lambda f, i, c: f.add_float(i, c, precision=4, as_string=True),
    }
    desc_f = grid_formatter(grid_columns(desc), nan_display='N/A', overrides=desc_f_overrides)
    desc = desc_f.format_dict(next(desc.itertuples(), None))
    if 'count' in desc:
        # pandas always returns 'count' as a float and it adds useless decimal points
        desc['count'] = desc['count'].split('.')[0]
    return desc


@dtale.route('/describe/<column>')
@swag_from('swagger/dtale/views/describe.yaml')
def describe(column):
    """
    Flask route which returns standard details about column data using pandas.DataFrame[col].describe to
    the front-end as JSON

    :param column: required dash separated string "START-END" stating a range of row indexes to be returned
                   to the screen
    :return: JSON {
        describe: object representing output from pandas.Series.describe,
        unique_data: array of unique values when data has <= 100 unique values
        success: True/False
    }

    """
    try:
        data = DATA[get_port()]
        desc = load_describe(data[column])
        return_data = dict(describe=desc, success=True)
        uniq_vals = data[column].unique()
        if 'unique' not in return_data['describe']:
            return_data['describe']['unique'] = json_int(len(uniq_vals), as_string=True)
        if len(uniq_vals) <= 100:
            uniq_f = find_dtype_formatter(get_dtypes(data)[column])
            return_data['uniques'] = [uniq_f(u, nan_display='N/A') for u in uniq_vals]
        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/data')
@swag_from('swagger/dtale/views/data.yml')
def get_data():
    """
    Flask route which returns current rows from DATA (based on scrollbar specs and saved settings) to front-end as
    JSON

    :param ids: required dash separated string "START-END" stating a range of row indexes to be returned to the screen
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param sort: JSON string from flask.request.args['sort'] which is applied to DATA using the sort_values() or
                 sort_index() function.  Here is the JSON structure: [col1,dir1],[col2,dir2],....[coln,dirn]
    :param port: number string from flask.request.environ['SERVER_PORT'] for retrieving saved settings
    :return: JSON {
        results: [
            {dtale_index: 1, col1: val1_1, ...,colN: valN_1},
            ...,
            {dtale_index: N2, col1: val1_N2, ...,colN: valN_N2}
        ],
        columns: [{name: col1, dtype: 'int64'},...,{name: colN, dtype: 'datetime'}],
        total: N2,
        success: True/False
    }
    """
    try:
        global SETTINGS, DATA, DTYPES
        port = get_port()
        data = DATA[port]

        # this will check for when someone instantiates D-Tale programatically and directly alters the internal
        # state of the dataframe (EX: d.data['new_col'] = 'foo')
        curr_dtypes = [c['name'] for c in DTYPES[port]]
        if any(c not in curr_dtypes for c in data.columns):
            data, _ = format_data(data)
            DATA[port] = data
            DTYPES[port] = build_dtypes_state(data)

        params = retrieve_grid_params(request)
        ids = get_str_arg(request, 'ids')
        if ids:
            ids = json.loads(ids)
        else:
            return jsonify({})
        col_types = grid_columns(data)

        f = grid_formatter(col_types)
        curr_settings = SETTINGS.get(port, {})
        if curr_settings.get('sort') != params.get('sort'):
            data = sort_df_for_grid(data, params)
            DATA[port] = data
        if params.get('sort') is not None:
            curr_settings = dict_merge(curr_settings, dict(sort=params['sort']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'sort'}
        data = filter_df_for_grid(data, params)
        if params.get('query') is not None:
            curr_settings = dict_merge(curr_settings, dict(query=params['query']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'query'}
        SETTINGS[port] = curr_settings

        total = len(data)
        results = {}
        idx_col = str('dtale_index')
        for sub_range in ids:
            sub_range = list(map(int, sub_range.split('-')))
            if len(sub_range) == 1:
                sub_df = data.iloc[sub_range[0]:sub_range[0] + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                results[sub_range[0]] = dict_merge({idx_col: sub_range[0]}, sub_df[0])
            else:
                [start, end] = sub_range
                sub_df = data.iloc[start:] if end >= len(data) - 1 else data.iloc[start:end + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                for i, d in zip(range(start, end + 1), sub_df):
                    results[i] = dict_merge({idx_col: i}, d)
        return_data = dict(
            results=results,
            columns=[dict(name=idx_col, dtype='int64')] + col_types,
            total=total
        )
        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/histogram')
@swag_from('swagger/dtale/views/histogram.yml')
def get_histogram():
    """
    Flask route which returns output from numpy.histogram to front-end as JSON

    :param col: string from flask.request.args['col'] containing name of a column in your dataframe
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param bins: the number of bins to display in your histogram, options on the front-end are 5, 10, 20, 50
    :returns: JSON {results: DATA, desc: output from pd.DataFrame[col].describe(), success: True/False}
    """
    col = get_str_arg(request, 'col', 'values')
    query = get_str_arg(request, 'query')
    bins = get_int_arg(request, 'bins', 20)
    try:
        data = DATA[get_port()]
        if query:
            data = data.query(query)

        selected_col = find_selected_column(data, col)
        data = data[~pd.isnull(data[selected_col])][[selected_col]]
        hist = np.histogram(data, bins=bins)

        desc = load_describe(data[selected_col])
        return jsonify(data=[json_float(h) for h in hist[0]], labels=['{0:.1f}'.format(l) for l in hist[1]], desc=desc)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/correlations')
@swag_from('swagger/dtale/views/correlations.yml')
def get_correlations():
    """
    Flask route which gathers Pearson correlations against all combinations of columns with numeric data
    using pandas.DataFrame.corr

    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :returns: JSON {
        data: [{column: col1, col1: 1.0, col2: 0.99, colN: 0.45},...,{column: colN, col1: 0.34, col2: 0.88, colN: 1.0}],
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    try:
        query = get_str_arg(request, 'query')
        port = get_port()
        data = DATA[port]
        data = data.query(query) if query is not None else data

        # using pandas.corr proved to be quite slow on large datasets so I moved to numpy:
        # https://stackoverflow.com/questions/48270953/pandas-corr-and-corrwith-very-slow
        valid_corr_cols = [c['name'] for c in DTYPES[port] if any((c['dtype'].startswith(s) for s in ['int', 'float']))]
        data = np.corrcoef(data[valid_corr_cols].values, rowvar=False)
        data = pd.DataFrame(data, columns=valid_corr_cols, index=valid_corr_cols)

        data.index.name = str('column')
        data = data.reset_index()
        col_types = grid_columns(data)
        f = grid_formatter(col_types, nan_display=None)
        return jsonify(data=f.format_dicts(data.itertuples()))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def _build_timeseries_chart_data(name, df, cols, min=None, max=None, sub_group=None):
    """
    Helper function for grabbing JSON serialized data for one or many date groupings

    :param name: base name of series in chart
    :param df: data frame to be grouped
    :param cols: columns whose data is to be returned
    :param min: optional hardcoded minimum to be returned for all series
    :param max: optional hardcoded maximum to be returned for all series
    :param sub_group: optional sub group to be used in addition to date
    :return: generator of string keys and JSON serialized dictionaries
    """
    base_cols = ['date']
    if sub_group in df:
        dfs = df.groupby(sub_group)
        base_cols.append(sub_group)
    else:
        dfs = [('', df)]

    for sub_group_val, grp in dfs:
        for col in cols:
            key = '{0}:{1}:{2}'.format(
                sub_group_val if isinstance(sub_group_val, string_types) else '{0:.0f}'.format(sub_group_val), name, col
            )
            data = grp[base_cols + [col]].dropna(subset=[col])
            f = grid_formatter(grid_columns(data), overrides={'D': lambda f, i, c: f.add_timestamp(i, c)})
            data = f.format_dicts(data.itertuples())
            data = dict(data=data, min=min or grp[col].min(), max=max or grp[col].max())
            yield key, data


@dtale.route('/correlations-ts')
@swag_from('swagger/dtale/views/correlations-ts.yml')
def get_correlations_ts():
    """
    Flask route which returns timeseries of Pearson correlations of two columns with numeric data
    using pandas.DataFrame.corr

    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param cols: comma-separated string from flask.request.args['cols'] containing names of two columns in dataframe
    :param dateCol: string from flask.request.args['dateCol'] with name of date-type column in dateframe for timeseries
    :returns: JSON {
        data: {:col1:col2: {data: [{corr: 0.99, date: 'YYYY-MM-DD'},...], max: 0.99, min: 0.99}
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    try:
        query = get_str_arg(request, 'query')
        data = DATA[get_port()]
        data = data.query(query) if query is not None else data
        cols = get_str_arg(request, 'cols')
        cols = cols.split(',')
        date_col = get_str_arg(request, 'dateCol')
        data = data.groupby(date_col)[list(set(cols))].corr(method='pearson')
        data.index.names = ['date', 'column']
        data = data.reset_index()
        data = data[data.column == cols[0]][['date', cols[1]]]
        data.columns = ['date', 'corr']
        data = {k: v for k, v in _build_timeseries_chart_data('corr', data, ['corr'])}
        return jsonify(dict(data=data))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/scatter')
@swag_from('swagger/dtale/views/scatter.yml')
def get_scatter():
    """
    Flask route which returns data used in correlation of two columns for scatter chart

    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param cols: comma-separated string from flask.request.args['cols'] containing names of two columns in dataframe
    :param dateCol: string from flask.request.args['dateCol'] with name of date-type column in dateframe for timeseries
    :param date: string from flask.request.args['date'] date value in dateCol to filter dataframe to
    :returns: JSON {
        data: [{col1: 0.123, col2: 0.123, index: 1},...,{col1: 0.123, col2: 0.123, index: N}],
        stats: {
            correlated: 50,
            only_in_s0: 1,
            only_in_s1: 2,
            pearson: 0.987,
            spearman: 0.879,
        }
        x: col1,
        y: col2
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    cols = get_str_arg(request, 'cols')
    cols = cols.split(',')
    query = get_str_arg(request, 'query')
    date = get_str_arg(request, 'date')
    date_col = get_str_arg(request, 'dateCol')
    try:
        data = DATA[get_port()]
        data = data[data[date_col] == date] if date else data
        if query:
            data = data.query(query)

        data = data[list(set(cols))].dropna(how='any')
        data['index'] = data.index
        s0 = data[cols[0]]
        s1 = data[cols[1]]
        pearson = s0.corr(s1, method='pearson')
        spearman = s0.corr(s1, method='spearman')
        stats = dict(
            pearson='N/A' if pd.isnull(pearson) else pearson,
            spearman='N/A' if pd.isnull(spearman) else spearman,
            correlated=len(data),
            only_in_s0=len(data[data[cols[0]].isnull()]),
            only_in_s1=len(data[data[cols[1]].isnull()])
        )

        if len(data) > 15000:
            return jsonify(
                stats=stats,
                error='Dataset exceeds 15,000 records, cannot render scatter. Please apply filter...'
            )
        f = grid_formatter(grid_columns(data))
        data = f.format_dicts(data.itertuples())
        return jsonify(data=data, x=cols[0], y=cols[1], stats=stats)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


DATE_RANGES = {
    'W': lambda today: today - Day(today.dayofweek),
    'M': lambda today: today if today.is_month_start else today - MonthBegin(),
    'Q': lambda today: today if today.is_quarter_start else today - QuarterBegin(startingMonth=1),
    'Y': lambda today: today if today.is_year_start else today - YearBegin(),
}


@dtale.route('/coverage')
@swag_from('swagger/dtale/views/coverage.yml')
def find_coverage():
    """
    Flask route which returns coverage information(counts) for a column grouped by other column(s)

    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param col: string from flask.request.args['col'] containing name of a column in your dataframe
    :param filters(deprecated): JSON string from flaks.request.args['filters'] with filtering information from group
           drilldown [
        {name: col1, prevFreq: Y, freq: Q, date: YYYY-MM-DD},
        ...
        {name: col1, prevFreq: D, freq: W, date: YYYY-MM-DD},
    ]
    :param group: JSON string from flask.request.args['group'] containing grouping logic in this structure [
        {name: col1} or {name: date_col1, freq: [D,W,M,Q,Y]}
    ]
    :returns: JSON {
        data: {
            [col]: [count1,count2,...,countN],
            labels: [{group_col1: gc1_v1, group_col2: gc2_v1},...,{group_col1: gc1_vN, group_col2: gc2_vN}],
            success: True
    } or {error: 'Exception message', traceback: 'Exception stacktrace', success: False}
    """
    def filter_data(df, req, groups, query=None):
        filters = get_str_arg(req, 'filters')
        if not filters:
            return df.query(query or 'index == index'), groups, ''
        filters = json.loads(filters)
        col, prev_freq, freq, end = map(filters[-1].get, ['name', 'prevFreq', 'freq', 'date'])
        start = DATE_RANGES[prev_freq](pd.Timestamp(end)).strftime('%Y%m%d')
        range_query = "{col} >= '{start}' and {col} <= '{end}'".format(col=col, start=start, end=end)
        logger.info('filtered coverage data to slice: {}'.format(range_query))
        updated_groups = [dict(name=col, freq=freq) if g['name'] == col else g for g in groups]
        return df.query(query or 'index == index').query(range_query), updated_groups, range_query

    try:
        col = get_str_arg(request, 'col')
        groups = get_str_arg(request, 'group')
        if groups:
            groups = json.loads(groups)
        data = DATA[get_port()]
        data, groups, query = filter_data(data, request, groups, query=get_str_arg(request, 'query'))
        grouper = []
        for g_cfg in groups:
            if 'freq' in g_cfg:
                freq_grp = data.set_index([g_cfg['name']]).index.to_period(g_cfg['freq']).to_timestamp(how='end')
                freq_grp.name = g_cfg['name']
                grouper.append(freq_grp)
            else:
                grouper.append(data[g_cfg['name']])

        data_groups = data.groupby(grouper)
        group_data = data_groups[col].count()
        if len(groups) > 1:
            unstack_order = enumerate(zip(group_data.index.names, group_data.index.levels))
            unstack_order = sorted(
                [(uo[0], uo[1][0], len(uo[1][1])) for uo in unstack_order],
                key=lambda k: k[2]
            )
            for i, n, l in unstack_order[:-1]:
                group_data = group_data.unstack(i)
            group_data = group_data.fillna(0)
            if len(unstack_order[:-1]) > 1:
                group_data.columns = [
                    ', '.join([str(group_data.columns.levels[c2[0]][c2[1]]) for c2 in enumerate(c)])
                    for c in zip(*group_data.columns.labels)
                ]
            else:
                group_data.columns = map(str, group_data.columns.values)

        if len(group_data) > 15000:
            return jsonify(dict(error=(
                'Your grouping created {} groups, chart will not render. '
                'Try making date columns a higher frequency (W, M, Q, Y)').format(len(data_groups))))
        if len(groups) == 1:
            data = {col: [json_int(v) for v in group_data.values]}
        else:
            data = dict([(c, [json_int(v) for v in group_data[c].values]) for c in group_data.columns])
        labels = pd.DataFrame(group_data.index.values, columns=group_data.index.names)
        labels_f_overrides = {
            'D': lambda f, i, c: f.add_date(i, c, fmt='%Y-%m-%d'),
        }
        labels_f = grid_formatter(grid_columns(labels), overrides=labels_f_overrides)
        labels = labels_f.format_dicts(labels.itertuples())
        return jsonify(data=data, labels=labels, success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))
