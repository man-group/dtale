import dash_core_components as dcc
import dash_daq as daq
import dash_html_components as html


def base_layout(github_fork, **kwargs):
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

    return html.Div(
        [
            html.Div(
                [html.Span(label, className='input-group-addon'), input],
                className='input-group mr-3',
            )
        ],
        className=className, **kwargs
    )


def build_tab(label, value):
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
        })


def build_option(value, label=None):
    return {'label': label or value, 'value': value}


def charts_layout(df):
    cols = [build_option(c) for c in df.columns]
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
            children=[build_tab(t.capitalize(), t) for t in ['line', 'bar', 'scatter', 'heatmap', 'wordcloud']],
            style=dict(height='44px')
        ), className='col-md-12'), className='row pt-3 pb-3 charts-filters'),
        html.Div(build_input('Query', dcc.Input(
            id='query-input', type='text', placeholder='Enter pandas query', className='form-control',
            style={'line-height': 'inherit'}
        ), className='col'), className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('X', dcc.Dropdown(
                id='x-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            )),
            build_input('Y', dcc.Dropdown(
                id='y-dropdown',
                options=cols,
                multi=True,
                placeholder='Select a column(s)',
                style=dict(width='inherit'),
            ), className='col', id='y-input'),
            build_input('Y', dcc.Dropdown(
                id='y-heatmap-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            ), className='col', style=dict(display='none'), id='y-heatmap-input'),
            build_input('Group', dcc.Dropdown(
                id='group-dropdown',
                options=cols,
                multi=True,
                placeholder='Select a group(s)',
                style=dict(width='inherit'),
            ), className='col', id='group-input'),
            build_input('Z', dcc.Dropdown(
                id='z-dropdown',
                options=cols,
                placeholder='Select a column',
                style=dict(width='inherit'),
            ), className='col', style=dict(display='none'), id='z-input'),
        ], className='row pt-3 pb-3 charts-filters'),
        html.Div([
            build_input('Aggregation', dcc.Dropdown(
                id='agg-dropdown',
                options=[
                    build_option('count', 'Count'),
                    build_option('nunique', 'Unique Count'),
                    build_option('sum', 'Sum'),
                    build_option('mean', 'Mean'),
                    build_option('rolling', 'Rolling'),
                    build_option('first', 'First'),
                    build_option('last', 'Last'),
                    build_option('median', 'Median'),
                    build_option('min', 'Minimum'),
                    build_option('max', 'Maximum'),
                    build_option('std', 'Standard Deviation'),
                    build_option('var', 'Variance'),
                    build_option('mad', 'Mean Absolute Deviation'),
                    build_option('prod', 'Product of All Items')
                ],
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
