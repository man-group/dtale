from __future__ import absolute_import, division

import time
import traceback
import webbrowser
from builtins import map, range, str, zip
from logging import getLogger
from collections import defaultdict

from flask import json, redirect, render_template, request

import numpy as np
import pandas as pd
import requests

from dtale import dtale
from dtale.charts.utils import build_chart
from dtale.cli.clickutils import retrieve_meta_info_and_version
from dtale.utils import (build_shutdown_url, classify_type, dict_merge,
                         filter_df_for_grid, find_dtype, find_dtype_formatter,
                         find_selected_column, get_bool_arg, get_dtypes,
                         get_int_arg, get_json_arg, get_str_arg, grid_columns,
                         grid_formatter, json_date, json_float, json_int,
                         json_timestamp, jsonify, make_list,
                         retrieve_grid_params, run_query,
                         running_with_flask_debug, running_with_pytest,
                         sort_df_for_grid)

logger = getLogger(__name__)

DATA = {}
DTYPES = {}
SETTINGS = {}
METADATA = {}
IDX_COL = str('dtale_index')
CONTEXT_VARIABLES = defaultdict(dict)


def head_data_id():
    if not len(DATA):
        raise Exception('No data associated with this D-Tale session')
    return sorted(DATA)[0]


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
        Helper function to pass instance's endpoint to :meth:`dtale.views.kill`

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
        Helper function to pass instance's endpoint to :meth:`dtale.views.is_up`
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


def dtype_formatter(data, dtypes, data_ranges, prev_dtypes=None):
    """
    Helper function to build formatter for the descriptive information about each column in the dataframe you
    are viewing in D-Tale.  This data is later returned to the browser to help with controlling inputs to functions
    which are heavily tied to specific data types.

    :param data: dataframe
    :type data: :class:`pandas:pandas.DataFrame`
    :param dtypes: column data type
    :type dtypes: dict
    :param data_ranges: dictionary containing minimum and maximum value for column (if applicable)
    :type data_ranges: dict, optional
    :param prev_dtypes: previous column information for syncing updates to pre-existing columns
    :type prev_dtypes: dict, optional
    :return: formatter function which takes column indexes and names
    :rtype: func
    """
    def _formatter(col_index, col):
        visible = True
        dtype = dtypes.get(col)
        if prev_dtypes and col in prev_dtypes:
            visible = prev_dtypes[col].get('visible', True)
        dtype_data = dict(name=col, dtype=dtype, index=col_index, visible=visible)
        if classify_type(dtype) == 'F' and not data[col].isnull().all() and col in data_ranges:  # floats
            col_ranges = data_ranges[col]
            if not any((np.isnan(v) or np.isinf(v) for v in col_ranges.values())):
                dtype_data = dict_merge(col_ranges, dtype_data)
        return dtype_data
    return _formatter


def build_dtypes_state(data, prev_state=None):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances columns & data types

    :param data: dataframe to build data type information for
    :type data: :class:`pandas:pandas.DataFrame`
    :return: a list of dictionaries containing column names, indexes and data types
    """
    prev_dtypes = {c['name']: c for c in prev_state or []}
    ranges = data.agg([min, max]).to_dict()
    dtype_f = dtype_formatter(data, get_dtypes(data), ranges, prev_dtypes)
    return [dtype_f(i, c) for i, c in enumerate(data.columns)]


def format_data(data):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances data.  Some updates being made:
     - convert all column names to strings
     - drop any indexes back into the dataframe so what we are left is a natural index [0,1,2,...,n]
     - convert inputs that are indexes into dataframes
     - replace any periods in column names with underscores

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


def startup(url, data=None, data_loader=None, name=None, data_id=None, context_vars=None):
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
    :param context_vars: a dictionary of the variables that will be available for use in user-defined expressions,
                         such as filters
    :type context_vars: dict, optional
    """
    global DATA, DTYPES, SETTINGS, METADATA, CONTEXT_VARIABLES

    if data_loader is not None:
        data = data_loader()

    if data is not None:
        if not isinstance(data, (pd.DataFrame, pd.Series, pd.DatetimeIndex, pd.MultiIndex)):
            raise Exception(
                'data loaded must be one of the following types: pandas.DataFrame, pandas.Series, pandas.DatetimeIndex'
            )

        logger.debug('pytest: {}, flask-debug: {}'.format(running_with_pytest(), running_with_flask_debug()))
        data, curr_index = format_data(data)
        if len(data.columns) > len(set(data.columns)):
            distinct_cols = set()
            dupes = set()
            for c in data.columns:
                if c in distinct_cols:
                    dupes.add(c)
                distinct_cols.add(c)
            raise Exception('data contains duplicated column names: {}'.format(', '.join(sorted(dupes))))

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
        DTYPES[data_id] = build_dtypes_state(data, DTYPES.get(data_id, []))
        CONTEXT_VARIABLES[data_id] = build_context_variables(data_id, context_vars)
        return DtaleData(data_id, url)
    else:
        raise Exception('data loaded is None!')


def cleanup():
    """
    Helper function for cleanup up state related to a D-Tale process with a specific port

    :param port: integer string for a D-Tale process's port
    :type port: str
    """
    global DATA, DTYPES, SETTINGS, METADATA, CONTEXT_VARIABLES

    # use pop() because in some pytests port is not available
    DATA = {}
    SETTINGS = {}
    DTYPES = {}
    METADATA = {}
    CONTEXT_VARIABLES = defaultdict(dict)


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


@dtale.route('/main')
@dtale.route('/main/<data_id>')
def view_main(data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None:
        return redirect('/dtale/main/{}'.format(head_data_id()))
    return _view_main(data_id)


@dtale.route('/iframe')
@dtale.route('/iframe/<data_id>')
def view_iframe(data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None:
        return redirect('/dtale/iframe/{}'.format(head_data_id()))
    return _view_main(data_id, iframe=True)


@dtale.route('/popup/<popup_type>')
@dtale.route('/popup/<popup_type>/<data_id>')
def view_popup(popup_type, data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template for any popup, additionally forwards any
    request parameters as input to template.

    :param popup_type: type of popup to be opened. Possible values: charts, correlations, describe, histogram, instances
    :type popup_type: str
    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None:
        return redirect('/dtale/popup/{}/{}'.format(popup_type, head_data_id()))
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
        updated_settings = dict_merge(curr_settings, get_json_arg(request, 'settings', {}))
        SETTINGS[data_id] = updated_settings
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def refresh_col_indexes(data_id):
    """
    Helper function to sync column indexes to current state of dataframe for data_id.
    """
    global DTYPES

    curr_dtypes = {c['name']: c for c in DTYPES[data_id]}
    DTYPES[data_id] = [dict_merge(curr_dtypes[c], dict(index=idx)) for idx, c in enumerate(DATA[data_id].columns)]


@dtale.route('/update-column-position/<data_id>')
def update_column_position(data_id):
    """
    :class:`flask:flask.Flask` route to handle moving of columns within a :class:`pandas:pandas.DataFrame`. Columns can
    be moved in one of these 4 directions: front, back, left, right

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param action: string from flask.request.args['action'] of direction to move column
    :param col: string from flask.request.args['col'] of column name to move
    :return: JSON {success: True/False}
    """
    global DATA

    try:
        action = get_str_arg(request, 'action')
        col = get_str_arg(request, 'col')

        curr_cols = DATA[data_id].columns.tolist()
        if action == 'front':
            curr_cols = [col] + [c for c in curr_cols if c != col]
        elif action == 'back':
            curr_cols = [c for c in curr_cols if c != col] + [col]
        elif action == 'left':
            if curr_cols[0] != col:
                col_idx = next((idx for idx, c in enumerate(curr_cols) if c == col), None)
                col_to_shift = curr_cols[col_idx - 1]
                curr_cols[col_idx - 1] = col
                curr_cols[col_idx] = col_to_shift
        elif action == 'right':
            if curr_cols[-1] != col:
                col_idx = next((idx for idx, c in enumerate(curr_cols) if c == col), None)
                col_to_shift = curr_cols[col_idx + 1]
                curr_cols[col_idx + 1] = col
                curr_cols[col_idx] = col_to_shift

        DATA[data_id] = DATA[data_id][curr_cols]
        refresh_col_indexes(data_id)
        return jsonify(success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/update-locked/<data_id>')
def update_locked(data_id):
    """
    :class:`flask:flask.Flask` route to handle saving state associated with locking and unlocking columns

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param action: string from flask.request.args['action'] of action to perform (lock or unlock)
    :param col: string from flask.request.args['col'] of column name to lock/unlock
    :return: JSON {success: True/False}
    """
    global SETTINGS

    try:
        action = get_str_arg(request, 'action')
        col = get_str_arg(request, 'col')
        if action == 'lock' and col not in SETTINGS[data_id]['locked']:
            SETTINGS[data_id]['locked'].append(col)
        elif action == 'unlock':
            SETTINGS[data_id]['locked'] = [c for c in SETTINGS[data_id]['locked'] if c != col]

        final_cols = SETTINGS[data_id]['locked'] + [
            c for c in DATA[data_id].columns if c not in SETTINGS[data_id]['locked']
        ]
        DATA[data_id] = DATA[data_id][final_cols]
        refresh_col_indexes(data_id)
        return jsonify(success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/update-visibility/<data_id>', methods=['POST'])
def update_visibility(data_id):
    """
    :class:`flask:flask.Flask` route to handle saving state associated visiblity of columns on the front-end

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param visibility: string from flask.request.args['action'] of dictionary of visibility of all columns in a
                       dataframe
    :type visibility: dict, optional
    :param toggle: string from flask.request.args['col'] of column name whose visibility should be toggled
    :type toggle: string, optional
    :return: JSON {success: True/False}
    """
    global DTYPES

    try:
        if request.form.get('visibility'):
            visibility = json.loads(request.form.get('visibility', '{}'))
            DTYPES[data_id] = [dict_merge(d, dict(visible=visibility[d['name']])) for d in DTYPES[data_id]]
        elif request.form.get('toggle'):
            toggle_col = request.form.get('toggle')
            toggle_idx = next((idx for idx, d in enumerate(DTYPES[data_id]) if d['name'] == toggle_col), None)
            toggle_cfg = DTYPES[data_id][toggle_idx]
            DTYPES[data_id][toggle_idx] = dict_merge(toggle_cfg, dict(visible=not toggle_cfg['visible']))
        return jsonify(success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/build-column/<data_id>')
def build_column(data_id):
    """
    :class:`flask:flask.Flask` route to handle the building of new columns in a dataframe. Some of the operations the
    are available are:
     - numeric: sum/difference/multiply/divide any combination of two columns or static values
     - datetime: retrieving date properties (hour, minute, month, year...) or conversions of dates (month start, month
                 end, quarter start...)
     - bins: bucketing numeric data into bins using :meth:`pandas:pandas.cut` & :meth:`pandas:pandas.qcut`

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param name: string from flask.request.args['name'] of new column to create
    :param type: string from flask.request.args['type'] of the type of column to build (numeric/datetime/bins)
    :param cfg: dict from flask.request.args['cfg'] of how to calculate the new column
    :return: JSON {success: True/False}
    """
    global DATA, DTYPES

    try:
        name = get_str_arg(request, 'name')
        if not name:
            raise Exception("'name' is required for new column!")
        data = DATA[data_id]
        if name in data.columns:
            raise Exception("A column named '{}' already exists!".format(name))
        col_type = get_str_arg(request, 'type')
        cfg = json.loads(get_str_arg(request, 'cfg'))

        def _build_numeric(cfg):
            left, right, operation = (cfg.get(p) for p in ['left', 'right', 'operation'])
            left = data[left['col']] if 'col' in left else float(left['val'])
            right = data[right['col']] if 'col' in right else float(right['val'])
            if operation == 'sum':
                return left + right
            if operation == 'difference':
                return left - right
            if operation == 'multiply':
                return left * right
            if operation == 'divide':
                return left / right
            return np.nan

        def _build_datetime(cfg):
            col = cfg['col']
            if 'property' in cfg:
                return getattr(data[col].dt, cfg['property'])
            conversion_key = cfg['conversion']
            [freq, how] = conversion_key.split('_')
            freq = dict(month='M', quarter='Q', year='Y')[freq]
            conversion_data = data[[col]].set_index(col).index.to_period(freq).to_timestamp(how=how).normalize()
            return pd.Series(conversion_data, index=data.index, name=name)

        def _build_bins(cfg):
            col, operation, bins, labels = (cfg.get(p) for p in ['col', 'operation', 'bins', 'labels'])
            bins = int(bins)
            if operation == 'cut':
                bin_data = pd.cut(data[col], bins=bins)
            else:
                bin_data = pd.qcut(data[col], q=bins)
            if labels:
                cats = {idx: str(cat) for idx, cat in enumerate(labels.split(','))}
            else:
                cats = {idx: str(cat) for idx, cat in enumerate(bin_data.cat.categories)}
            bin_data = pd.Series(bin_data.cat.codes.map(cats))
            return bin_data

        output = np.nan
        if col_type == 'numeric':
            output = _build_numeric(cfg)
        elif col_type == 'datetime':
            output = _build_datetime(cfg)
        elif col_type == 'bins':
            output = _build_bins(cfg)

        DATA[data_id].loc[:, name] = output
        dtype = find_dtype(DATA[data_id][name])
        data_ranges = {}
        if classify_type(dtype) == 'F' and not DATA[data_id][name].isnull().all():
            data_ranges[name] = data[[name]].agg([min, max]).to_dict()[name]
        dtype_f = dtype_formatter(DATA[data_id], {name: dtype}, data_ranges)
        DTYPES[data_id].append(dtype_f(len(DTYPES[data_id]), name))
        return jsonify(success=True)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/test-filter/<data_id>')
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
        run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        return jsonify(dict(success=True))
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/dtypes/<data_id>')
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
    desc_f = grid_formatter(grid_columns(desc), nan_display='nan', overrides=desc_f_overrides)
    desc = desc_f.format_dict(next(desc.itertuples(), None))
    if 'count' in desc:
        # pandas always returns 'count' as a float and it adds useless decimal points
        desc['count'] = desc['count'].split('.')[0]
    return desc


@dtale.route('/describe/<data_id>/<column>')
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
        data = DATA[data_id][[column]]
        additional_aggs = None
        dtype = next((dtype_info['dtype'] for dtype_info in DTYPES[data_id] if dtype_info['name'] == column), None)
        if classify_type(dtype) in ['I', 'F']:
            additional_aggs = ['sum', 'median', 'mode', 'var', 'sem', 'skew', 'kurt']
        desc = load_describe(data[column], additional_aggs=additional_aggs)
        return_data = dict(describe=desc, success=True)
        uniq_vals = data[column].unique()
        if 'unique' not in return_data['describe']:
            return_data['describe']['unique'] = json_int(len(uniq_vals), as_string=True)
        uniq_f = find_dtype_formatter(get_dtypes(data)[column])
        if len(uniq_vals) <= 100:
            return_data['uniques'] = dict(
                data=[uniq_f(u) for u in uniq_vals],
                top=False
            )
        else:  # get top 100 most common values
            uniq_vals = data[column].value_counts().sort_values(ascending=False).head(100).index.values
            return_data['uniques'] = dict(
                data=[uniq_f(u) for u in uniq_vals],
                top=True
            )

        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/data/<data_id>')
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
        global SETTINGS, DATA, DTYPES, CONTEXT_VARIABLES
        data = DATA[data_id]

        # this will check for when someone instantiates D-Tale programatically and directly alters the internal
        # state of the dataframe (EX: d.data['new_col'] = 'foo')
        curr_dtypes = [c['name'] for c in DTYPES[data_id]]
        if any(c not in curr_dtypes for c in data.columns):
            data, _ = format_data(data)
            DATA[data_id] = data
            DTYPES[data_id] = build_dtypes_state(data, DTYPES.get(data_id, []))

        params = retrieve_grid_params(request)
        ids = get_json_arg(request, 'ids')
        if ids is None:
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
        data = filter_df_for_grid(data, params, CONTEXT_VARIABLES[data_id])
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
        columns = [dict(name=IDX_COL, dtype='int64', visible=True)] + DTYPES[data_id]
        return_data = dict(results=results, columns=columns, total=total)
        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/histogram/<data_id>')
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
    bins = get_int_arg(request, 'bins', 20)
    try:
        data = run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        selected_col = find_selected_column(data, col)
        data = data[~pd.isnull(data[selected_col])][[selected_col]]
        hist = np.histogram(data, bins=bins)

        desc = load_describe(data[selected_col])
        return jsonify(data=[json_float(h) for h in hist[0]], labels=['{0:.1f}'.format(l) for l in hist[1]], desc=desc)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/correlations/<data_id>')
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
        data = run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        valid_corr_cols = []
        valid_date_cols = []
        rolling = False
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
                elif date_counts.eq(1).all():
                    valid_date_cols.append(name)
                    rolling = True

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
        return jsonify(data=f.format_dicts(data.itertuples()), dates=valid_date_cols, rolling=rolling)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/chart-data/<data_id>')
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
        data = run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        x = get_str_arg(request, 'x')
        y = get_json_arg(request, 'y')
        group_col = get_json_arg(request, 'group')
        agg = get_str_arg(request, 'agg')
        allow_duplicates = get_bool_arg(request, 'allowDupes')
        window = get_int_arg(request, 'rollingWin')
        comp = get_str_arg(request, 'rollingComp')
        data = build_chart(data, x, y, group_col, agg, allow_duplicates, rolling_win=window, rolling_comp=comp)
        data['success'] = True
        return jsonify(data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/correlations-ts/<data_id>')
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
        data = run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        cols = get_str_arg(request, 'cols')
        cols = json.loads(cols)
        date_col = get_str_arg(request, 'dateCol')
        rolling_window = get_int_arg(request, 'rollingWindow')
        if rolling_window:
            [col1, col2] = list(set(cols))
            data = data[[date_col, col1, col2]].set_index(date_col)
            data = data[[col1, col2]].rolling(rolling_window).corr().reset_index()
            data = data.dropna()
            data = data[data['level_1'] == col1][[date_col, col2]]
        else:
            data = data.groupby(date_col)[list(set(cols))].corr(method='pearson')
            data.index.names = ['date', 'column']
            data = data.reset_index()
            data = data[data.column == cols[0]][['date', cols[1]]]
        data.columns = ['date', 'corr']
        return_data = build_chart(data.fillna(0), 'date', 'corr')
        return_data['success'] = True
        return jsonify(return_data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


@dtale.route('/scatter/<data_id>')
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
    cols = get_json_arg(request, 'cols')
    date = get_str_arg(request, 'date')
    date_col = get_str_arg(request, 'dateCol')
    rolling = get_bool_arg(request, 'rolling')
    try:
        data = run_query(DATA[data_id], get_str_arg(request, 'query'), CONTEXT_VARIABLES[data_id])
        idx_col = str('index')
        y_cols = [cols[1], idx_col]
        if rolling:
            window = get_int_arg(request, 'window')
            idx = min(data[data[date_col] == date].index) + 1
            data = data.iloc[max(idx - window, 0):idx]
            data = data[list(set(cols)) + [date_col]].dropna(how='any')
            y_cols.append(date_col)
        else:
            data = data[data[date_col] == date] if date else data
            data = data[list(set(cols))].dropna(how='any')

        data[idx_col] = data.index
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
        data = build_chart(data, cols[0], y_cols, allow_duplicates=True)
        data['x'] = cols[0]
        data['y'] = cols[1]
        data['stats'] = stats
        return jsonify(data)
    except BaseException as e:
        return jsonify(dict(error=str(e), traceback=str(traceback.format_exc())))


def build_context_variables(data_id, new_context_vars=None):
    """
    Build and return the dictionary of context variables associated with a process.
    If the names of any new variables are not formatted properly, an exception will be raised.
    New variables will overwrite the values of existing variables if they share the same name.

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param new_context_vars: dictionary of name, value pairs for new context variables
    :type new_context_vars: dict, optional
    :returns: dict of the context variables for this process
    :rtype: dict
    """
    global CONTEXT_VARIABLES

    if new_context_vars:
        for name, value in new_context_vars.items():
            if not isinstance(name, str):
                raise SyntaxError('{}, context variables must be a valid string'.format(name))
            elif not name.replace('_', '').isalnum():
                raise SyntaxError('{}, context variables can only contain letters, digits, or underscores'.format(name))
            elif name.startswith('_'):
                raise SyntaxError('{}, context variables can not start with an underscore'.format(name))

    return dict_merge(CONTEXT_VARIABLES[data_id], new_context_vars)


@dtale.route('/context-variables/<data_id>')
def get_context_variables(data_id):
    """
    :class:`flask:flask.Flask` route which returns a view-only version of the context variables to the front end.

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: JSON
    """
    global CONTEXT_VARIABLES

    def value_as_str(value):
        """Convert values into a string representation that can be shown to the user in the front-end."""
        return str(value)[:1000]

    try:
        return jsonify(context_variables={k: value_as_str(v) for k, v in CONTEXT_VARIABLES[data_id].items()},
                       success=True)
    except BaseException as e:
        return jsonify(error=str(e), traceback=str(traceback.format_exc()))
