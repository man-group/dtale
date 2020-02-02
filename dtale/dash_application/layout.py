import dash_core_components as dcc
import dash_daq as daq
import dash_html_components as html

from dtale.utils import make_list


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
    'scatter': dict(x=dict(type='single'), y=dict(type='multi'), z=dict(display=True),
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


def charts_layout(df):
    """
    Builds main dash inputs with dropdown options populated with the columns of the dataframe associated with the
    page. Inputs included are: chart tabs, query, x, y, z, group, aggregation, rolling window/computation,
    chart per group toggle, bar sort, bar mode, y-axis range editors

    :param df: dataframe to drive the charts built on page
    :return: dash markup
    """
    cols = [build_option(c) for c in df.columns]
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
        dcc.Store(id='query-data'),
        dcc.Store(id='input-data'),
        dcc.Store(id='chart-input-data'),
        dcc.Store(id='range-data'),
        dcc.Store(id='yaxis-data'),
        dcc.Store(id='last-chart-input-data'),
        html.Div(html.Div(dcc.Tabs(
            id='chart-tabs',
            value='line',
            children=[build_tab(t.get('label', t['value'].capitalize()), t['value']) for t in CHARTS],
            style=dict(height='36px')
        ), className='col-md-12'), className='row pt-3 pb-3 charts-filters'),
        html.Div(html.Div([
            html.Div([
                query_label, dcc.Input(
                    id='query-input', type='text', placeholder=query_placeholder, className='form-control',
                    style={'line-height': 'inherit'})
            ], className='input-group mr-3')],
            className='col'
        ), className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('X', dcc.Dropdown(
                id='x-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            )),
            build_input('Y', dcc.Dropdown(
                id='y-multi-dropdown',
                options=cols,
                multi=True,
                placeholder='Select a column(s)',
                style=dict(width='inherit'),
            ), className='col', id='y-multi-input'),
            build_input('Y', dcc.Dropdown(
                id='y-single-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            ), className='col', style=dict(display='none'), id='y-single-input'),
            build_input('Z', dcc.Dropdown(
                id='z-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            ), className='col', style=dict(display='none'), id='z-input'),
            build_input('Group', dcc.Dropdown(
                id='group-dropdown',
                options=cols,
                multi=True,
                placeholder='Select a group(s)',
                style=dict(width='inherit'),
            ), className='col', id='group-input'),
        ], className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('Aggregation', dcc.Dropdown(
                id='agg-dropdown',
                options=[build_option(v, AGGS[v]) for v in ['count', 'nunique', 'sum', 'mean', 'rolling', 'corr',
                                                            'first', 'last', 'median', 'min', 'max', 'std', 'var',
                                                            'mad', 'prod']],
                placeholder='Select an aggregation',
                style=dict(width='inherit'),
            )),
            html.Div([
                build_input('Window', dcc.Input(
                    id='window-input', type='number', placeholder='Enter days', className='form-control text-center',
                    style={'line-height': 'inherit'}
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
                    style=dict(width='inherit'),
                ))
            ], id='rolling-inputs', style=dict(display='none'))
        ], className='row pt-3 pb-3 charts-filters'),
        html.Div(
            [
                build_input('Chart Per\nGroup',
                            html.Div(daq.BooleanSwitch(id='cpg-toggle', on=False), className='toggle-wrapper'),
                            id='cpg-input', style={'display': 'none'}, className='col-auto'),
                build_input('Barmode', dcc.Dropdown(
                    id='barmode-dropdown',
                    options=[
                        build_option('group', 'Group'),
                        build_option('stack', 'Stack'),
                        build_option('relative', 'Relative'),
                    ],
                    value='group',
                    placeholder='Select a mode',
                ), className='col-auto addon-min-width', style=dict(display='none'), id='barmode-input'),
                build_input('Barsort', dcc.Dropdown(
                    id='barsort-dropdown',
                ), className='col-auto addon-min-width', style=dict(display='none'), id='barsort-input'),
                html.Div(
                    html.Div(
                        [
                            html.Span('Y-Axis', className='input-group-addon'),
                            dcc.Dropdown(id='yaxis-dropdown'),
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
                    className='col-auto addon-min-width', style=dict(display='none'), id='yaxis-input'
                ),
            ],
            className='row pt-3 pb-5 charts-filters'
        ),
        dcc.Loading(html.Div(id='chart-content'), type='circle'),
    ], className='charts-body')
