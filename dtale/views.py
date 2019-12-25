from __future__ import absolute_import, division

import time
import traceback
import webbrowser
from builtins import map, range, str, zip
from logging import getLogger

from flask import json, render_template, request

import numpy as np
import pandas as pd
import requests

from dtale import dtale
from dtale.cli.clickutils import retrieve_meta_info_and_version
from dtale.utils import (build_shutdown_url, classify_type, dict_merge,
                         filter_df_for_grid, find_dtype_formatter,
                         find_selected_column, get_dtypes, get_int_arg,
                         get_str_arg, grid_columns, grid_formatter, json_date,
                         json_float, json_int, json_timestamp, jsonify,
                         make_list, retrieve_grid_params,
                         running_with_flask_debug, running_with_pytest,
                         sort_df_for_grid, swag_from)

logger = getLogger(__name__)

DATA = {}
DTYPES = {}
SETTINGS = {}
METADATA = {}
IDX_COL = str('dtale_index')


def in_ipython_frontend():
    """
    Helper function which is variation of :meth:`pandas:pandas.io.formats.console.in_ipython_frontend` which
    checks to see if we are inside an IPython zmq frontend

    :return: `True` if D-Tale is being invoked within ipython notebook, `False` otherwise
    """
    try:
        from IPython import get_ipython
        ip = get_ipython()
        return 'zmq' in str(type(ip)).lower()
    except BaseException:
        pass
    return False


def kill(base):
    """
    This function fires a request to this instance's 'shutdown' route to kill it

    """
    requests.get(build_shutdown_url(base))


def is_up(base):
    """
    This function checks to see if instance's :mod:`flask:flask.Flask` process is up by hitting 'health' route.

    Using `verify=False` will allow us to validate instances being served up over SSL

    :return: `True` if :mod:`flask:flask.Flask` process is up and running, `False` otherwise
    """
    try:
        return requests.get('{}/health'.format(base), verify=False).ok
    except BaseException:
        return False


class DtaleData(object):
    """
    Wrapper class to abstract the global state of a D-Tale process while allowing
    a user to programatically interact with a running D-Tale instance

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param url: endpoint for instances :class:`flask:flask.Flask` process
    :type url: str

    Attributes:
        _data_id            data identifier
        _url                :class:`flask:flask.Flask` endpoint
        _notebook_handle    reference to the most recent :class:`ipython:IPython.display.DisplayHandle` created

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

    def __init__(self, data_id, url):
        self._data_id = data_id
        self._url = url
        self._notebook_handle = None

    @property
    def data(self):
        """
        Property which is a reference to the globally stored data associated with this instance

        """
        return DATA[self._data_id]

    @data.setter
    def data(self, data):
        """
        Setter which will go through all standard formatting to make sure changes will be handled correctly by D-Tale

        """
        startup(self._url, data=data, data_id=self._data_id)

    def main_url(self):
        """
        Helper function creating main :class:`flask:flask.Flask` route using instance's url & data_id
        :return: str
        """
        return '{}/dtale/main/{}'.format(self._url, self._data_id)

    def kill(self):
        """
        Helper function to pass instance's endpoint to :func:dtale.views.kill

        """
        kill(self._url)

    def open_browser(self):
        """
        This function uses the :mod:`python:webbrowser` library to try and automatically open server's default browser
        to this D-Tale instance
        """
        webbrowser.get().open(self.main_url())

    def is_up(self):
        """
        Helper function to pass instance's endpoint to :func:dtale.views.is_up
        """
        return is_up(self._url)

    def __str__(self):
        """
        Will try to create an :class:`ipython:IPython.display.IFrame` if being invoked from within ipython notebook
        otherwise simply returns the output of running :meth:`pandas:pandas.DataFrame.__str__` on the data associated
        with this instance

        """
        if in_ipython_frontend():
            self.notebook()
            return ''
        return self.data.__str__()

    def __repr__(self):
        """
        Will try to create an :class:`ipython:IPython.display.IFrame` if being invoked from within ipython notebook
        otherwise simply returns the output of running :meth:`pandas:pandas.DataFrame.__repr__` on the data for
        this instance

        """
        if in_ipython_frontend():
            self.notebook()
            if self._notebook_handle is not None:
                return ''
        return self.main_url()

    def _build_iframe(self, route='/dtale/iframe/', params=None, width='100%', height=350):
        """
        Helper function to build an :class:`ipython:IPython.display.IFrame` if that module exists within
        your environment

        :param route: the :class:`flask:flask.Flask` route to hit on D-Tale
        :type route: str, optional
        :param params: properties & values passed as query parameters to the route
        :type params: dict, optional
        :param width: width of the ipython cell
        :type width: str or int, optional
        :param height: height of the ipython cell
        :type height: str or int, optional
        :return: :class:`ipython:IPython.display.IFrame`
        """
        try:
            from IPython.display import IFrame
        except ImportError:
            logger.info('in order to use this function, please install IPython')
            return None
        iframe_url = '{}{}{}'.format(self._url, route, self._data_id)
        if params is not None:
            formatted_params = ['{}={}'.format(k, ','.join(make_list(params[k]))) for k in sorted(params)]
            iframe_url = '{}?{}'.format(iframe_url, '&'.join(formatted_params))
        return IFrame(iframe_url, width=width, height=height)

    def notebook(self, route='/dtale/iframe/', params=None, width='100%', height=350):
        """
        Helper function which checks to see if :mod:`flask:flask.Flask` process is up and running and then tries to
        build an :class:`ipython:IPython.display.IFrame` and run :meth:`ipython:IPython.display.display` on it so
        it will be displayed in the ipython notebook which invoked it.

        A reference to the :class:`ipython:IPython.display.DisplayHandle` is stored in _notebook_handle for
        updating if you are running ipython>=5.0

        :param route: the :class:`flask:flask.Flask` route to hit on D-Tale
        :type route: str, optional
        :param params: properties & values passed as query parameters to the route
        :type params: dict, optional
        :param width: width of the ipython cell
        :type width: str or int, optional
        :param height: height of the ipython cell
        :type height: str or int, optional
        """
        try:
            from IPython.display import display
        except ImportError:
            logger.info('in order to use this function, please install IPython')
            return self.data.__repr__()

        while not self.is_up():
            time.sleep(0.01)

        self._notebook_handle = display(
            self._build_iframe(route=route, params=params, width=width, height=height), display_id=True
        )
        if self._notebook_handle is None:
            self._notebook_handle = True

    def notebook_correlations(self, col1, col2, width='100%', height=350):
        """
        Helper function to build an `ipython:IPython.display.IFrame` pointing at the correlations popup

        :param col1: column on left side of correlation
        :type col1: str
        :param col2: column on right side of correlation
        :type col2: str
        :param width: width of the ipython cell
        :type width: str or int, optional
        :param height: height of the ipython cell
        :type height: str or int, optional
        :return: :class:`ipython:IPython.display.IFrame`
        """
        self.notebook('/dtale/popup/correlations/', params=dict(col1=col1, col2=col2), width=width, height=height)

    def notebook_charts(self, x, y, group=None, aggregation=None, width='100%', height=350):
        """
        Helper function to build an `ipython:IPython.display.IFrame` pointing at the charts popup

        :param x: column to be used as x-axis of chart
        :type x: str
        :param y: column to be used as y-axis of chart
        :type y: str
        :param group: comma-separated string of columns to group chart data by
        :type group: str, optional
        :param aggregation: points to a specific function that can be applied to
                            :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                            median, min, max, std, var, mad, prod, sum
        :type aggregation: str, optional
        :param width: width of the ipython cell
        :type width: str or int, optional
        :param height: height of the ipython cell
        :type height: str or int, optional
        :return: :class:`ipython:IPython.display.IFrame`
        """
        params = dict(x=x, y=y)
        if group:
            params['group'] = ','.join(make_list(group))
        if aggregation:
            params['aggregation'] = aggregation
        self.notebook('/dtale/popup/charts/', params=params, width=width, height=height)

    def adjust_cell_dimensions(self, width='100%', height=350):
        """
        If you are running ipython>=5.0 then this will update the most recent notebook cell you displayed D-Tale in
        for this instance with the height/width properties you have passed in as input

        :param width: width of the ipython cell
        :param height: height of the ipython cell
        """
        if self._notebook_handle is not None and hasattr(self._notebook_handle, 'update'):
            self._notebook_handle.update(self._build_iframe(width=width, height=height))
        else:
            logger.debug('You must ipython>=5.0 installed to use this functionality')


def build_dtypes_state(data):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances columns & data types

    :param data: dataframe to build data type information for
    :type data: :class:`pandas:pandas.DataFrame`
    :return: a list of dictionaries containing column names, indexes and data types
    """
    dtypes = get_dtypes(data)
    mins = data.min().to_dict()
    maxs = data.max().to_dict()

    def _format_dtype(col_index, col):
        dtype = dtypes[col]
        dtype_data = dict(name=col, dtype=dtype, index=col_index)
        if classify_type(dtype) == 'F' and not data[col].isnull().all():  # floats
            dtype_data['min'] = mins[col]
            dtype_data['max'] = maxs[col]
        return dtype_data

    return [_format_dtype(i, c) for i, c in enumerate(data.columns)]


def format_data(data):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances data.  Some updates being made:
     - convert all column names to strings
     - drop any indexes back into the dataframe so what we are left is a natural index [0,1,2,...,n]
     - convert inputs that are indexes into dataframes

    :param data: dataframe to build data type information for
    :type data: :class:`pandas:pandas.DataFrame`
    :return: formatted :class:`pandas:pandas.DataFrame` and a list of strings constituting what columns were originally
             in the index
    """
    if isinstance(data, (pd.DatetimeIndex, pd.MultiIndex)):
        data = data.to_frame(index=False)

    index = [str(i) for i in make_list(data.index.name or data.index.names) if i is not None]
    data = data.reset_index().drop('index', axis=1, errors='ignore')
    data.columns = [str(c) for c in data.columns]
    return data, index


def startup(url, data=None, data_loader=None, name=None, data_id=None):
    """
    Loads and stores data globally
     - If data has indexes then it will lock save those columns as locked on the front-end
     - If data has column named index it will be dropped so that it won't collide with row numbering (dtale_index)
     - Create location in memory for storing settings which can be manipulated from the front-end (sorts, filter, ...)

    :param data: :class:`pandas:pandas.DataFrame` or :class:`pandas:pandas.Series`
    :param data_loader: function which returns :class:`pandas:pandas.DataFrame`
    :param name: string label to apply to your session
    :param data_id: integer id assigned to a piece of data viewable in D-Tale, if this is populated then it will
                    override the data at that id
    """
    global DATA, DTYPES, SETTINGS, METADATA

    if data_loader is not None:
        data = data_loader()

    if data is not None:
        if not isinstance(data, (pd.DataFrame, pd.Series, pd.DatetimeIndex, pd.MultiIndex)):
            raise Exception(
                'data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex'
            )

        logger.debug('pytest: {}, flask-debug: {}'.format(running_with_pytest(), running_with_flask_debug()))
        data, curr_index = format_data(data)
        if data_id is None:
            data_id = str(int(max(DATA.keys())) + 1 if len(DATA) else 1)
        if data_id in SETTINGS:
            curr_settings = SETTINGS[data_id]
            curr_locked = curr_settings.get('locked', [])
            # filter out previous locked columns that don't exist
            curr_locked = [c for c in curr_locked if c in data.columns]
            # add any new columns in index
            curr_locked += [c for c in curr_index if c not in curr_locked]
        else:
            logger.debug('pre-locking index columns ({}) to settings[{}]'.format(curr_index, data_id))
            curr_locked = curr_index
            METADATA[data_id] = dict(start=pd.Timestamp('now'), name=name)

        # in the case that data has been updated we will drop any sorts or filter for ease of use
        SETTINGS[data_id] = dict(locked=curr_locked)
        DATA[data_id] = data
        DTYPES[data_id] = build_dtypes_state(data)
        return DtaleData(data_id, url)
    else:
        raise Exception('data loaded is None!')


def cleanup():
    """
    Helper function for cleanup up state related to a D-Tale process with a specific port

    :param port: integer string for a D-Tale process's port
    :type port: str
    """
    global DATA, DTYPES, SETTINGS, METADATA

    # use pop() because in some pytests port is not available
    DATA = {}
    SETTINGS = {}
    DTYPES = {}
    METADATA = {}


def base_render_template(template, data_id, **kwargs):
    """
    Overriden version of Flask.render_template which will also include vital instance information
     - settings
     - version
     - processes
    """
    curr_settings = SETTINGS.get(data_id, {})
    _, version = retrieve_meta_info_and_version('dtale')
    return render_template(
        template,
        data_id=data_id,
        settings=json.dumps(curr_settings),
        version=str(version),
        processes=len(DATA),
        **kwargs
    )


def _view_main(data_id, iframe=False):
    """
    Helper function rendering main HTML which will also build title and store whether we are viewing from an <iframe>

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param iframe: boolean flag indicating whether this is being viewed from an <iframe> (usually means ipython)
    :type iframe: bool, optional
    :return: HTML
    """
    curr_metadata = METADATA.get(data_id, {})
    title = 'D-Tale'
    if curr_metadata.get('name'):
        title = '{} ({})'.format(title, curr_metadata['name'])
    return base_render_template('dtale/main.html', data_id, title=title, iframe=iframe)


@dtale.route('/main/<data_id>')
@swag_from('swagger/dtale/views/main.yml')
def view_main(data_id):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    return _view_main(data_id)


@dtale.route('/iframe/<data_id>')
@swag_from('swagger/dtale/views/main.yml')
def view_iframe(data_id):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    return _view_main(data_id, iframe=True)


@dtale.route('/popup/<popup_type>/<data_id>')
def view_popup(popup_type, data_id):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template for any popup, additionally forwards any
    request parameters as input to template.

    :param popup_type: type of popup to be opened. Possible values: charts, correlations, describe, histogram, instances
    :type popup_type: str
    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    curr_metadata = METADATA.get(data_id, {})
    title = 'D-Tale'
    if curr_metadata.get('name'):
        title = '{} ({})'.format(title, curr_metadata['name'])
    title = '{} - {}'.format(title, popup_type)
    params = request.args.to_dict()
    if len(params):
        def pretty_print(obj):
            return ', '.join(['{}: {}'.format(k, str(v)) for k, v in obj.items()])
        title = '{} ({})'.format(title, pretty_print(params))
    return base_render_template('dtale/popup.html', data_id, title=title, js_prefix=popup_type)


@dtale.route('/processes')
@swag_from('swagger/dtale/views/processes.yml')
def get_processes():
    """
    :class:`flask:flask.Flask` route which returns list of running D-Tale processes within current python process

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
    def _load_process(data_id):
        data = DATA[data_id]
        dtypes = DTYPES[data_id]
        mdata = METADATA[data_id]
        return dict(
            data_id=data_id,
            rows=len(data),
            columns=len(dtypes),
            names=','.join([c['name'] for c in dtypes]),
            start=json_date(mdata['start']),
            ts=json_timestamp(mdata['start']),
            name=mdata['name']
        )

    try:
        processes = sorted([_load_process(data_id) for data_id in DATA], key=lambda p: p['ts'])
        return jsonify(dict(data=processes, success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/update-settings/<data_id>')
@swag_from('swagger/dtale/views/update-settings.yml')
def update_settings(data_id):
    """
    :class:`flask:flask.Flask` route which updates global SETTINGS for current port

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param settings: JSON string from flask.request.args['settings'] which gets decoded and stored in SETTINGS variable
    :return: JSON
    """
    try:
        global SETTINGS

        curr_settings = SETTINGS.get(data_id, {})
        updated_settings = dict_merge(curr_settings, json.loads(get_str_arg(request, 'settings', '{}')))
        SETTINGS[data_id] = updated_settings
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def _test_filter(data, query):
    """
    Helper function for boolean expression as a query against a :class:`pandas:pandas.DataFrame`

    :param data: dataframe to be queried
    :type data: :class:`pandas:pandas.DataFrame`
    :param query: boolean expression
    :return: str
    """
    if query is not None and len(query):
        data.query(query)


@dtale.route('/test-filter/<data_id>')
@swag_from('swagger/dtale/views/test-filter.yml')
def test_filter(data_id):
    """
    :class:`flask:flask.Flask` route which will test out pandas query before it gets applied to DATA and return
    exception information to the screen if there is any

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :return: JSON {success: True/False}
    """
    try:
        query = get_str_arg(request, 'query')
        _test_filter(DATA[data_id], query)
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/dtypes/<data_id>')
@swag_from('swagger/dtale/views/dtypes.yml')
def dtypes(data_id):
    """
    :class:`flask:flask.Flask` route which returns a list of column names and dtypes to the front-end as JSON

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str

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
        return jsonify(dtypes=DTYPES[data_id], success=True)
    except BaseException as e:
        return jsonify(error=str(e), traceback=str(traceback.format_exc()))


def load_describe(column_series, additional_aggs=None):
    """
    Helper function for grabbing the output from :meth:`pandas:pandas.Series.describe` in a JSON serializable format

    :param column_series: data to describe
    :type column_series: :class:`pandas:pandas.Series`
    :return: JSON serializable dictionary of the output from calling :meth:`pandas:pandas.Series.describe`
    """
    desc = column_series.describe().to_frame().T
    if additional_aggs:
        for agg in additional_aggs:
            if agg == 'mode':
                mode = column_series.mode().values
                desc['mode'] = np.nan if len(mode) > 1 else mode[0]
                continue
            desc[agg] = getattr(column_series, agg)()
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


@dtale.route('/describe/<data_id>/<column>')
@swag_from('swagger/dtale/views/describe.yml')
def describe(data_id, column):
    """
    :class:`flask:flask.Flask` route which returns standard details about column data using
    :meth:`pandas:pandas.DataFrame.describe` to the front-end as JSON

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param column: required dash separated string "START-END" stating a range of row indexes to be returned
                   to the screen
    :return: JSON {
        describe: object representing output from :meth:`pandas:pandas.Series.describe`,
        unique_data: array of unique values when data has <= 100 unique values
        success: True/False
    }

    """
    try:
        data = DATA[data_id]
        additional_aggs = None
        dtype = next((dtype_info['dtype'] for dtype_info in DTYPES[data_id] if dtype_info['name'] == column), None)
        if classify_type(dtype) in ['I', 'F']:
            additional_aggs = ['sum', 'median', 'mode', 'var', 'sem', 'skew', 'kurt']
        desc = load_describe(data[column], additional_aggs=additional_aggs)
        return_data = dict(describe=desc, success=True)
        uniq_vals = data[column].unique()
        if 'unique' not in return_data['describe']:
            return_data['describe']['unique'] = json_int(len(uniq_vals), as_string=True)
        if len(uniq_vals) <= 100:
            uniq_f = find_dtype_formatter(get_dtypes(data)[column])
            return_data['uniques'] = dict(
                data=[uniq_f(u, nan_display='N/A') for u in uniq_vals],
                top=False
            )
        else:  # get top 100 most common values
            uniq_vals = data[column].value_counts().sort_values(ascending=False).head(100).index.values
            uniq_f = find_dtype_formatter(get_dtypes(data)[column])
            return_data['uniques'] = dict(
                data=[uniq_f(u, nan_display='N/A') for u in uniq_vals],
                top=True
            )

        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/data/<data_id>')
@swag_from('swagger/dtale/views/data.yml')
def get_data(data_id):
    """
    :class:`flask:flask.Flask` route which returns current rows from DATA (based on scrollbar specs and saved settings)
    to front-end as JSON

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param ids: required dash separated string "START-END" stating a range of row indexes to be returned to the screen
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param sort: JSON string from flask.request.args['sort'] which is applied to DATA using the sort_values() or
                 sort_index() function.  Here is the JSON structure: [col1,dir1],[col2,dir2],....[coln,dirn]
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
        data = DATA[data_id]

        # this will check for when someone instantiates D-Tale programatically and directly alters the internal
        # state of the dataframe (EX: d.data['new_col'] = 'foo')
        curr_dtypes = [c['name'] for c in DTYPES[data_id]]
        if any(c not in curr_dtypes for c in data.columns):
            data, _ = format_data(data)
            DATA[data_id] = data
            DTYPES[data_id] = build_dtypes_state(data)

        params = retrieve_grid_params(request)
        ids = get_str_arg(request, 'ids')
        if ids:
            ids = json.loads(ids)
        else:
            return jsonify({})

        col_types = DTYPES[data_id]
        f = grid_formatter(col_types)
        curr_settings = SETTINGS.get(data_id, {})
        if curr_settings.get('sort') != params.get('sort'):
            data = sort_df_for_grid(data, params)
            DATA[data_id] = data
        if params.get('sort') is not None:
            curr_settings = dict_merge(curr_settings, dict(sort=params['sort']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'sort'}
        data = filter_df_for_grid(data, params)
        if params.get('query') is not None:
            curr_settings = dict_merge(curr_settings, dict(query=params['query']))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != 'query'}
        SETTINGS[data_id] = curr_settings

        total = len(data)
        results = {}
        for sub_range in ids:
            sub_range = list(map(int, sub_range.split('-')))
            if len(sub_range) == 1:
                sub_df = data.iloc[sub_range[0]:sub_range[0] + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                results[sub_range[0]] = dict_merge({IDX_COL: sub_range[0]}, sub_df[0])
            else:
                [start, end] = sub_range
                sub_df = data.iloc[start:] if end >= len(data) - 1 else data.iloc[start:end + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                for i, d in zip(range(start, end + 1), sub_df):
                    results[i] = dict_merge({IDX_COL: i}, d)
        return_data = dict(results=results, columns=[dict(name=IDX_COL, dtype='int64')] + DTYPES[data_id], total=total)
        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/histogram/<data_id>')
@swag_from('swagger/dtale/views/histogram.yml')
def get_histogram(data_id):
    """
    :class:`flask:flask.Flask` route which returns output from numpy.histogram to front-end as JSON

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param col: string from flask.request.args['col'] containing name of a column in your dataframe
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param bins: the number of bins to display in your histogram, options on the front-end are 5, 10, 20, 50
    :returns: JSON {results: DATA, desc: output from pd.DataFrame[col].describe(), success: True/False}
    """
    col = get_str_arg(request, 'col', 'values')
    query = get_str_arg(request, 'query')
    bins = get_int_arg(request, 'bins', 20)
    try:
        data = DATA[data_id]
        if query:
            data = data.query(query)

        selected_col = find_selected_column(data, col)
        data = data[~pd.isnull(data[selected_col])][[selected_col]]
        hist = np.histogram(data, bins=bins)

        desc = load_describe(data[selected_col])
        return jsonify(data=[json_float(h) for h in hist[0]], labels=['{0:.1f}'.format(l) for l in hist[1]], desc=desc)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/correlations/<data_id>')
@swag_from('swagger/dtale/views/correlations.yml')
def get_correlations(data_id):
    """
    :class:`flask:flask.Flask` route which gathers Pearson correlations against all combinations of columns with
    numeric data using :meth:`pandas:pandas.DataFrame.corr`

    On large datasets with no :attr:`numpy:numpy.nan` data this code will use :meth:`numpy:numpy.corrcoef`
    for speed purposes

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :returns: JSON {
        data: [{column: col1, col1: 1.0, col2: 0.99, colN: 0.45},...,{column: colN, col1: 0.34, col2: 0.88, colN: 1.0}],
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    try:
        query = get_str_arg(request, 'query')
        data = DATA[data_id]
        data = data.query(query) if query is not None else data

        valid_corr_cols = []
        valid_date_cols = []
        for col_info in DTYPES[data_id]:
            name, dtype = map(col_info.get, ['name', 'dtype'])
            dtype = classify_type(dtype)
            if dtype in ['I', 'F']:
                valid_corr_cols.append(name)
            elif dtype == 'D':
                # even if a datetime column exists, we need to make sure that there is enough data for a date
                # to warrant a correlation, https://github.com/man-group/dtale/issues/43
                date_counts = data[name].dropna().value_counts()
                if len(date_counts[date_counts > 1]) > 1:
                    valid_date_cols.append(name)

        if data[valid_corr_cols].isnull().values.any():
            data = data.corr(method='pearson')
        else:
            # using pandas.corr proved to be quite slow on large datasets so I moved to numpy:
            # https://stackoverflow.com/questions/48270953/pandas-corr-and-corrwith-very-slow
            data = np.corrcoef(data[valid_corr_cols].values, rowvar=False)
            data = pd.DataFrame(data, columns=valid_corr_cols, index=valid_corr_cols)

        data.index.name = str('column')
        data = data.reset_index()
        col_types = grid_columns(data)
        f = grid_formatter(col_types, nan_display=None)
        return jsonify(data=f.format_dicts(data.itertuples()), dates=valid_date_cols)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def build_chart(data, x, y, group_col=None, agg=None):
    """
    Helper function to return data for 'chart-data' & 'correlations-ts' endpoints.  Will return a dictionary of
    dictionaries (one for each series) which contain the data for the x & y axes of the chart as well as the minimum &
    maximum of all the series for the y-axis.  If there is only one series (no group_col specified) the only key in the
    dictionary of series data will be 'all' otherwise the keys will be the values of the groups.

    :param data: dataframe to be used for chart
    :type data: :class:`pandas:pandas.DataFrame`
    :param x: column to be used as x-axis of chart
    :type x: str
    :param y: column to be used as y-axis of chart
    :type y: str
    :param group: comma-separated string of columns to group chart data by
    :type group: str, optional
    :param aggregation: points to a specific function that can be applied to
                        :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                        median, min, max, std, var, mad, prod, sum
    :type aggregation: str, optional
    :return: dict
    """
    x_col, y_col = str('x'), str('y')
    if group_col is not None:
        data = data[group_col + [x, y]].sort_values(group_col + [x])

        data.columns = group_col + [x_col, y_col]
        if agg is not None:
            data = data.groupby(group_col + [x_col])
            data = getattr(data, agg)().reset_index()
        max_groups = 15
        if len(data[group_col].drop_duplicates()) > max_groups:
            msg = (
                'Group ({}) contains more than {} unique values, please add additional filter'
                ' or else chart will be unreadable'
            ).format(', '.join(group_col), max_groups)
            raise Exception(msg)
        f = grid_formatter(
            grid_columns(data[[x_col, y_col]]), overrides={'D': lambda f, i, c: f.add_timestamp(i, c)}, nan_display=None
        )
        y_fmt = next((fmt for _, name, fmt in f.fmts if name == y_col), None)
        ret_data = dict(data={}, min=y_fmt(data[y_col].min(), None), max=y_fmt(data[y_col].max(), None))
        dtypes = get_dtypes(data)
        group_fmts = {c: find_dtype_formatter(dtypes[c]) for c in group_col}
        for group_val, grp in data.groupby(group_col):
            group_val = '/'.join([
                group_fmts[gc](gv) for gv, gc in zip(make_list(group_val), group_col)
            ])
            ret_data['data'][group_val] = f.format_lists(grp)
        return ret_data
    data = data[[x, y]].sort_values(x)
    data.columns = [x_col, y_col]
    if agg is not None:
        data = data.groupby(x_col)
        data = getattr(data, agg)().reset_index()

    if any(data[x_col].duplicated()):
        raise Exception('{} contains duplicates, please specify group or additional filtering'.format(x))
    f = grid_formatter(
        grid_columns(data), overrides={'D': lambda f, i, c: f.add_timestamp(i, c)}, nan_display=None
    )
    y_fmt = next((fmt for _, name, fmt in f.fmts if name == y_col), None)
    ret_data = dict(
        data={str('all'): f.format_lists(data)},
        min=y_fmt(data[y_col].min(), None),
        max=y_fmt(data[y_col].max(), None)
    )
    return ret_data


@dtale.route('/chart-data/<data_id>')
@swag_from('swagger/dtale/views/chart-data.yml')
def get_chart_data(data_id):
    """
    :class:`flask:flask.Flask` route which builds data associated with a chart.js chart

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param x: string from flask.request.args['x'] column to be used as x-axis of chart
    :param y: string from flask.request.args['y'] column to be used as y-axis of chart
    :param group: string from flask.request.args['group'] comma-separated string of columns to group chart data by
    :param agg: string from flask.request.args['agg'] points to a specific function that can be applied to
                :func: pandas.core.groupby.DataFrameGroupBy.  Possible values are: count, first, last mean,
                median, min, max, std, var, mad, prod, sum
    :returns: JSON {
        data: {
            series1: { x: [x1, x2, ..., xN], y: [y1, y2, ..., yN] },
            series2: { x: [x1, x2, ..., xN], y: [y1, y2, ..., yN] },
            ...,
            seriesN: { x: [x1, x2, ..., xN], y: [y1, y2, ..., yN] },
        },
        min: minY,
        max: maxY,
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    try:
        query = get_str_arg(request, 'query')
        data = DATA[data_id]
        if query:
            try:
                data = data.query(query)
            except BaseException as e:
                return jsonify(dict(error='Invalid query: {}'.format(str(e))))
            if not len(data):
                return jsonify(dict(error='query "{}" found no data, please alter'.format(query)))
        x = get_str_arg(request, 'x')
        y = get_str_arg(request, 'y')
        group_col = get_str_arg(request, 'group')
        if group_col is not None:
            group_col = group_col.split(',')
        agg = get_str_arg(request, 'agg')
        return jsonify(build_chart(data, x, y, group_col, agg))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/correlations-ts/<data_id>')
@swag_from('swagger/dtale/views/correlations-ts.yml')
def get_correlations_ts(data_id):
    """
    :class:`flask:flask.Flask` route which returns timeseries of Pearson correlations of two columns with numeric data
    using :meth:`pandas:pandas.DataFrame.corr`

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param cols: comma-separated string from flask.request.args['cols'] containing names of two columns in dataframe
    :param dateCol: string from flask.request.args['dateCol'] with name of date-type column in dateframe for timeseries
    :returns: JSON {
        data: {:col1:col2: {data: [{corr: 0.99, date: 'YYYY-MM-DD'},...], max: 0.99, min: 0.99}
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    try:
        query = get_str_arg(request, 'query')
        data = DATA[data_id]
        data = data.query(query) if query is not None else data
        cols = get_str_arg(request, 'cols')
        cols = cols.split(',')
        date_col = get_str_arg(request, 'dateCol')
        data = data.groupby(date_col)[list(set(cols))].corr(method='pearson')
        data.index.names = ['date', 'column']
        data = data.reset_index()
        data = data[data.column == cols[0]][['date', cols[1]]]
        data.columns = ['date', 'corr']
        return jsonify(build_chart(data, 'date', 'corr'))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/scatter/<data_id>')
@swag_from('swagger/dtale/views/scatter.yml')
def get_scatter(data_id):
    """
    :class:`flask:flask.Flask` route which returns data used in correlation of two columns for scatter chart

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
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
        data = DATA[data_id]
        data = data[data[date_col] == date] if date else data
        if query:
            data = data.query(query)

        data = data[list(set(cols))].dropna(how='any')
        data[str('index')] = data.index
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
