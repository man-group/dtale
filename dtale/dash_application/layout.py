import dash_core_components as dcc
import dash_daq as daq
import dash_html_components as html

from dtale.charts.utils import YAXIS_CHARTS, ZAXIS_CHARTS
from dtale.utils import classify_type, flatten_lists, get_dtypes, make_list


def base_layout(github_fork, **kwargs):
    """
    Base layout to be returned by :meth:`dtale.dash_application.views.DtaleDash.interpolate_index`

    :param github_fork: `True` if "Fork me on Github" banner should be displayed, `False` otherwise
    :type github_fork: bool
    :param kwargs: Optional keyword arguments to be passed to 'dash.Dash.interplolate_index'
    :type kwargs: dict
    :return: HTML
    :rtype: str
    """
    back_to_data_padding, github_fork_html = ('', '')
    if github_fork:
        back_to_data_padding = 'padding-right: 125px'
        github_fork_html = '''
            <span id="forkongithub">
                <a href="https://github.com/man-group/dtale">Fork me on GitHub</a>
            </span>
        '''
    return '''
        <!DOCTYPE html>
        <html>
            <head>
                {metas}
                <title>D-Tale Charts</title>
                <link rel="shortcut icon" href="../../images/favicon.png">
                {css}
            </head>
            <body>
                {github_fork_html}
                <div class="container-fluid charts">
                    <div class="row" style="margin: 0">
                        <div class="col-auto">
                            <header>
                                <span class="title-font">D-TALE</span>
                                <span style="font-size: 16px" class="pl-4">Charts</span>
                            </header>
                        </div>
                        <div class="col"></div>
                        <div class="col-auto mt-4" style="{back_to_data_padding}">
                            <a href="#" onclick="javascript:goToLegacy()">
                                <i class="ico-show-chart mr-4"></i>
                                <span>Legacy Charts</span>
                            </a>
                        </div>
                        <div class="mt-4">|</div>
                        <div class="col-auto mt-4" style="{back_to_data_padding}">
                            <a href="#" onclick="javascript:backToData()">
                                <i class="fas fa-th mr-4"></i>
                                <span>Back To Data</span>
                            </a>
                        </div>
                    </div>
                    {app_entry}
                </div>
                <footer>
                    {config}
                    {scripts}
                    <script type="text/javascript">
                        const pathSegs = window.location.pathname.split('/');
                        const dataId = pathSegs[pathSegs.length - 1];
                        const backToData = () => window.open('/dtale/main/' + dataId);
                        const goToLegacy = () => location.replace('/dtale/popup/charts/' + dataId);
                    </script>
                    {renderer}
                    {css}
                </footer>
            </body>
        </html>
    '''.format(
        metas=kwargs['metas'],
        css=kwargs['css'],
        app_entry=kwargs['app_entry'],
        config=kwargs['config'],
        scripts=kwargs['scripts'],
        renderer=kwargs['renderer'],
        back_to_data_padding=back_to_data_padding,
        github_fork_html=github_fork_html
    )


def build_input(label, input, className='col-auto', **kwargs):
    """
    Helper function to build a standard label/input component in dash.

    :param label: name of the input you are displaying
    :type label: str
    :param input: dash component for storing state
    :param className: style class to be applied to encapsulating div
    :type className: str
    :param kwargs: Optional keyword arguments to be applied to encapsulating div (style, title, id...)
    :type kwargs: dict
    :return: dash components for label/input
    :rtype: :dash:`dash_html_components.Div <dash-html-components/div>`
    """
    return html.Div(
        [
            html.Div(
                [html.Span(label, className='input-group-addon'), input],
                className='input-group mr-3',
            )
        ],
        className=className, **kwargs
    )


def build_tab(label, value, **kwargs):
    """
    Builds a :dash:`dash_core_components.Tab <dash-core-components/tab>` with standard styling settings.
    """
    return dcc.Tab(
        label=label,
        value=value,
        style={'borderBottom': '1px solid #d6d6d6', 'padding': '6px', 'fontWeight': 'bold'},
        selected_style={
            'borderTop': '1px solid #d6d6d6',
            'borderBottom': '1px solid #d6d6d6',
            'backgroundColor': '#2a91d1',
            'color': 'white',
            'padding': '6px'
        }, **kwargs)


def build_option(value, label=None):
    """
    Returns value/label inputs in a dictionary for use in
    :dash:`dash_core_components.Dropdown <dash-core-components/Dropdown>`
    """
    return {'label': label or value, 'value': value}


CHARTS = [
    dict(value='line'), dict(value='bar'), dict(value='scatter'), dict(value='pie'), dict(value='wordcloud'),
    dict(value='heatmap'), dict(value='3d_scatter', label='3D Scatter'), dict(value='surface')
]
CHART_INPUT_SETTINGS = {
    'line': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=False),
                 group=dict(display=True, type='single')),
    'bar': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=False),
                group=dict(display=True, type='single')),
    'scatter': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=False),
                    group=dict(display=True, type='single')),
    'pie': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=False),
                group=dict(display=True, type='single')),
    'wordcloud': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=False),
                      group=dict(display=True, type='single')),
    'heatmap': dict(x=dict(type='single'), y=dict(type='single'), z=dict(display=True, type='single'),
                    group=dict(display=False)),
    '3d_scatter': dict(x=dict(type='single'), y=dict(type='single'), z=dict(display=True, type='single'),
                       group=dict(display=True)),
    'surface': dict(x=dict(type='single'), y=dict(type='single'), z=dict(display=True, type='single'),
                    group=dict(display=False)),
}
AGGS = dict(
    count='Count', nunique='Unique Count', sum='Sum', mean='Mean', rolling='Rolling', corr='Correlation', first='First',
    last='Last', median='Median', min='Minimum', max='Maximum', std='Standard Deviation', var='Variance',
    mad='Mean Absolute Deviation', prod='Product of All Items'
)
FREQS = ['H', 'H2', 'WD', 'D', 'W', 'M', 'Q', 'Y']
FREQ_LABELS = dict(H='Hourly', H2='Hour', WD='Weekday', W='Weekly', M='Monthly', Q='Quarterly', Y='Yearly')


def show_input_handler(chart_type):
    settings = CHART_INPUT_SETTINGS.get(chart_type) or {}

    def _show_input(input_id, input_type='single'):
        cfg = settings.get(input_id, {})
        return cfg.get('display', True) and cfg.get('type', 'single') == input_type
    return _show_input


def update_label_for_freq(val):
    """
    Formats sub-values contained within 'val' to display date frequencies if included.
        - (val=['a', 'b', 'c']) => 'a, b, c'
        - (val=['a|H', 'b', 'c']) => 'a (Hour), b, c'
    """

    def _freq_handler(sub_val):
        for freq in FREQS:
            if sub_val.endswith('|{}'.format(freq)):
                col, freq = sub_val.split('|')
                if freq in FREQ_LABELS:
                    return '{} ({})'.format(col, FREQ_LABELS[freq])
                return col
        return sub_val
    return ', '.join([_freq_handler(sub_val) for sub_val in make_list(val)])


def build_error(error, tb):
    """
    Returns error/traceback information in standard component with styling

    :param error: execption message
    :type error: str
    :param tb: traceback
    :type tb: str
    :return: error component
    :rtype: :dash:`dash_html_components.Div <dash-html-components/div>`
    """
    return html.Div([
        html.I(className='ico-error'), html.Span(str(error)), html.Div(html.Pre(tb), className='traceback')
    ], className='dtale-alert alert alert-danger')


def build_cols(cols, dtypes):
    """
    Helper function to add additional column entries for columns of type datetime so that users can make use of
    different frequencies of dates.  For example, hour, weekday, month, quarter, year

    :param cols: columns in dataframe
    :type cols: list of strings
    :param dtypes: datatypes of columns in dataframe
    :type dtypes: dict
    :return: generator or columns + any additional (datetime column + frequency) options
    """
    for c in cols:
        if classify_type(dtypes[c]) == 'D':
            for freq in FREQS:
                if freq in FREQ_LABELS:
                    yield '{}|{}'.format(c, freq), '{} ({})'.format(c, FREQ_LABELS[freq])
                else:
                    yield c, c
        else:
            yield c, c


def build_selections(*args):
    """
    simple helper function to build a single level list of values based on variable number of inputs which could be
    equal to None.
    """
    return flatten_lists([[] if a is None else make_list(a) for a in args])


def build_input_options(df, **inputs):
    """
    Builds dropdown options for (X, Y, Z, Group, Barsort & Y-Axis Ranges) with filtering based on currently selected
    values for the following inputs: x, y, z, group.
    """
    [chart_type, x, y, z, group] = [inputs.get(p) for p in ['chart_type', 'x', 'y', 'z', 'group']]
    col_opts = list(build_cols(df.columns, get_dtypes(df)))
    group_val, z_val = (None, z) if chart_type in ZAXIS_CHARTS else (group, None)
    x_options = [build_option(c, l) for c, l in col_opts if c not in build_selections(y, z_val, group_val)]
    y_filter = build_selections(x, group_val, z_val)
    y_multi_options = [build_option(c, l) for c, l in col_opts if c not in y_filter]
    y_single_options = [build_option(c, l) for c, l in col_opts if c not in y_filter]
    z_options = [build_option(c) for c in df.columns if c not in build_selections(x, y, group_val)]
    group_options = [build_option(c, l) for c, l in col_opts if c not in build_selections(x, y, z_val)]
    barsort_options = [build_option(o) for o in build_selections(x, y)]
    yaxis_options = [build_option(y2) for y2 in y or []]
    return x_options, y_multi_options, y_single_options, z_options, group_options, barsort_options, yaxis_options


def bar_input_style(**inputs):
    """
    Sets display CSS property for bar chart inputs
    """
    return dict(display='block' if inputs.get('chart_type') == 'bar' else 'none')


def show_chart_per_group(**inputs):
    """
    Boolean function to determine whether "Chart Per Group" toggle should be displayed or not
    """
    [chart_type, group] = [inputs.get(p) for p in ['chart_type', 'group']]
    return show_input_handler(chart_type)('group') and len(group or []) and chart_type not in ['pie', 'wordcloud']


def show_yaxis_ranges(**inputs):
    """
    Boolean function to determine whether "Y-Axis Range" inputs should be displayed or not
    """
    [chart_type, y] = [inputs.get(p) for p in ['chart_type', 'y']]
    return chart_type in YAXIS_CHARTS and len(y or [])


def charts_layout(df, settings, **inputs):
    """
    Builds main dash inputs with dropdown options populated with the columns of the dataframe associated with the
    page. Inputs included are: chart tabs, query, x, y, z, group, aggregation, rolling window/computation,
    chart per group toggle, bar sort, bar mode, y-axis range editors

    :param df: dataframe to drive the charts built on page
    :type df: :class:`pandas:pandas.DataFrame`
    :param settings: global settings associated with this dataframe (contains properties like "query")
    :type param: dict
    :return: dash markup
    """
    [chart_type, x, y, z, group, agg] = [inputs.get(p) for p in ['chart_type', 'x', 'y', 'z', 'group', 'agg']]
    y = y or []
    show_input = show_input_handler(chart_type)
    show_cpg = show_chart_per_group(**inputs)
    show_yaxis = show_yaxis_ranges(**inputs)
    bar_style = bar_input_style(**inputs)

    options = build_input_options(df, **inputs)
    x_options, y_multi_options, y_single_options, z_options, group_options, barsort_options, yaxis_options = options
    query_placeholder = (
        "Enter pandas query (ex: col1 == 1)"
    )
    query_label = html.Div([
        html.Span('Query'),
        html.A(html.I(className='fa fa-info-circle ml-4'),
               href='https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query',
               target='_blank', style={'color': 'white'})
    ], className='input-group-addon', style={'min-width': '7em'})
    return html.Div([
        dcc.Store(id='query-data', data=inputs.get('query')),
        dcc.Store(id='input-data', data={k: v for k, v in inputs.items() if k not in ['cpg', 'barmode', 'barsort']}),
        dcc.Store(id='chart-input-data', data={k: v for k, v in inputs.items() if k in ['cpg', 'barmode', 'barsort']}),
        dcc.Store(id='range-data'),
        dcc.Store(id='yaxis-data', data=inputs.get('yaxis')),
        dcc.Store(id='last-chart-input-data', data=inputs),
        dcc.Input(id='chart-code', type='hidden'),
        html.Div(html.Div(dcc.Tabs(
            id='chart-tabs',
            value=chart_type or 'line',
            children=[build_tab(t.get('label', t['value'].capitalize()), t['value']) for t in CHARTS],
            style=dict(height='36px')
        ), className='col-md-12'), className='row pt-3 pb-3 charts-filters'),
        html.Div(html.Div([
            html.Div([
                query_label, dcc.Input(
                    id='query-input', type='text', placeholder=query_placeholder, className='form-control',
                    value=inputs.get('query') or settings.get('query'), style={'line-height': 'inherit'})
            ], className='input-group mr-3')],
            className='col'
        ), className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('X', dcc.Dropdown(
                id='x-dropdown',
                options=x_options,
                placeholder='Select a column',
                value=x,
                style=dict(width='inherit'),
            )),
            build_input('Y', dcc.Dropdown(
                id='y-multi-dropdown',
                options=y_multi_options,
                multi=True,
                placeholder='Select a column(s)',
                style=dict(width='inherit'),
                value=y if show_input('y', 'multi') else None
            ), className='col', id='y-multi-input', style={'display': 'block' if show_input('y', 'multi') else 'none'}),
            build_input('Y', dcc.Dropdown(
                id='y-single-dropdown',
                options=y_single_options,
                placeholder='Select a column',
                style=dict(width='inherit'),
                value=y[0] if show_input('y') and len(y) else None
            ), className='col', id='y-single-input', style={'display': 'block' if show_input('y') else 'none'}),
            build_input('Z', dcc.Dropdown(
                id='z-dropdown',
                options=z_options,
                placeholder='Select a column',
                style=dict(width='inherit'),
                value=z
            ), className='col', id='z-input', style={'display': 'block' if show_input('z') else 'none'}),
            build_input('Group', dcc.Dropdown(
                id='group-dropdown',
                options=group_options,
                multi=True,
                placeholder='Select a group(s)',
                value=group,
                style=dict(width='inherit'),
            ), className='col', id='group-input', style={'display': 'block' if show_input('group') else 'none'}),
        ], className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('Aggregation', dcc.Dropdown(
                id='agg-dropdown',
                options=[build_option(v, AGGS[v]) for v in ['count', 'nunique', 'sum', 'mean', 'rolling', 'corr',
                                                            'first', 'last', 'median', 'min', 'max', 'std', 'var',
                                                            'mad', 'prod']],
                placeholder='Select an aggregation',
                style=dict(width='inherit'),
                value=agg,
            )),
            html.Div([
                build_input('Window', dcc.Input(
                    id='window-input', type='number', placeholder='Enter days', className='form-control text-center',
                    style={'line-height': 'inherit'}, value=inputs.get('window')
                )),
                build_input('Computation', dcc.Dropdown(
                    id='rolling-comp-dropdown',
                    options=[
                        build_option('corr', 'Correlation'),
                        build_option('count', 'Count'),
                        build_option('cov', 'Covariance'),
                        build_option('kurt', 'Kurtosis'),
                        build_option('max', 'Maximum'),
                        build_option('mean', 'Mean'),
                        build_option('median', 'Median'),
                        build_option('min', 'Minimum'),
                        build_option('skew', 'Skew'),
                        build_option('std', 'Standard Deviation'),
                        build_option('sum', 'Sum'),
                        build_option('var', 'Variance'),
                    ],
                    placeholder='Select an computation',
                    style=dict(width='inherit'), value=inputs.get('rolling_comp')
                ))
            ], id='rolling-inputs', style=dict(display='block' if agg == 'rolling' else 'none'))
        ], className='row pt-3 pb-3 charts-filters'),
        html.Div(
            [
                build_input('Chart Per\nGroup',
                            html.Div(daq.BooleanSwitch(id='cpg-toggle', on=inputs.get('cpg') or False),
                                     className='toggle-wrapper'),
                            id='cpg-input', style={'display': 'block' if show_cpg else 'none'}, className='col-auto'),
                build_input('Barmode', dcc.Dropdown(
                    id='barmode-dropdown',
                    options=[
                        build_option('group', 'Group'),
                        build_option('stack', 'Stack'),
                        build_option('relative', 'Relative'),
                    ],
                    value=inputs.get('barmode') or 'group',
                    placeholder='Select a mode',
                ), className='col-auto addon-min-width', style=bar_style, id='barmode-input'),
                build_input('Barsort', dcc.Dropdown(
                    id='barsort-dropdown', options=barsort_options, value=inputs.get('barsort')
                ), className='col-auto addon-min-width', style=bar_style, id='barsort-input'),
                html.Div(
                    html.Div(
                        [
                            html.Span('Y-Axis', className='input-group-addon'),
                            dcc.Dropdown(id='yaxis-dropdown', options=yaxis_options),
                            html.Span('Min:', className='input-group-addon col-auto'),
                            dcc.Input(
                                id='yaxis-min-input', type='number', className='form-control col-auto',
                                style={'line-height': 'inherit'}
                            ),
                            html.Span('Max:', className='input-group-addon col-auto'),
                            dcc.Input(
                                id='yaxis-max-input', type='number', className='form-control col-auto',
                                style={'line-height': 'inherit'}
                            )
                        ],
                        className='input-group',
                    ),
                    className='col-auto addon-min-width', id='yaxis-input',
                    style=dict(display='block' if show_yaxis else 'none')
                ),
            ],
            className='row pt-3 pb-5 charts-filters'
        ),
        dcc.Loading(html.Div(id='chart-content'), type='circle'),
        dcc.Textarea(id="copy-text", style=dict(position='absolute', left='-110%'))
    ], className='charts-body')
