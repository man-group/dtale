from __future__ import absolute_import, division

import base64
import os
import time
import webbrowser
from builtins import map, range, str, zip
from functools import wraps
from logging import getLogger

from flask import current_app, json, make_response, redirect, render_template, request

import numpy as np
import pandas as pd
import requests
import xarray as xr
from scipy import stats
from six import string_types, StringIO

import dtale.global_state as global_state
from dtale import dtale
from dtale.charts.utils import build_base_chart, build_formatters
from dtale.cli.clickutils import retrieve_meta_info_and_version
from dtale.column_builders import ColumnBuilder
from dtale.column_filters import ColumnFilter
from dtale.column_replacements import ColumnReplacement
from dtale.dash_application.charts import (
    build_raw_chart,
    chart_url_params,
    chart_url_querystring,
    export_chart,
    export_chart_data,
    url_encode_func,
)
from dtale.data_reshapers import DataReshaper
from dtale.utils import (
    DuplicateDataError,
    build_code_export,
    build_query,
    build_shutdown_url,
    classify_type,
    dict_merge,
    divide_chunks,
    export_to_csv_buffer,
    find_dtype,
    find_dtype_formatter,
    find_selected_column,
    get_bool_arg,
    get_dtypes,
    get_int_arg,
    get_json_arg,
    get_str_arg,
    grid_columns,
    grid_formatter,
    json_date,
    json_float,
    json_int,
    json_timestamp,
    jsonify,
    jsonify_error,
    make_list,
    retrieve_grid_params,
    run_query,
    running_with_flask_debug,
    running_with_pytest,
    sort_df_for_grid,
)

logger = getLogger(__name__)
IDX_COL = str("dtale_index")


def exception_decorator(func):
    @wraps(func)
    def _handle_exceptions(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except BaseException as e:
            return jsonify_error(e)

    return _handle_exceptions


def head_data_id():
    data_keys = global_state.get_data().keys()
    if not len(data_keys):
        raise Exception("No data associated with this D-Tale session")
    return sorted(data_keys)[0]


def in_ipython_frontend():
    """
    Helper function which is variation of :meth:`pandas:pandas.io.formats.console.in_ipython_frontend` which
    checks to see if we are inside an IPython zmq frontend

    :return: `True` if D-Tale is being invoked within ipython notebook, `False` otherwise
    """
    try:
        from IPython import get_ipython

        ip = get_ipython()
        return "zmq" in str(type(ip)).lower()
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
        return requests.get("{}/health".format(base), verify=False).ok
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
        self._name_or_data_id = global_state.convert_name_to_url_path(
            (global_state.get_metadata(self._data_id) or {}).get("name")
        )
        if self._name_or_data_id is None:
            self._name_or_data_id = self._data_id
        self._main_url = self.build_main_url()
        self._notebook_handle = None

    def build_main_url(self, data_id=None):
        return "{}/dtale/main/{}".format(self._url, data_id or self._name_or_data_id)

    @property
    def data(self):
        """
        Property which is a reference to the globally stored data associated with this instance

        """
        return global_state.get_data(self._data_id)

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
        if in_ipython_frontend():
            print(self._main_url)
            return None
        return self._main_url

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
        webbrowser.get().open(self._main_url)

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
            return ""
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
                return ""
        return self.main_url()

    def _build_iframe(
        self, route="/dtale/iframe/", params=None, width="100%", height=475
    ):
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
            logger.info("in order to use this function, please install IPython")
            return None
        iframe_url = "{}{}{}".format(self._url, route, self._data_id)
        if params is not None:
            if isinstance(params, string_types):  # has this already been encoded?
                iframe_url = "{}?{}".format(iframe_url, params)
            else:
                iframe_url = "{}?{}".format(iframe_url, url_encode_func()(params))
        return IFrame(iframe_url, width=width, height=height)

    def notebook(self, route="/dtale/iframe/", params=None, width="100%", height=475):
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
            logger.info("in order to use this function, please install IPython")
            return self.data.__repr__()

        retries = 0
        while not self.is_up() and retries < 10:
            time.sleep(0.01)
            retries += 1

        self._notebook_handle = display(
            self._build_iframe(route=route, params=params, width=width, height=height),
            display_id=True,
        )
        if self._notebook_handle is None:
            self._notebook_handle = True

    def notebook_correlations(self, col1, col2, width="100%", height=475):
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
        self.notebook(
            "/dtale/popup/correlations/",
            params=dict(col1=col1, col2=col2),
            width=width,
            height=height,
        )

    def notebook_charts(
        self,
        chart_type="line",
        query=None,
        x=None,
        y=None,
        z=None,
        group=None,
        agg=None,
        window=None,
        rolling_comp=None,
        barmode=None,
        barsort=None,
        width="100%",
        height=800,
    ):
        """
        Helper function to build an `ipython:IPython.display.IFrame` pointing at the charts popup

        :param chart_type: type of chart, possible options are line|bar|pie|scatter|3d_scatter|surface|heatmap
        :type chart_type: str
        :param query: pandas dataframe query string
        :type query: str, optional
        :param x: column to use for the X-Axis
        :type x: str
        :param y: columns to use for the Y-Axes
        :type y: list of str
        :param z: column to use for the Z-Axis
        :type z: str, optional
        :param group: column(s) to use for grouping
        :type group: list of str or str, optional
        :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last,
                    mean, median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being
                    applied to.
        :type agg: str, optional
        :param window: number of days to include in rolling aggregations
        :type window: int, optional
        :param rolling_comp: computation to use in rolling aggregations
        :type rolling_comp: str, optional
        :param barmode: mode to use for bar chart display. possible values are stack|group(default)|overlay|relative
        :type barmode: str, optional
        :param barsort: axis name to sort the bars in a bar chart by (default is the 'x', but other options are any of
                        columns names used in the 'y' parameter
        :type barsort: str, optional
        :param width: width of the ipython cell
        :type width: str or int, optional
        :param height: height of the ipython cell
        :type height: str or int, optional
        :return: :class:`ipython:IPython.display.IFrame`
        """
        params = dict(
            chart_type=chart_type,
            query=query,
            x=x,
            y=make_list(y),
            z=z,
            group=make_list(group),
            agg=agg,
            window=window,
            rolling_comp=rolling_comp,
            barmode=barmode,
            barsort=barsort,
        )
        self.notebook(
            route="/charts/",
            params=chart_url_querystring(params),
            width=width,
            height=height,
        )

    def offline_chart(
        self,
        chart_type=None,
        query=None,
        x=None,
        y=None,
        z=None,
        group=None,
        agg=None,
        window=None,
        rolling_comp=None,
        barmode=None,
        barsort=None,
        yaxis=None,
        filepath=None,
        title=None,
        **kwargs
    ):
        """
        Builds the HTML for a plotly chart figure to saved to a file or output to a jupyter notebook

        :param chart_type: type of chart, possible options are line|bar|pie|scatter|3d_scatter|surface|heatmap
        :type chart_type: str
        :param query: pandas dataframe query string
        :type query: str, optional
        :param x: column to use for the X-Axis
        :type x: str
        :param y: columns to use for the Y-Axes
        :type y: list of str
        :param z: column to use for the Z-Axis
        :type z: str, optional
        :param group: column(s) to use for grouping
        :type group: list of str or str, optional
        :param agg: specific aggregation that can be applied to y or z axes.  Possible values are: count, first, last,
                    mean, median, min, max, std, var, mad, prod, sum.  This is included in label of axis it is being
                    applied to.
        :type agg: str, optional
        :param window: number of days to include in rolling aggregations
        :type window: int, optional
        :param rolling_comp: computation to use in rolling aggregations
        :type rolling_comp: str, optional
        :param barmode: mode to use for bar chart display. possible values are stack|group(default)|overlay|relative
        :type barmode: str, optional
        :param barsort: axis name to sort the bars in a bar chart by (default is the 'x', but other options are any of
                        columns names used in the 'y' parameter
        :type barsort: str, optional
        :param yaxis: dictionary specifying the min/max for each y-axis in your chart
        :type yaxis: dict, optional
        :param filepath: location to save HTML output
        :type filepath: str, optional
        :param title: Title of your chart
        :type title: str, optional
        :param kwargs: optional keyword arguments, here in case invalid arguments are passed to this function
        :type kwargs: dict
        :return: possible outcomes are:
                 - if run within a jupyter notebook and no 'filepath' is specified it will print the resulting HTML
                   within a cell in your notebook
                 - if 'filepath' is specified it will save the chart to the path specified
                 - otherwise it will return the HTML output as a string
        """
        params = dict(
            chart_type=chart_type,
            query=query,
            x=x,
            y=make_list(y),
            z=z,
            group=make_list(group),
            agg=agg,
            window=window,
            rolling_comp=rolling_comp,
            barmode=barmode,
            barsort=barsort,
            yaxis=yaxis,
            title=title,
        )
        params = dict_merge(params, kwargs)

        if filepath is None and in_ipython_frontend():
            from plotly.offline import iplot, init_notebook_mode

            init_notebook_mode(connected=True)
            chart = build_raw_chart(self._data_id, export=True, **params)
            chart.pop(
                "id", None
            )  # for some reason iplot does not like when the 'id' property is populated
            iplot(chart)
            return

        html_str = export_chart(self._data_id, params)
        if filepath is None:
            return html_str

        if not filepath.endswith(".html"):
            filepath = "{}.html".format(filepath)

        with open(filepath, "w") as f:
            f.write(html_str)

    def adjust_cell_dimensions(self, width="100%", height=350):
        """
        If you are running ipython>=5.0 then this will update the most recent notebook cell you displayed D-Tale in
        for this instance with the height/width properties you have passed in as input

        :param width: width of the ipython cell
        :param height: height of the ipython cell
        """
        if self._notebook_handle is not None and hasattr(
            self._notebook_handle, "update"
        ):
            self._notebook_handle.update(self._build_iframe(width=width, height=height))
        else:
            logger.debug("You must ipython>=5.0 installed to use this functionality")


def unique_count(s):
    return int(s.dropna().unique().size)


def get_dtype_info(data_id, col):
    dtypes = global_state.get_dtypes(data_id)
    return next((c for c in dtypes if c["name"] == col), None)


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
            visible = prev_dtypes[col].get("visible", True)
        s = data[col]
        dtype_data = dict(
            name=col,
            dtype=dtype,
            index=col_index,
            visible=visible,
            unique_ct=unique_count(s),
            hasMissing=int(s.isnull().sum()),
            hasOutliers=0,
        )
        classification = classify_type(dtype)
        if (
            classification in ["F", "I"] and not s.isnull().all() and col in data_ranges
        ):  # floats/ints
            col_ranges = data_ranges[col]
            if not any((np.isnan(v) or np.isinf(v) for v in col_ranges.values())):
                dtype_data = dict_merge(col_ranges, dtype_data)

            # load outlier information
            o_s, o_e = calc_outlier_range(s)
            if not any((np.isnan(v) or np.isinf(v) for v in [o_s, o_e])):
                dtype_data["hasOutliers"] += int(((s < o_s) | (s > o_e)).sum())
                dtype_data["outlierRange"] = dict(lower=o_s, upper=o_e)

        if classification in ["F", "I"] and not s.isnull().all():
            # build variance flag
            unique_ct = dtype_data["unique_ct"]
            check1 = (unique_ct / len(data[col])) < 0.1
            check2 = False
            if check1 and unique_ct >= 2:
                val_counts = s.value_counts()
                check2 = (val_counts.values[0] / val_counts.values[1]) > 20
            dtype_data["lowVariance"] = bool(check1 and check2)

        if classification == "S" and not dtype_data["hasMissing"]:
            if dtype.startswith("category"):
                dtype_data["hasMissing"] += int(
                    (s.apply(lambda x: x.strip()) == "").sum()
                )
            else:
                dtype_data["hasMissing"] += int((s.str.strip() == "").sum())

        return dtype_data

    return _formatter


def build_dtypes_state(data, prev_state=None):
    """
    Helper function to build globally managed state pertaining to a D-Tale instances columns & data types

    :param data: dataframe to build data type information for
    :type data: :class:`pandas:pandas.DataFrame`
    :return: a list of dictionaries containing column names, indexes and data types
    """
    prev_dtypes = {c["name"]: c for c in prev_state or []}
    try:
        ranges = data.agg(["min", "max"]).to_dict()
    except ValueError:
        # I've seen when transposing data and data types get combined into one column this exception emerges
        # when calling 'agg' on the new data
        ranges = {}
    dtype_f = dtype_formatter(data, get_dtypes(data), ranges, prev_dtypes)
    return [dtype_f(i, c) for i, c in enumerate(data.columns)]


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
    """
    if isinstance(data, (pd.DatetimeIndex, pd.MultiIndex)):
        data = data.to_frame(index=False)

    index = [
        str(i) for i in make_list(data.index.name or data.index.names) if i is not None
    ]
    drop = True
    if not len(index) and not data.index.equals(pd.RangeIndex(0, len(data))):
        drop = False
        index = ["index"]

    if inplace:
        data.reset_index(inplace=True, drop=drop_index)
    else:
        data = data.reset_index(drop=drop_index)

    if drop:
        if inplace:
            data.drop("index", axis=1, errors="ignore", inplace=True)
        else:
            data = data.drop("index", axis=1, errors="ignore")
    data.columns = [str(c) for c in data.columns]
    return data, index


def check_duplicate_data(data):
    """
    This function will do a rough check to see if a user has already loaded this piece of data to D-Tale to avoid
    duplicated state.  The checks that take place are:
     - shape (# of rows & # of columns
     - column names and ordering of columns (eventually might add dtype checking as well...)

    :param data: dataframe to validate
    :type data: :class:`pandas:pandas.DataFrame`
    :raises :class:`dtale.utils.DuplicateDataError`: if duplicate data exists
    """
    cols = [str(col) for col in data.columns]

    for d_id, d_df in global_state.get_data().items():
        d_cols = [str(col) for col in d_df.columns]
        if d_df.shape == data.shape and cols == d_cols:
            raise DuplicateDataError(d_id)


def convert_xarray_to_dataset(dataset, **indexers):
    def _convert_zero_dim_dataset(dataset):
        ds_dict = dataset.to_dict()
        data = {}
        for coord, coord_data in ds_dict["coords"].items():
            data[coord] = coord_data["data"]
        for col, col_data in ds_dict["data_vars"].items():
            data[col] = col_data["data"]
        return pd.DataFrame([data]).set_index(list(ds_dict["coords"].keys()))

    ds_sel = dataset.sel(**indexers)
    try:
        df = ds_sel.to_dataframe()
        df = df.reset_index().drop("index", axis=1, errors="ignore")
        return df.set_index(list(dataset.dims.keys()))
    except ValueError:
        return _convert_zero_dim_dataset(ds_sel)


def handle_koalas(data):
    """
    Helper function to check if koalas is installed and also if incoming data is a koalas dataframe, if so convert it
    to :class:`pandas:pandas.DataFrame`, otherwise simply return the original data structure.

    :param data: data we want to check if its a koalas dataframe and if so convert to :class:`pandas:pandas.DataFrame`
    :return: :class:`pandas:pandas.DataFrame`
    """
    if is_koalas(data):
        return data.to_pandas()
    return data


def is_koalas(data):
    try:
        from databricks.koalas import frame

        return isinstance(data, frame.DataFrame)
    except BaseException:
        return False


def startup(
    url,
    data=None,
    data_loader=None,
    name=None,
    data_id=None,
    context_vars=None,
    ignore_duplicate=False,
    allow_cell_edits=True,
    inplace=False,
    drop_index=False,
):
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
    :param ignore_duplicate: if set to True this will not test whether this data matches any previously loaded to D-Tale
    :param allow_cell_edits: If false, this will not allow users to edit cells directly in their D-Tale grid
    :type allow_cell_edits: bool, optional
    :param inplace: If true, this will call `reset_index(inplace=True)` on the dataframe used as a way to save memory.
                    Otherwise this will create a brand new dataframe, thus doubling memory but leaving the dataframe
                    input unchanged.
    :type inplace: bool, optional
    :param drop_index: If true, this will drop any pre-existing index on the dataframe input.
    :type drop_index: bool, optional
    """

    if data_loader is not None:
        data = data_loader()

    if data is not None:
        data = handle_koalas(data)
        if not isinstance(
            data, (pd.DataFrame, pd.Series, pd.DatetimeIndex, pd.MultiIndex, xr.Dataset)
        ):
            raise Exception(
                (
                    "data loaded must be one of the following types: pandas.DataFrame, pandas.Series, "
                    "pandas.DatetimeIndex, pandas.MultiIndex, xarray.Dataset"
                )
            )

        if isinstance(data, xr.Dataset):
            df = convert_xarray_to_dataset(data)
            instance = startup(
                url,
                df,
                name=name,
                data_id=data_id,
                context_vars=context_vars,
                ignore_duplicate=ignore_duplicate,
                allow_cell_edits=allow_cell_edits,
            )
            global_state.set_dataset(instance._data_id, data)
            global_state.set_dataset_dim(instance._data_id, {})
            return instance

        data, curr_index = format_data(data, inplace=inplace, drop_index=drop_index)
        # check to see if this dataframe has already been loaded to D-Tale
        if data_id is None and not ignore_duplicate:
            check_duplicate_data(data)

        logger.debug(
            "pytest: {}, flask-debug: {}".format(
                running_with_pytest(), running_with_flask_debug()
            )
        )
        if len(data.columns) > len(set(data.columns)):
            distinct_cols = set()
            dupes = set()
            for c in data.columns:
                if c in distinct_cols:
                    dupes.add(c)
                distinct_cols.add(c)
            raise Exception(
                "data contains duplicated column names: {}".format(
                    ", ".join(sorted(dupes))
                )
            )

        if data_id is None:
            data_id = str(
                int(max(global_state.get_data().keys())) + 1
                if len(global_state.get_data())
                else 1
            )
        if data_id in global_state.get_settings():
            curr_settings = global_state.get_settings(data_id)
            curr_locked = curr_settings.get("locked", [])
            # filter out previous locked columns that don't exist
            curr_locked = [c for c in curr_locked if c in data.columns]
            # add any new columns in index
            curr_locked += [c for c in curr_index if c not in curr_locked]
        else:
            logger.debug(
                "pre-locking index columns ({}) to settings[{}]".format(
                    curr_index, data_id
                )
            )
            curr_locked = curr_index
            global_state.set_metadata(
                data_id, dict(start=pd.Timestamp("now"), name=name)
            )

        # in the case that data has been updated we will drop any sorts or filter for ease of use
        global_state.set_settings(
            data_id, dict(locked=curr_locked, allow_cell_edits=allow_cell_edits)
        )
        global_state.set_data(data_id, data)
        global_state.set_dtypes(
            data_id, build_dtypes_state(data, global_state.get_dtypes(data_id) or [])
        )
        global_state.set_context_variables(
            data_id, build_context_variables(data_id, context_vars)
        )
        return DtaleData(data_id, url)
    else:
        raise Exception("data loaded is None!")


def base_render_template(template, data_id, **kwargs):
    """
    Overriden version of Flask.render_template which will also include vital instance information
     - settings
     - version
     - processes
    """
    if not len(os.listdir("{}/static/dist".format(os.path.dirname(__file__)))):
        return redirect(current_app.url_for("missing_js"))
    curr_settings = global_state.get_settings(data_id) or {}
    _, version = retrieve_meta_info_and_version("dtale")
    allow_cell_edits = global_state.ALLOW_CELL_EDITS and curr_settings.get(
        "allow_cell_edits", True
    )
    return render_template(
        template,
        data_id=data_id,
        xarray=data_id in global_state.DATASETS,
        xarray_dim=json.dumps(global_state.get_dataset_dim(data_id)),
        settings=json.dumps(curr_settings),
        version=str(version),
        processes=len(global_state.get_data()),
        allow_cell_edits=allow_cell_edits,
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
    curr_metadata = global_state.get_metadata(data_id) or {}
    title = "D-Tale"
    if curr_metadata.get("name"):
        title = "{} ({})".format(title, curr_metadata["name"])
    return base_render_template("dtale/main.html", data_id, title=title, iframe=iframe)


@dtale.route("/main")
@dtale.route("/main/<data_id>")
def view_main(data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None or data_id not in global_state.get_data().keys():
        return redirect("/dtale/main/{}".format(head_data_id()))
    return _view_main(data_id)


@dtale.route("/iframe")
@dtale.route("/iframe/<data_id>")
def view_iframe(data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up base jinja template housing JS files

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None:
        return redirect("/dtale/iframe/{}".format(head_data_id()))
    return _view_main(data_id, iframe=True)


@dtale.route("/popup/<popup_type>")
@dtale.route("/popup/<popup_type>/<data_id>")
def view_popup(popup_type, data_id=None):
    """
    :class:`flask:flask.Flask` route which serves up a base jinja template for any popup, additionally forwards any
    request parameters as input to template.

    :param popup_type: type of popup to be opened. Possible values: charts, correlations, describe, histogram, instances
    :type popup_type: str
    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: HTML
    """
    if data_id is None:
        return redirect("/dtale/popup/{}/{}".format(popup_type, head_data_id()))
    curr_metadata = global_state.get_metadata(data_id) or {}
    title = "D-Tale"
    if curr_metadata.get("name"):
        title = "{} ({})".format(title, curr_metadata["name"])
    if popup_type == "reshape":
        popup_title = "Summarize Data"
    elif popup_type == "filter":
        popup_title = "Custom Filter"
    else:
        popup_title = " ".join([pt.capitalize() for pt in popup_type.split("-")])
    title = "{} - {}".format(title, popup_title)
    params = request.args.to_dict()
    if len(params):

        def pretty_print(obj):
            return ", ".join(["{}: {}".format(k, str(v)) for k, v in obj.items()])

        title = "{} ({})".format(title, pretty_print(params))
    return base_render_template(
        "dtale/popup.html",
        data_id,
        title=title,
        popup_title=popup_title,
        js_prefix=popup_type,
    )


@dtale.route("/code-popup")
def view_code_popup():
    """
    :class:`flask:flask.Flask` route which serves up a base jinja template for code snippets

    :return: HTML
    """
    return render_template("dtale/code_popup.html")


@dtale.route("/processes")
@exception_decorator
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
        data = global_state.get_data(data_id)
        dtypes = global_state.get_dtypes(data_id)
        mdata = global_state.get_metadata(data_id)
        return dict(
            data_id=data_id,
            rows=len(data),
            columns=len(dtypes),
            names=",".join([c["name"] for c in dtypes]),
            start=json_date(mdata["start"]),
            ts=json_timestamp(mdata["start"]),
            name=mdata["name"],
        )

    processes = sorted(
        [_load_process(data_id) for data_id in global_state.get_data()],
        key=lambda p: p["ts"],
    )
    return jsonify(dict(data=processes, success=True))


@dtale.route("/update-settings/<data_id>")
@exception_decorator
def update_settings(data_id):
    """
    :class:`flask:flask.Flask` route which updates global SETTINGS for current port

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param settings: JSON string from flask.request.args['settings'] which gets decoded and stored in SETTINGS variable
    :return: JSON
    """

    curr_settings = global_state.get_settings(data_id) or {}
    updated_settings = dict_merge(curr_settings, get_json_arg(request, "settings", {}))
    global_state.set_settings(data_id, updated_settings)
    return jsonify(dict(success=True))


@dtale.route("/update-formats/<data_id>")
@exception_decorator
def update_formats(data_id):
    """
    :class:`flask:flask.Flask` route which updates the "formats" property for global SETTINGS associated w/ the
    current port

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param all: boolean flag which, if true, tells us we should apply this formatting to all columns with the same
                data type as our selected column
    :param col: selected column
    :param format: JSON string for the formatting configuration we want applied to either the selected column of all
                   columns with the selected column's data type
    :return: JSON
    """
    update_all_dtype = get_bool_arg(request, "all")
    nan_display = get_str_arg(request, "nanDisplay")
    if nan_display is None:
        nan_display = "nan"
    col = get_str_arg(request, "col")
    col_format = get_json_arg(request, "format")
    curr_settings = global_state.get_settings(data_id) or {}
    updated_formats = {col: col_format}
    if update_all_dtype:
        col_dtype = get_dtype_info(data_id, col)["dtype"]
        updated_formats = {
            c["name"]: col_format
            for c in global_state.get_dtypes(data_id)
            if c["dtype"] == col_dtype
        }
    updated_formats = dict_merge(curr_settings.get("formats") or {}, updated_formats)
    updated_settings = dict_merge(
        curr_settings, dict(formats=updated_formats, nanDisplay=nan_display)
    )
    global_state.set_settings(data_id, updated_settings)
    return jsonify(dict(success=True))


def refresh_col_indexes(data_id):
    """
    Helper function to sync column indexes to current state of dataframe for data_id.
    """
    curr_dtypes = {c["name"]: c for c in global_state.get_dtypes(data_id)}
    curr_data = global_state.get_data(data_id)
    global_state.set_dtypes(
        data_id,
        [
            dict_merge(curr_dtypes[c], dict(index=idx))
            for idx, c in enumerate(curr_data.columns)
        ],
    )


@dtale.route("/update-column-position/<data_id>")
@exception_decorator
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
    action = get_str_arg(request, "action")
    col = get_str_arg(request, "col")

    curr_cols = global_state.get_data(data_id).columns.tolist()
    if action == "front":
        curr_cols = [col] + [c for c in curr_cols if c != col]
    elif action == "back":
        curr_cols = [c for c in curr_cols if c != col] + [col]
    elif action == "left":
        if curr_cols[0] != col:
            col_idx = next((idx for idx, c in enumerate(curr_cols) if c == col), None)
            col_to_shift = curr_cols[col_idx - 1]
            curr_cols[col_idx - 1] = col
            curr_cols[col_idx] = col_to_shift
    elif action == "right":
        if curr_cols[-1] != col:
            col_idx = next((idx for idx, c in enumerate(curr_cols) if c == col), None)
            col_to_shift = curr_cols[col_idx + 1]
            curr_cols[col_idx + 1] = col
            curr_cols[col_idx] = col_to_shift

    global_state.set_data(data_id, global_state.get_data(data_id)[curr_cols])
    refresh_col_indexes(data_id)
    return jsonify(success=True)


@dtale.route("/update-locked/<data_id>")
@exception_decorator
def update_locked(data_id):
    """
    :class:`flask:flask.Flask` route to handle saving state associated with locking and unlocking columns

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param action: string from flask.request.args['action'] of action to perform (lock or unlock)
    :param col: string from flask.request.args['col'] of column name to lock/unlock
    :return: JSON {success: True/False}
    """
    action = get_str_arg(request, "action")
    col = get_str_arg(request, "col")
    curr_settings = global_state.get_settings(data_id)
    curr_data = global_state.get_data(data_id)
    if action == "lock" and col not in curr_settings["locked"]:
        curr_settings["locked"].append(col)
    elif action == "unlock":
        curr_settings["locked"] = [c for c in curr_settings["locked"] if c != col]

    final_cols = curr_settings["locked"] + [
        c for c in curr_data.columns if c not in curr_settings["locked"]
    ]
    global_state.set_data(data_id, curr_data[final_cols])
    global_state.set_settings(data_id, curr_settings)
    refresh_col_indexes(data_id)
    return jsonify(success=True)


@dtale.route("/update-visibility/<data_id>", methods=["POST"])
@exception_decorator
def update_visibility(data_id):
    """
    :class:`flask:flask.Flask` route to handle saving state associated visiblity of columns on the front-end

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param visibility: string from flask.request.args['action'] of dictionary of visibility of all columns in a
                       dataframe
    :type visibility: dict, optional
    :param toggle: string from flask.request.args['col'] of column name whose visibility should be toggled
    :type toggle: str, optional
    :return: JSON {success: True/False}
    """
    curr_dtypes = global_state.get_dtypes(data_id)
    if request.form.get("visibility"):
        visibility = json.loads(request.form.get("visibility", "{}"))
        global_state.set_dtypes(
            data_id,
            [dict_merge(d, dict(visible=visibility[d["name"]])) for d in curr_dtypes],
        )
    elif request.form.get("toggle"):
        toggle_col = request.form.get("toggle")
        toggle_idx = next(
            (idx for idx, d in enumerate(curr_dtypes) if d["name"] == toggle_col), None
        )
        toggle_cfg = curr_dtypes[toggle_idx]
        curr_dtypes[toggle_idx] = dict_merge(
            toggle_cfg, dict(visible=not toggle_cfg["visible"])
        )
        global_state.set_dtypes(data_id, curr_dtypes)
    return jsonify(success=True)


@dtale.route("/build-column/<data_id>")
@exception_decorator
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
    data = global_state.get_data(data_id)
    col_type = get_str_arg(request, "type")
    cfg = json.loads(get_str_arg(request, "cfg"))
    save_as = get_str_arg(request, "saveAs", "new")
    if save_as == "inplace":
        name = cfg["col"]
    else:
        name = get_str_arg(request, "name")
        if not name and col_type != "type_conversion":
            raise Exception("'name' is required for new column!")
        # non-type conversions cannot be done inplace and thus need a name and the name needs to be checked that it
        # won't overwrite something else
        name = str(name)
        data = global_state.get_data(data_id)
        if name in data.columns:
            raise Exception("A column named '{}' already exists!".format(name))

    def _build_column():
        builder = ColumnBuilder(data_id, col_type, name, cfg)
        data.loc[:, name] = builder.build_column()

        dtype = find_dtype(data[name])
        data_ranges = {}
        if classify_type(dtype) == "F" and not data[name].isnull().all():
            try:
                data_ranges[name] = data[[name]].agg(["min", "max"]).to_dict()[name]
            except ValueError:
                pass
        dtype_f = dtype_formatter(data, {name: dtype}, data_ranges)
        global_state.set_data(data_id, data)
        curr_dtypes = global_state.get_dtypes(data_id)
        new_dtype_info = dtype_f(len(curr_dtypes), name)
        if next((cdt for cdt in curr_dtypes if cdt["name"] == name), None):
            curr_dtypes = [
                new_dtype_info if cdt["name"] == name else cdt for cdt in curr_dtypes
            ]
        else:
            curr_dtypes.append(dtype_f(len(curr_dtypes), name))
        global_state.set_dtypes(data_id, curr_dtypes)
        curr_history = global_state.get_history(data_id) or []
        curr_history += make_list(builder.build_code())
        global_state.set_history(data_id, curr_history)

    if cfg.get("applyAllType", False):
        cols = [
            dtype["name"]
            for dtype in global_state.get_dtypes(data_id)
            if dtype["dtype"] == cfg["from"]
        ]
        for col in cols:
            cfg = dict_merge(cfg, dict(col=col))
            name = col
            _build_column()
    else:
        _build_column()
    return jsonify(success=True)


@dtale.route("/bins-tester/<data_id>")
@exception_decorator
def build_column_bins_tester(data_id):
    col_type = get_str_arg(request, "type")
    cfg = json.loads(get_str_arg(request, "cfg"))
    builder = ColumnBuilder(data_id, col_type, cfg["col"], cfg)
    data = global_state.get_data(data_id)
    data, labels = builder.builder.build_test(data)
    return jsonify(dict(data=data, labels=labels))


@dtale.route("/reshape/<data_id>")
@exception_decorator
def reshape_data(data_id):
    output = get_str_arg(request, "output")
    shape_type = get_str_arg(request, "type")
    cfg = json.loads(get_str_arg(request, "cfg"))
    builder = DataReshaper(data_id, shape_type, cfg)
    if output == "new":
        instance = startup("", data=builder.reshape(), ignore_duplicate=True)
    else:
        instance = startup(
            "", data=builder.reshape(), data_id=data_id, ignore_duplicate=True
        )
    curr_settings = global_state.get_settings(instance._data_id)
    global_state.set_settings(
        instance._data_id,
        dict_merge(curr_settings, dict(startup_code=builder.build_code())),
    )
    return jsonify(success=True, data_id=instance._data_id)


@dtale.route("/build-replacement/<data_id>")
@exception_decorator
def build_replacement(data_id):
    """
    :class:`flask:flask.Flask` route to handle the replacement of specific values within a column in a dataframe. Some
    of the operations the are available are:
     - spaces: replace values consisting of only spaces with a specific value
     - value: replace specific values with a specific value or aggregation
     - strings: replace values which contain a specific character or string (case-insensitive or not) with a
                       specific value
     - imputer: replace nan values using sklearn imputers iterative, knn or simple

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param col: string from flask.request.args['col'] of the column to perform replacements upon
    :param type: string from flask.request.args['type'] of the type of replacement to perform
                 (spaces/fillna/strings/imputer)
    :param cfg: dict from flask.request.args['cfg'] of how to calculate the replacements
    :return: JSON {success: True/False}
    """

    def build_data_ranges(data, col, dtype):
        data_ranges = {}
        if classify_type(dtype) == "F" and not data[col].isnull().all():
            try:
                data_ranges[col] = data[[col]].agg(["min", "max"]).to_dict()[col]
            except ValueError:
                pass
        return data_ranges

    data = global_state.get_data(data_id)
    name = get_str_arg(request, "name")
    if name is not None:
        name = str(name)
        if name in data.columns:
            raise Exception("A column named '{}' already exists!".format(name))
    col = get_str_arg(request, "col")
    replacement_type = get_str_arg(request, "type")
    cfg = json.loads(get_str_arg(request, "cfg"))

    builder = ColumnReplacement(data_id, col, replacement_type, cfg)
    output = builder.build_replacements()
    dtype = find_dtype(output)
    curr_dtypes = global_state.get_dtypes(data_id)

    if name is not None:
        data.loc[:, name] = output
        dtype_f = dtype_formatter(
            data, {name: dtype}, build_data_ranges(data, name, dtype)
        )
        curr_dtypes.append(dtype_f(len(curr_dtypes), name))
    else:
        data.loc[:, col] = output
        dtype_f = dtype_formatter(
            data, {col: dtype}, build_data_ranges(data, col, dtype)
        )
        col_index = next(
            (i for i, d in enumerate(curr_dtypes) if d["name"] == col), None
        )
        curr_col_dtype = dtype_f(col_index, col)
        curr_dtypes = [curr_col_dtype if d["name"] == col else d for d in curr_dtypes]

    global_state.set_data(data_id, data)
    global_state.set_dtypes(data_id, curr_dtypes)
    curr_history = global_state.get_history(data_id) or []
    curr_history += [builder.build_code()]
    global_state.set_history(data_id, curr_history)
    return jsonify(success=True)


@dtale.route("/test-filter/<data_id>")
@exception_decorator
def test_filter(data_id):
    """
    :class:`flask:flask.Flask` route which will test out pandas query before it gets applied to DATA and return
    exception information to the screen if there is any

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :return: JSON {success: True/False}
    """
    query = get_str_arg(request, "query")
    run_query(
        global_state.get_data(data_id),
        build_query(data_id, query),
        global_state.get_context_variables(data_id),
    )
    if get_str_arg(request, "save"):
        curr_settings = global_state.get_settings(data_id) or {}
        if query is not None:
            curr_settings = dict_merge(curr_settings, dict(query=query))
        else:
            curr_settings = {k: v for k, v in curr_settings.items() if k != "query"}
        global_state.set_settings(data_id, curr_settings)
    return jsonify(dict(success=True))


@dtale.route("/dtypes/<data_id>")
@exception_decorator
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
    return jsonify(dtypes=global_state.get_dtypes(data_id), success=True)


def load_describe(column_series, additional_aggs=None):
    """
    Helper function for grabbing the output from :meth:`pandas:pandas.Series.describe` in a JSON serializable format

    :param column_series: data to describe
    :type column_series: :class:`pandas:pandas.Series`
    :return: JSON serializable dictionary of the output from calling :meth:`pandas:pandas.Series.describe`
    """
    desc = column_series.describe().to_frame().T
    code = [
        "# main statistics",
        "stats = df['{col}'].describe().to_frame().T".format(col=column_series.name),
    ]
    if additional_aggs:
        for agg in additional_aggs:
            if agg == "mode":
                mode = column_series.mode().values
                desc["mode"] = np.nan if len(mode) > 1 else mode[0]
                code.append(
                    (
                        "# mode\n"
                        "mode = df['{col}'].mode().values\n"
                        "stats['mode'] = np.nan if len(mode) > 1 else mode[0]"
                    ).format(col=column_series.name)
                )
                continue
            desc[agg] = getattr(column_series, agg)()
            code.append(
                "# {agg}\nstats['{agg}'] = df['{col}'].{agg}()".format(
                    col=column_series.name, agg=agg
                )
            )
    desc_f_overrides = {
        "I": lambda f, i, c: f.add_int(i, c, as_string=True),
        "F": lambda f, i, c: f.add_float(i, c, precision=4, as_string=True),
    }
    desc_f = grid_formatter(
        grid_columns(desc), nan_display="nan", overrides=desc_f_overrides
    )
    desc = desc_f.format_dict(next(desc.itertuples(), None))
    if "count" in desc:
        # pandas always returns 'count' as a float and it adds useless decimal points
        desc["count"] = desc["count"].split(".")[0]
    desc["total_count"] = len(column_series)
    missing_ct = column_series.isnull().sum()
    desc["missing_pct"] = json_float((missing_ct / len(column_series) * 100).round(2))
    desc["missing_ct"] = json_int(missing_ct)
    return desc, code


@dtale.route("/describe/<data_id>/<column>")
@exception_decorator
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
    data = global_state.get_data(data_id)[[column]]
    additional_aggs = None
    dtype = get_dtype_info(data_id, column)
    if classify_type(dtype["dtype"]) in ["I", "F"]:
        additional_aggs = ["sum", "median", "mode", "var", "sem", "skew", "kurt"]
    code = build_code_export(data_id)
    desc, desc_code = load_describe(data[column], additional_aggs=additional_aggs)
    code += desc_code
    return_data = dict(describe=desc, success=True)
    if "unique" not in return_data["describe"]:
        return_data["describe"]["unique"] = json_int(dtype["unique_ct"], as_string=True)

    uniq_vals = data[column].value_counts().sort_values(ascending=False)
    uniq_vals.index.name = "value"
    uniq_vals.name = "count"
    uniq_vals = uniq_vals.reset_index()

    code.append(
        (
            "uniq_vals = data['{}'].value_counts().sort_values(ascending=False)\n"
            "uniq_vals.index.name = 'value'\n"
            "uniq_vals.name = 'count'\n"
            "uniq_vals = uniq_vals.reset_index()"
        ).format(column)
    )

    if dtype["dtype"].startswith("mixed"):
        uniq_vals["type"] = uniq_vals["value"].apply(lambda i: type(i).__name__)
        dtype_counts = uniq_vals.groupby("type").sum().reset_index()
        dtype_counts.columns = ["dtype", "count"]
        return_data["dtype_counts"] = dtype_counts.to_dict(orient="records")
        code.append(
            (
                "uniq_vals['type'] = uniq_vals['value'].apply( lambda i: type(i).__name__)\n"
                "dtype_counts = uniq_vals.groupby('type').sum().reset_index()\n"
                "dtype_counts.columns = ['dtype', 'count']"
            )
        )
    else:
        uniq_vals.loc[:, "type"] = find_dtype(uniq_vals["value"])
        code.append(
            "uniq_vals.loc[:, 'type'] = '{}'".format(uniq_vals["type"].values[0])
        )

    return_data["uniques"] = {}
    for uniq_type, uniq_grp in uniq_vals.groupby("type"):
        total = len(uniq_grp)
        top = total > 100
        uniq_grp = uniq_grp[["value", "count"]].head(100)
        uniq_grp["value"] = uniq_grp["value"].astype(uniq_type)
        uniq_f, _ = build_formatters(uniq_grp)
        return_data["uniques"][uniq_type] = dict(
            data=uniq_f.format_dicts(uniq_grp.itertuples()), total=total, top=top,
        )

    return_data["code"] = "\n".join(code)
    return jsonify(return_data)


@dtale.route("/variance/<data_id>/<column>")
@exception_decorator
def variance(data_id, column):
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
    s = global_state.get_data(data_id)[column]
    code = ["s = df['{}']".format(column)]
    unique_ct = unique_count(s)
    code.append("unique_ct = s.unique().size")
    s_size = len(s)
    code.append("s_size = len(s)")
    check1 = bool((unique_ct / s_size) < 0.1)
    code.append("check1 = (unique_ct / s_size) < 0.1")
    return_data = dict(check1=dict(unique=unique_ct, size=s_size, result=check1))
    dtype = get_dtype_info(data_id, column)
    if unique_ct >= 2:
        val_counts = s.value_counts()
        check2 = bool((val_counts.values[0] / val_counts.values[1]) > 20)
        fmt = find_dtype_formatter(dtype["dtype"])
        return_data["check2"] = dict(
            val1=dict(val=fmt(val_counts.index[0]), ct=int(val_counts.values[0])),
            val2=dict(val=fmt(val_counts.index[1]), ct=int(val_counts.values[1])),
            result=check2,
        )
    code += [
        "check2 = False",
        "if unique_ct > 1:",
        "\tval_counts = s.value_counts()",
        "\tcheck2 = (val_counts.values[0] / val_counts.values[1]) > 20",
        "low_variance = check1 and check2",
    ]

    return_data["size"] = len(s)
    return_data["outlierCt"] = dtype["hasOutliers"]
    return_data["missingCt"] = int(s.isnull().sum())

    jb_stat, jb_p = stats.jarque_bera(s)
    return_data["jarqueBera"] = dict(statistic=float(jb_stat), pvalue=float(jb_p))
    sw_stat, sw_p = stats.shapiro(s)
    return_data["shapiroWilk"] = dict(statistic=float(sw_stat), pvalue=float(sw_p))
    code += [
        "\nimport scipy.stats as stats\n",
        "jb_stat, jb_p = stats.jarque_bera(s)",
        "sw_stat, sw_p = stats.shapiro(s)",
    ]
    return_data["code"] = "\n".join(code)
    return jsonify(return_data)


def calc_outlier_range(s):
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr = q3 - q1
    iqr_lower = q1 - 1.5 * iqr
    iqr_upper = q3 + 1.5 * iqr
    return iqr_lower, iqr_upper


@dtale.route("/outliers/<data_id>/<column>")
@exception_decorator
def outliers(data_id, column):
    df = global_state.get_data(data_id)
    s = df[column]
    iqr_lower, iqr_upper = calc_outlier_range(s)
    formatter = find_dtype_formatter(find_dtype(df[column]))
    outliers = s[(s < iqr_lower) | (s > iqr_upper)].unique()
    if not len(outliers):
        return jsonify(outliers=[])
    top = len(outliers) > 100
    outliers = [formatter(v) for v in outliers[:100]]
    queries = []
    if iqr_lower > s.min():
        queries.append(
            "{column} < {lower}".format(column=column, lower=json_float(iqr_lower))
        )
    if iqr_upper < s.max():
        queries.append(
            "{column} > {upper}".format(column=column, upper=json_float(iqr_upper))
        )
    query = "(({}))".format(") or (".join(queries)) if len(queries) > 1 else queries[0]

    code = (
        "s = df['{column}']\n"
        "q1 = s.quantile(0.25)\n"
        "q3 = s.quantile(0.75)\n"
        "iqr = q3 - q1\n"
        "iqr_lower = q1 - 1.5 * iqr\n"
        "iqr_upper = q3 + 1.5 * iqr\n"
        "outliers = dict(s[(s < iqr_lower) | (s > iqr_upper)])"
    ).format(column=column)
    queryApplied = column in (
        (global_state.get_settings(data_id) or {}).get("outlierFilters") or {}
    )
    return jsonify(
        outliers=outliers, query=query, code=code, queryApplied=queryApplied, top=top
    )


@dtale.route("/delete-col/<data_id>/<column>")
@exception_decorator
def delete_col(data_id, column):
    data = global_state.get_data(data_id)
    data = data[[c for c in data.columns if c != column]]
    curr_history = global_state.get_history(data_id) or []
    curr_history += ["df = df[[c for c in df.columns if c != '{}']]".format(column)]
    global_state.set_history(data_id, curr_history)
    dtypes = global_state.get_dtypes(data_id)
    dtypes = [dt for dt in dtypes if dt["name"] != column]
    curr_settings = global_state.get_settings(data_id)
    curr_settings["locked"] = [
        c for c in curr_settings.get("locked", []) if c != column
    ]
    global_state.set_data(data_id, data)
    global_state.set_dtypes(data_id, dtypes)
    global_state.set_settings(data_id, curr_settings)
    return jsonify(success=True)


@dtale.route("/rename-col/<data_id>/<column>")
@exception_decorator
def rename_col(data_id, column):
    rename = get_str_arg(request, "rename")
    data = global_state.get_data(data_id)
    if column != rename and rename in data.columns:
        return jsonify(error='Column name "{}" already exists!')

    data = data.rename(columns={column: rename})
    curr_history = global_state.get_history(data_id) or []
    curr_history += ["df = df.rename(columns={'%s': '%s'})" % (column, rename)]
    global_state.set_history(data_id, curr_history)
    dtypes = global_state.get_dtypes(data_id)
    dtypes = [
        dict_merge(dt, {"name": rename}) if dt["name"] == column else dt
        for dt in dtypes
    ]
    curr_settings = global_state.get_settings(data_id)
    curr_settings["locked"] = [
        rename if c == column else c for c in curr_settings.get("locked", [])
    ]
    global_state.set_data(data_id, data)
    global_state.set_dtypes(data_id, dtypes)
    global_state.set_settings(data_id, curr_settings)
    return jsonify(success=True)


@dtale.route("/edit-cell/<data_id>/<column>")
@exception_decorator
def edit_cell(data_id, column):
    row_index = get_int_arg(request, "rowIndex")
    updated = get_str_arg(request, "updated")
    updated_str = updated
    curr_settings = global_state.get_settings(data_id)
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
        ignore_empty=True,
    )
    dtype = find_dtype(data[column])

    code = []
    if updated in ["nan", "inf"]:
        updated_str = "np.{}".format(updated)
        updated = getattr(np, updated)
        data.loc[row_index, column] = updated
        code.append(
            "df.loc[{row_index}, '{column}'] = {updated}".format(
                row_index=row_index, column=column, updated=updated_str
            )
        )
    else:
        classification = classify_type(dtype)
        if classification == "B":
            updated = updated.lower() == "true"
            updated_str = str(updated)
        elif classification == "I":
            updated = int(updated)
        elif classification == "F":
            updated = float(updated)
        elif classification == "D":
            updated_str = "pd.Timestamp({})".format(updated)
            updated = pd.Timestamp(updated)
        elif classification == "TD":
            updated_str = "pd.Timedelta({})".format(updated)
            updated = pd.Timedelta(updated)
        else:
            if dtype.startswith("category") and updated not in data[column].unique():
                data[column].cat.add_categories(updated, inplace=True)
                code.append(
                    "data['{column}'].cat.add_categories('{updated}', inplace=True)".format(
                        column=column, updated=updated
                    )
                )
            updated_str = "'{}'".format(updated)
        data.at[row_index, column] = updated
        code.append(
            "df.at[{row_index}, '{column}'] = {updated}".format(
                row_index=row_index, column=column, updated=updated_str
            )
        )
    curr_history = global_state.get_history(data_id) or []
    curr_history += code
    global_state.set_history(data_id, curr_history)

    data = global_state.get_data(data_id)
    dtypes = global_state.get_dtypes(data_id)
    ranges = {}
    try:
        ranges[column] = data[[column]].agg(["min", "max"]).to_dict()[column]
    except ValueError:
        pass
    dtype_f = dtype_formatter(data, {column: dtype}, ranges)
    dtypes = [
        dtype_f(dt["index"], column) if dt["name"] == column else dt for dt in dtypes
    ]
    global_state.set_dtypes(data_id, dtypes)
    return jsonify(success=True)


def build_filter_vals(series, data_id, column, fmt):
    dtype_info = get_dtype_info(data_id, column)
    vals = list(series.dropna().unique())
    try:
        vals = sorted(vals)
    except BaseException:
        pass  # if there are mixed values (EX: strings with ints) this fails
    if dtype_info["unique_ct"] > 500:
        # columns with too many unique values will need to use asynchronous loading, so for now we'll give the
        # first 5 values
        vals = vals[:5]
    vals = [fmt(v) for v in vals]
    return vals


@dtale.route("/column-filter-data/<data_id>/<column>")
@exception_decorator
def get_column_filter_data(data_id, column):
    s = global_state.get_data(data_id)[column]
    dtype = find_dtype(s)
    fmt = find_dtype_formatter(dtype)
    classification = classify_type(dtype)
    ret = dict(success=True, hasMissing=bool(s.isnull().any()))
    if classification not in ["S", "B"]:
        data_range = s.agg(["min", "max"]).to_dict()
        data_range = {k: fmt(v) for k, v in data_range.items()}
        ret = dict_merge(ret, data_range)
    if classification in ["S", "I", "B"]:
        ret["uniques"] = build_filter_vals(s, data_id, column, fmt)
    return jsonify(ret)


@dtale.route("/async-column-filter-data/<data_id>/<column>")
@exception_decorator
def get_async_column_filter_data(data_id, column):
    input = get_str_arg(request, "input")
    s = global_state.get_data(data_id)[column]
    dtype = find_dtype(s)
    fmt = find_dtype_formatter(dtype)
    vals = s[s.astype("str").str.startswith(input)]
    vals = [dict(value=fmt(v)) for v in sorted(vals.unique())[:5]]
    return jsonify(vals)


@dtale.route("/save-column-filter/<data_id>/<column>")
@exception_decorator
def save_column_filter(data_id, column):
    curr_filters = ColumnFilter(
        data_id, column, get_str_arg(request, "cfg")
    ).save_filter()
    return jsonify(success=True, currFilters=curr_filters)


@dtale.route("/data/<data_id>")
@exception_decorator
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
    data = global_state.get_data(data_id)

    # this will check for when someone instantiates D-Tale programatically and directly alters the internal
    # state of the dataframe (EX: d.data['new_col'] = 'foo')
    curr_dtypes = [c["name"] for c in global_state.get_dtypes(data_id)]
    if any(c not in curr_dtypes for c in data.columns):
        data, _ = format_data(data)
        global_state.set_data(data_id, data)
        global_state.set_dtypes(
            data_id, build_dtypes_state(data, global_state.get_dtypes(data_id) or [])
        )

    params = retrieve_grid_params(request)
    ids = get_json_arg(request, "ids")
    if ids is None:
        return jsonify({})

    col_types = global_state.get_dtypes(data_id)
    curr_settings = global_state.get_settings(data_id) or {}
    f = grid_formatter(col_types, nan_display=curr_settings.get("nanDisplay", "nan"))
    if curr_settings.get("sort") != params.get("sort"):
        data = sort_df_for_grid(data, params)
        global_state.set_data(data_id, data)
    if params.get("sort") is not None:
        curr_settings = dict_merge(curr_settings, dict(sort=params["sort"]))
    else:
        curr_settings = {k: v for k, v in curr_settings.items() if k != "sort"}
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
        ignore_empty=True,
    )
    global_state.set_settings(data_id, curr_settings)

    total = len(data)
    results = {}
    if total:
        for sub_range in ids:
            sub_range = list(map(int, sub_range.split("-")))
            if len(sub_range) == 1:
                sub_df = data.iloc[sub_range[0] : sub_range[0] + 1]
                sub_df = f.format_dicts(sub_df.itertuples())
                results[sub_range[0]] = dict_merge({IDX_COL: sub_range[0]}, sub_df[0])
            else:
                [start, end] = sub_range
                sub_df = (
                    data.iloc[start:]
                    if end >= len(data) - 1
                    else data.iloc[start : end + 1]
                )
                sub_df = f.format_dicts(sub_df.itertuples())
                for i, d in zip(range(start, end + 1), sub_df):
                    results[i] = dict_merge({IDX_COL: i}, d)
    columns = [
        dict(name=IDX_COL, dtype="int64", visible=True)
    ] + global_state.get_dtypes(data_id)
    return_data = dict(results=results, columns=columns, total=total)
    return jsonify(return_data)


@dtale.route("/data-export/<data_id>")
@exception_decorator
def data_export(data_id):
    curr_settings = global_state.get_settings(data_id) or {}
    curr_dtypes = global_state.get_dtypes(data_id) or []
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
        ignore_empty=True,
    )
    data = data[
        [
            c["name"]
            for c in sorted(curr_dtypes, key=lambda c: c["index"])
            if c["visible"]
        ]
    ]
    tsv = get_str_arg(request, "tsv") == "true"
    file_ext = "tsv" if tsv else "csv"
    csv_buffer = export_to_csv_buffer(data, tsv=tsv)
    filename = build_chart_filename("data", ext=file_ext)
    return send_file(csv_buffer.getvalue(), filename, "text/{}".format(file_ext))


@dtale.route("/column-analysis/<data_id>")
@exception_decorator
def get_column_analysis(data_id):
    """
    :class:`flask:flask.Flask` route which returns output from numpy.histogram/pd.value_counts to front-end as JSON

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param col: string from flask.request.args['col'] containing name of a column in your dataframe
    :param type: string from flask.request.args['type'] to signify either a histogram or value counts
    :param query: string from flask.request.args['query'] which is applied to DATA using the query() function
    :param bins: the number of bins to display in your histogram, options on the front-end are 5, 10, 20, 50
    :param top: the number of top values to display in your value counts, default is 100
    :returns: JSON {results: DATA, desc: output from pd.DataFrame[col].describe(), success: True/False}
    """

    def handle_top(df, top):
        if top is not None:
            top = int(top)
            return df[:top] if top > 0 else df[top:], top
        elif len(df) > 100:
            top = 100
            return df[:top], top
        return df, len(df)

    col = get_str_arg(request, "col", "values")
    bins = get_int_arg(request, "bins", 20)
    ordinal_col = get_str_arg(request, "ordinalCol")
    ordinal_agg = get_str_arg(request, "ordinalAgg", "sum")
    category_col = get_str_arg(request, "categoryCol")
    category_agg = get_str_arg(request, "categoryAgg", "mean")
    data_type = get_str_arg(request, "type")
    curr_settings = global_state.get_settings(data_id) or {}
    query = build_query(data_id, curr_settings.get("query"))
    data = run_query(
        global_state.get_data(data_id),
        query,
        global_state.get_context_variables(data_id),
    )
    selected_col = find_selected_column(data, col)
    cols = [selected_col]
    if ordinal_col is not None:
        cols.append(ordinal_col)
    if category_col is not None:
        cols.append(category_col)
    data = data[~pd.isnull(data[selected_col])][cols]

    code = build_code_export(
        data_id, imports="import numpy as np\nimport pandas as pd\n\n"
    )
    dtype = find_dtype(data[selected_col])
    classifier = classify_type(dtype)
    if data_type is None:
        data_type = "histogram" if classifier in ["F", "I"] else "value_counts"
    if data_type == "value_counts":
        hist = pd.value_counts(data[selected_col]).to_frame(name="data").sort_index()
        code.append(
            "chart = pd.value_counts(df[~pd.isnull(df['{col}'])]['{col}'])".format(
                col=selected_col
            )
        )
        if ordinal_col is not None:
            if ordinal_agg == "pctsum":
                ordinal_data = data.groupby(selected_col)[[ordinal_col]].sum()
                ordinal_data = ordinal_data / ordinal_data.sum()
                code.append(
                    (
                        "ordinal_data = df.groupby('{col}')[['{ordinal}']].sum()\n"
                        "ordinal_data = ordinal_data / ordinal_data.sum()"
                    ).format(col=selected_col, ordinal=ordinal_col)
                )
            else:
                ordinal_data = getattr(
                    data.groupby(selected_col)[[ordinal_col]], ordinal_agg
                )()
                code.append(
                    "ordinal_data = df.groupby('{col}')[['{ordinal}']].{agg}()".format(
                        col=selected_col, ordinal=ordinal_col, agg=ordinal_agg
                    )
                )
            hist["ordinal"] = ordinal_data
            hist = hist.sort_values("ordinal")
            code.append(
                (
                    "chart['ordinal'] = ordinal_data\n"
                    "chart = chart.sort_values('ordinal')"
                )
            )
        hist.index.name = "labels"
        hist = hist.reset_index()
        hist, top = handle_top(hist, get_int_arg(request, "top"))
        col_types = grid_columns(hist)
        f = grid_formatter(col_types, nan_display=None)
        return_data = f.format_lists(hist)
        return_data["top"] = top
    elif data_type == "categories":
        aggs = ["count", "sum" if category_agg == "pctsum" else category_agg]
        hist = data.groupby(category_col)[[selected_col]].agg(aggs)
        hist.columns = hist.columns.droplevel(0)
        hist.columns = ["count", "data"]
        code.append(
            "chart = data.groupby('{cat}')[['{col}']].agg(['{aggs}'])".format(
                cat=category_col, col=selected_col, aggs="', '".join(aggs)
            )
        )
        if category_agg == "pctsum":
            hist["data"] = hist["data"] / hist["data"].sum()
            code.append(
                "chart.loc[:, -1] = chart[chart.columns[-1]] / chart[chart.columns[-1]].sum()"
            )
        hist.index.name = "labels"
        hist = hist.reset_index()
        hist, top = handle_top(hist, get_int_arg(request, "top"))
        f = grid_formatter(grid_columns(hist), nan_display=None)
        return_data = f.format_lists(hist)
        return_data["top"] = top
    elif data_type == "histogram":
        hist_data, hist_labels = np.histogram(data, bins=bins)
        hist_data = [json_float(h) for h in hist_data]
        hist_labels = [
            "{0:.1f}".format(lbl) for lbl in hist_labels[1:]
        ]  # drop the first bin because of just a minimum
        code.append(
            "chart = np.histogram(df[~pd.isnull(df['{col}'])][['{col}']], bins={bins})".format(
                col=selected_col, bins=bins
            )
        )
        desc, desc_code = load_describe(data[selected_col])
        code += desc_code
        return_data = dict(labels=hist_labels, data=hist_data, desc=desc)
    cols = global_state.get_dtypes(data_id)
    return jsonify(
        code="\n".join(code),
        query=query,
        cols=cols,
        dtype=dtype,
        chart_type=data_type,
        **return_data
    )


@dtale.route("/correlations/<data_id>")
@exception_decorator
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
    curr_settings = global_state.get_settings(data_id) or {}
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
    )
    valid_corr_cols = []
    valid_date_cols = []
    for col_info in global_state.get_dtypes(data_id):
        name, dtype = map(col_info.get, ["name", "dtype"])
        dtype = classify_type(dtype)
        if dtype in ["I", "F"]:
            valid_corr_cols.append(name)
        elif dtype == "D":
            # even if a datetime column exists, we need to make sure that there is enough data for a date
            # to warrant a correlation, https://github.com/man-group/dtale/issues/43
            date_counts = data[name].dropna().value_counts()
            if len(date_counts[date_counts > 1]) > 1:
                valid_date_cols.append(dict(name=name, rolling=False))
            elif date_counts.eq(1).all():
                valid_date_cols.append(dict(name=name, rolling=True))

    if data[valid_corr_cols].isnull().values.any():
        data = data.corr(method="pearson")
        code = build_code_export(data_id)
        code.append("corr_data = corr_data.corr(method='pearson')")
    else:
        # using pandas.corr proved to be quite slow on large datasets so I moved to numpy:
        # https://stackoverflow.com/questions/48270953/pandas-corr-and-corrwith-very-slow
        data = np.corrcoef(data[valid_corr_cols].values, rowvar=False)
        data = pd.DataFrame(data, columns=valid_corr_cols, index=valid_corr_cols)
        code = build_code_export(
            data_id, imports="import numpy as np\nimport pandas as pd\n\n"
        )
        code.append(
            (
                "corr_cols = [\n"
                "\t'{corr_cols}'\n"
                "]\n"
                "corr_data = np.corrcoef(df[corr_cols].values, rowvar=False)\n"
                "corr_data = pd.DataFrame(corr_data, columns=[corr_cols], index=[corr_cols])"
            ).format(
                corr_cols="'\n\t'".join(
                    ["', '".join(chunk) for chunk in divide_chunks(valid_corr_cols, 8)]
                )
            )
        )

    code.append(
        "corr_data.index.name = str('column')\ncorr_data = corr_data.reset_index()"
    )
    code = "\n".join(code)
    data.index.name = str("column")
    data = data.reset_index()
    col_types = grid_columns(data)
    f = grid_formatter(col_types, nan_display=None)
    return jsonify(
        data=f.format_dicts(data.itertuples()), dates=valid_date_cols, code=code
    )


@dtale.route("/chart-data/<data_id>")
@exception_decorator
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
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, get_str_arg(request, "query")),
        global_state.get_context_variables(data_id),
    )
    x = get_str_arg(request, "x")
    y = get_json_arg(request, "y")
    group_col = get_json_arg(request, "group")
    agg = get_str_arg(request, "agg")
    allow_duplicates = get_bool_arg(request, "allowDupes")
    window = get_int_arg(request, "rollingWin")
    comp = get_str_arg(request, "rollingComp")
    data, code = build_base_chart(
        data,
        x,
        y,
        group_col=group_col,
        agg=agg,
        allow_duplicates=allow_duplicates,
        rolling_win=window,
        rolling_comp=comp,
    )
    data["success"] = True
    return jsonify(data)


@dtale.route("/correlations-ts/<data_id>")
@exception_decorator
def get_correlations_ts(data_id):
    """
    :class:`flask:flask.Flask` route which returns timeseries of Pearson correlations of two columns with numeric data
    using :meth:`pandas:pandas.DataFrame.corr`

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :param cols: comma-separated string from flask.request.args['cols'] containing names of two columns in dataframe
    :param dateCol: string from flask.request.args['dateCol'] with name of date-type column in dateframe for timeseries
    :returns: JSON {
        data: {:col1:col2: {data: [{corr: 0.99, date: 'YYYY-MM-DD'},...], max: 0.99, min: 0.99}
    } or {error: 'Exception message', traceback: 'Exception stacktrace'}
    """
    curr_settings = global_state.get_settings(data_id) or {}
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
    )
    cols = get_str_arg(request, "cols")
    cols = json.loads(cols)
    [col1, col2] = cols
    date_col = get_str_arg(request, "dateCol")
    rolling_window = get_int_arg(request, "rollingWindow")
    code = build_code_export(data_id)

    if rolling_window:
        data = data[[date_col, col1, col2]].set_index(date_col)
        data = data[[col1, col2]].rolling(rolling_window).corr().reset_index()
        data = data.dropna()
        data = data[data["level_1"] == col1][[date_col, col2]]
        code.append(
            (
                "corr_ts = df[['{date_col}', '{col1}', '{col2}']].set_index('{date_col}')\n"
                "corr_ts = corr_ts[['{col1}', '{col2}']].rolling({rolling_window}).corr().reset_index()\n"
                "corr_ts = corr_ts.dropna()\n"
                "corr_ts = corr_ts[corr_ts['level_1'] == '{col1}'][['{date_col}', '{col2}']]"
            ).format(
                col1=col1, col2=col2, date_col=date_col, rolling_window=rolling_window
            )
        )
    else:
        data = data.groupby(date_col)[cols].corr(method="pearson")
        data.index.names = ["date", "column"]
        data = data.reset_index()
        data = data[data.column == col1][["date", col2]]
        code.append(
            (
                "corr_ts = df.groupby('{date_col}')['{cols}'].corr(method='pearson')\n"
                "corr_ts.index.names = ['date', 'column']\n"
                "corr_ts = corr_ts[corr_ts.column == '{col1}'][['date', '{col2}']]\n"
            ).format(col1=col1, col2=col2, date_col=date_col, cols="', '".join(cols))
        )
    data.columns = ["date", "corr"]
    code.append("corr_ts.columns = ['date', 'corr']")
    return_data, _code = build_base_chart(data.fillna(0), "date", "corr")
    return_data["success"] = True
    return_data["code"] = "\n".join(code)
    return jsonify(return_data)


@dtale.route("/scatter/<data_id>")
@exception_decorator
def get_scatter(data_id):
    """
    :class:`flask:flask.Flask` route which returns data used in correlation of two columns for scatter chart

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
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
    cols = get_json_arg(request, "cols")
    date = get_str_arg(request, "date")
    date_col = get_str_arg(request, "dateCol")
    rolling = get_bool_arg(request, "rolling")

    curr_settings = global_state.get_settings(data_id) or {}
    data = run_query(
        global_state.get_data(data_id),
        build_query(data_id, curr_settings.get("query")),
        global_state.get_context_variables(data_id),
    )
    idx_col = str("index")
    y_cols = [cols[1], idx_col]
    code = build_code_export(data_id)

    if rolling:
        window = get_int_arg(request, "window")
        idx = min(data[data[date_col] == date].index) + 1
        data = data.iloc[max(idx - window, 0) : idx]
        data = data[cols + [date_col]].dropna(how="any")
        y_cols.append(date_col)
        code.append(
            (
                "idx = min(df[df['{date_col}'] == '{date}'].index) + 1\n"
                "scatter_data = scatter_data.iloc[max(idx - {window}, 0):idx]\n"
                "scatter_data = scatter_data['{cols}'].dropna(how='any')"
            ).format(
                date_col=date_col,
                date=date,
                window=window,
                cols="', '".join(sorted(list(set(cols)) + [date_col])),
            )
        )
    else:
        data = data[data[date_col] == date] if date else data
        data = data[cols].dropna(how="any")
        code.append(
            (
                "scatter_data = df[df['{date_col}'] == '{date}']"
                if date
                else "scatter_data = df"
            ).format(date_col=date_col, date=date)
        )
        code.append(
            "scatter_data = scatter_data['{cols}'].dropna(how='any')".format(
                cols="', '".join(cols)
            )
        )

    data[idx_col] = data.index
    [col1, col2] = cols
    s0 = data[col1]
    s1 = data[col2]
    pearson = s0.corr(s1, method="pearson")
    spearman = s0.corr(s1, method="spearman")
    stats = dict(
        pearson="N/A" if pd.isnull(pearson) else pearson,
        spearman="N/A" if pd.isnull(spearman) else spearman,
        correlated=len(data),
        only_in_s0=len(data[data[col1].isnull()]),
        only_in_s1=len(data[data[col2].isnull()]),
    )
    code.append(
        (
            "scatter_data['{idx_col}'] = scatter_data.index\n"
            "s0 = scatter_data['{col1}']\n"
            "s1 = scatter_data['{col2}']\n"
            "pearson = s0.corr(s1, method='pearson')\n"
            "spearman = s0.corr(s1, method='spearman')\n"
            "only_in_s0 = len(scatter_data[scatter_data['{col1}'].isnull()])\n"
            "only_in_s1 = len(scatter_data[scatter_data['{col2}'].isnull()])"
        ).format(col1=col1, col2=col2, idx_col=idx_col)
    )

    if len(data) > 15000:
        return jsonify(
            stats=stats,
            code="\n".join(code),
            error="Dataset exceeds 15,000 records, cannot render scatter. Please apply filter...",
        )
    data, _code = build_base_chart(data, cols[0], y_cols, allow_duplicates=True)
    data["x"] = cols[0]
    data["y"] = cols[1]
    data["stats"] = stats
    data["code"] = "\n".join(code)
    return jsonify(data)


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
    if new_context_vars:
        for name, value in new_context_vars.items():
            if not isinstance(name, string_types):
                raise SyntaxError(
                    "{}, context variables must be a valid string".format(name)
                )
            elif not name.replace("_", "").isalnum():
                raise SyntaxError(
                    "{}, context variables can only contain letters, digits, or underscores".format(
                        name
                    )
                )
            elif name.startswith("_"):
                raise SyntaxError(
                    "{}, context variables can not start with an underscore".format(
                        name
                    )
                )

    return dict_merge(global_state.get_context_variables(data_id), new_context_vars)


@dtale.route("/filter-info/<data_id>")
@exception_decorator
def get_filter_info(data_id):
    """
    :class:`flask:flask.Flask` route which returns a view-only version of the query, column filters & context variables
    to the front end.

    :param data_id: integer string identifier for a D-Tale process's data
    :type data_id: str
    :return: JSON
    """

    def value_as_str(value):
        """Convert values into a string representation that can be shown to the user in the front-end."""
        return str(value)[:1000]

    ctxt_vars = global_state.get_context_variables(data_id) or {}
    ctxt_vars = [dict(name=k, value=value_as_str(v)) for k, v in ctxt_vars.items()]
    curr_settings = global_state.get_settings(data_id) or {}
    curr_settings = {
        k: v
        for k, v in curr_settings.items()
        if k in ["query", "columnFilters", "outlierFilters"]
    }
    return jsonify(contextVars=ctxt_vars, success=True, **curr_settings)


@dtale.route("/xarray-coordinates/<data_id>")
@exception_decorator
def get_xarray_coords(data_id):
    ds = global_state.get_dataset(data_id)
    coord_data = [
        dict(name=coord, count=len(info), dtype=info.dtype.name)
        for coord, info in ds.coords.items()
    ]
    return jsonify(data=coord_data)


@dtale.route("/xarray-dimension-values/<data_id>/<dim>")
@exception_decorator
def get_xarray_dimension_values(data_id, dim):
    ds = global_state.get_dataset(data_id)
    dim = pd.DataFrame({"value": ds.coords[dim].data})
    dim_f, _ = build_formatters(dim)
    return jsonify(data=dim_f.format_dicts(dim.itertuples()))


@dtale.route("/update-xarray-selection/<data_id>")
@exception_decorator
def update_xarray_selection(data_id):
    ds = global_state.get_dataset(data_id)
    selection = get_json_arg(request, "selection") or {}
    df = convert_xarray_to_dataset(ds, **selection)
    startup("", data=df, data_id=data_id, ignore_duplicate=True)
    global_state.set_dataset_dim(data_id, selection)
    return jsonify(success=True)


@dtale.route("/to-xarray/<data_id>")
@exception_decorator
def to_xarray(data_id):
    df = global_state.get_data(data_id)
    index_cols = get_json_arg(request, "index")
    ds = df.set_index(index_cols).to_xarray()
    startup("", data=ds, data_id=data_id, ignore_duplicate=True)
    curr_settings = global_state.get_settings(data_id)
    startup_code = "df = df.set_index(['{index}']).to_xarray()".format(
        index="', '".join(index_cols)
    )
    global_state.set_settings(
        data_id, dict_merge(curr_settings, dict(startup_code=startup_code))
    )
    return jsonify(success=True)


@dtale.route("/code-export/<data_id>")
@exception_decorator
def get_code_export(data_id):
    code = build_code_export(data_id)
    return jsonify(code="\n".join(code), success=True)


def build_chart_filename(chart_type, ext="html"):
    return "{}_export_{}.{}".format(
        chart_type, json_timestamp(pd.Timestamp("now")), ext
    )


def send_file(output, filename, content_type):
    resp = make_response(output)
    resp.headers["Content-Disposition"] = "attachment; filename=%s" % filename
    resp.headers["Content-Type"] = content_type
    return resp


@dtale.route("/chart-export/<data_id>")
@exception_decorator
def chart_export(data_id):
    params = chart_url_params(request.args.to_dict())
    html_str = export_chart(data_id, params)
    filename = build_chart_filename(params["chart_type"])
    return send_file(html_str, filename, "text/html")


@dtale.route("/chart-csv-export/<data_id>")
@exception_decorator
def chart_csv_export(data_id):
    params = chart_url_params(request.args.to_dict())
    csv_buffer = export_chart_data(data_id, params)
    filename = build_chart_filename(params["chart_type"], ext="csv")
    return send_file(csv_buffer.getvalue(), filename, "text/csv")


@dtale.route("/cleanup/<data_id>")
@exception_decorator
def run_cleanup(data_id):
    global_state.cleanup(data_id)
    return jsonify(success=True)


@dtale.route("/upload", methods=["POST"])
@exception_decorator
def upload():
    contents, filename = (request.form.get(p) for p in ["contents", "filename"])
    if contents is None:
        raise Exception("No file data loaded!")
    _, content_string = contents.split(",")
    decoded = base64.b64decode(content_string)
    str_obj = StringIO(decoded.decode("utf-8"))
    df = pd.read_csv(str_obj)
    # TODO: handle un-named index columns...
    instance = startup("", data=df, ignore_duplicate=True)
    curr_settings = global_state.get_settings(instance._data_id)
    global_state.set_settings(
        instance._data_id,
        dict_merge(
            curr_settings, dict(startup_code="df = pd.read_csv('{}')".format(filename))
        ),
    )
    return jsonify(success=True, data_id=instance._data_id)
