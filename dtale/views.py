from __future__ import absolute_import, division

import traceback
from builtins import map, range, str, zip
from logging import getLogger

from flask import json, render_template, request

import numpy as np
import pandas as pd
from flasgger.utils import swag_from
from future.utils import string_types
from pandas.tseries.offsets import Day, MonthBegin, QuarterBegin, YearBegin

from dtale import dtale
from dtale.utils import (dict_merge, filter_df_for_grid, find_selected_column,
                         get_int_arg, get_str_arg, grid_columns,
                         grid_formatter, json_float, json_int, jsonify,
                         make_list, retrieve_grid_params, running_with_flask,
                         running_with_pytest, sort_df_for_grid)

logger = getLogger(__name__)

DATA = None
SETTINGS = {}


def startup(data=None, data_loader=None, port=None):
    """
    Loads and stores data globally
    - If data has indexes then it will lock save those columns as locked on the front-end
    - If data has column named index it will be dropped so that it won't collide with row numbering (dtale_index)
    - Create location in memory for storing settings which can be manipulated from the front-end (sorts, filter, ...)

    :param data: pandas.DataFrame or pandas.Series
    :param data_loader: function which returns pandas.DataFrame
    :param port: integer port for running Flask process
    """
    global DATA, SETTINGS

    if data_loader is not None:
        data = data_loader()
    elif data is None:
        logger.debug('pytest: {}, flask: {}'.format(running_with_pytest(), running_with_flask()))

    if data is not None:
        curr_index = [i for i in make_list(data.index.name or data.index.names) if i is not None]
        logger.debug('pre-locking index columns ({}) to settings[{}]'.format(curr_index, port))
        SETTINGS[str(port)] = dict(locked=curr_index)
        DATA = data.reset_index().drop('index', axis=1, errors='ignore')


@dtale.route('/main')
@swag_from('swagger/dtale/views/main.yml')
def view_main():
    """
    Flask route which serves up base jinja template housing JS files

    :return: HTML
    """
    curr_settings = SETTINGS.get(request.environ.get('SERVER_PORT', 'curr'), {})
    return render_template('dtale/main.html', settings=json.dumps(curr_settings))


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

        server_port = request.environ.get('SERVER_PORT', 'curr')
        curr_settings = SETTINGS.get(server_port, {})
        updated_settings = dict_merge(curr_settings, json.loads(get_str_arg(request, 'settings', '{}')))
        SETTINGS[server_port] = updated_settings
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


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
        if query is not None and len(query):
            DATA.query(query)
        return jsonify(dict(success=True))
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
            {dtale_index: N2, col1: val1_N2, ...,colN: valN_N2}.
        ],
        columns: [{name: col1, dtype: 'int64'},...,{name: colN, dtype: 'datetime'}],
        total: N2,
        success: True/False
    }
    """
    try:
        global SETTINGS, DATA

        params = retrieve_grid_params(request)
        ids = get_str_arg(request, 'ids')
        if ids:
            ids = json.loads(ids)
        else:
            return jsonify({})
        col_types = grid_columns(DATA)

        f = grid_formatter(col_types)
        curr_settings = SETTINGS.get(request.environ.get('SERVER_PORT', 'curr'), {})
        if curr_settings.get('sort') != params.get('sort'):
            DATA = sort_df_for_grid(DATA, params)
        df = DATA
        if params.get('sort') is not None:
            curr_settings = dict_merge(curr_settings, dict(sort=params['sort']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'sort'}
        df = filter_df_for_grid(df, params)
        if params.get('query') is not None:
            curr_settings = dict_merge(curr_settings, dict(query=params['query']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'query'}
        SETTINGS[request.environ.get('SERVER_PORT', 'curr')] = curr_settings

        total = len(df)
        results = {}
        for sub_range in ids:
            sub_range = list(map(int, sub_range.split('-')))
            if len(sub_range) == 1:
                sub_df = df.iloc[sub_range[0]:sub_range[0] + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                results[sub_range[0]] = dict_merge(dict(dtale_index=sub_range[0]), sub_df[0])
            else:
                [start, end] = sub_range
                sub_df = df.iloc[start:] if end >= len(df) - 1 else df.iloc[start:end + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                for i, d in zip(range(start, end + 1), sub_df):
                    results[i] = dict_merge(dict(dtale_index=i), d)
        return_data = dict(results=results, columns=[dict(name='dtale_index', dtype='int64')] + col_types, total=total)
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
        data = DATA
        if query:
            data = data.query(query)

        selected_col = find_selected_column(DATA, col)
        data = data[~pd.isnull(data[selected_col])][[selected_col]]
        hist = np.histogram(data, bins=bins)
        desc = data.describe()[selected_col].to_dict()
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
        data = DATA.query(query) if query is not None else DATA
        data = data.corr(method='pearson')
        data.index.name = 'column'
        data = data.reset_index()
        col_types = grid_columns(data)
        f = grid_formatter(col_types, nan_display=None)
        return jsonify(data=f.format_dicts(data.itertuples()))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def _build_timeseries_chart_data(name, df, cols, min=None, max=None, sub_group=None):
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
        data = DATA.query(query) if query is not None else DATA
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
        data = DATA[DATA[date_col] == date] if date else DATA
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

        data, groups, query = filter_data(DATA, request, groups, query=get_str_arg(request, 'query'))
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
        f = grid_formatter(grid_columns(labels))
        labels = f.format_dicts(labels.itertuples())
        return jsonify(data=data, labels=labels, success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))
