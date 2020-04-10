import json

import mock
import numpy as np
import pandas as pd
import pytest
from six import PY3

from dtale.app import build_app
from dtale.dash_application.charts import (build_axes, build_figure_data,
                                           build_spaced_ticks,
                                           chart_url_params, chart_wrapper,
                                           get_url_parser)
from dtale.dash_application.components import Wordcloud
from dtale.dash_application.layout import update_label_for_freq

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack

URL = 'http://localhost:40000'
app = build_app(url=URL)


def ts_builder(input_id='input-data'):
    return {'id': input_id, 'property': 'modified_timestamp', 'value': 1579972492434}


def path_builder(port):
    return {'id': 'url', 'property': 'pathname', 'value': '/charts/{}'.format(port)}


@pytest.mark.unit
def test_display_page(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            params = {
                'output': 'popup-content.children',
                'changedPropIds': ['url.modified_timestamp'],
                'inputs': [pathname, {'id': 'url', 'property': 'search', 'value': None}]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            component_defs = resp_data['popup-content']['children']['props']['children']
            x_dd = component_defs[10]['props']['children'][0]
            x_dd = x_dd['props']['children'][0]
            x_dd = x_dd['props']['children'][0]
            x_dd = x_dd['props']['children'][0]
            x_dd_options = x_dd['props']['children'][1]['props']['options']
            unittest.assertEqual([dict(label=v, value=v) for v in ['a', 'b', 'c']], x_dd_options)


@pytest.mark.unit
def test_query_changes(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            params = {
                'output': '..query-data.data...query-input.style...query-input.title..',
                'changedPropIds': ['query-input.value'],
                'inputs': [{'id': 'query-input', 'property': 'value', 'value': 'd'}],
                'state': [pathname, {'id': 'query-data', 'property': 'data'}]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['query-data']['data'] is None
            assert resp_data['query-input']['title'] == "name 'd' is not defined"

            params['inputs'][0]['value'] = 'a == 1'
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['query-data']['data'] == 'a == 1'


@pytest.mark.unit
def test_input_changes(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=pd.date_range('20200101', '20200103')))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            params = {
                'output': (
                    '..input-data.data...x-dropdown.options...y-single-dropdown.options...y-multi-dropdown.options.'
                    '..z-dropdown.options...group-dropdown.options...barsort-dropdown.options.'
                    '..yaxis-dropdown.options...non-map-inputs.style...map-inputs.style...colorscale-input.style..'
                ),
                'changedPropIds': ['chart-tabs.value'],
                'inputs': [
                    ts_builder('query-data'),
                    {'id': 'chart-tabs', 'property': 'value', 'value': 'line'},
                    {'id': 'x-dropdown', 'property': 'value'},
                    {'id': 'y-multi-dropdown', 'property': 'value'},
                    {'id': 'y-single-dropdown', 'property': 'value'},
                    {'id': 'z-dropdown', 'property': 'value'},
                    {'id': 'group-dropdown', 'property': 'value'},
                    {'id': 'group-val-dropdown', 'property': 'value'},
                    {'id': 'agg-dropdown', 'property': 'value'},
                    {'id': 'window-input', 'property': 'value'},
                    {'id': 'rolling-comp-dropdown', 'property': 'value'}
                ],
                'state': [pathname, {'id': 'query-data', 'property': 'data'}]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()
            unittest.assertEqual(resp_data['response']['input-data']['data'], {
                'chart_type': 'line', 'x': None, 'y': [], 'z': None, 'group': None, 'group_val': None, 'agg': None,
                'window': None, 'rolling_comp': None, 'query': None
            })
            unittest.assertEqual(
                resp_data['response']['x-dropdown']['options'],
                [{'label': 'a', 'value': 'a'}, {'label': 'b', 'value': 'b'}, {'label': 'c', 'value': 'c'},
                 {'label': 'd (Hourly)', 'value': 'd|H'}, {'label': 'd (Hour)', 'value': 'd|H2'},
                 {'label': 'd (Weekday)', 'value': 'd|WD'}, {'label': 'd', 'value': 'd'},
                 {'label': 'd (Weekly)', 'value': 'd|W'}, {'label': 'd (Monthly)', 'value': 'd|M'},
                 {'label': 'd (Quarterly)', 'value': 'd|Q'}, {'label': 'd (Yearly)', 'value': 'd|Y'}]
            )
            params['inputs'][2]['value'] = 'a'
            params['inputs'][3]['value'] = ['b', 'c']
            params['inputs'][6]['value'] = ['d']
            params['inputs'][7]['value'] = [json.dumps(dict(d='20200101'))]
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            unittest.assertEqual([o['value'] for o in resp_data['barsort-dropdown']['options']], ['a', 'b', 'c'])
            unittest.assertEqual([o['value'] for o in resp_data['yaxis-dropdown']['options']], ['b', 'c'])


@pytest.mark.unit
def test_map_data(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=pd.date_range('20200101', '20200103'),
                           e=['a', 'b', 'c']))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            params = {
                'output': (
                    '..map-input-data.data...map-loc-dropdown.options...map-lat-dropdown.options...'
                    'map-lon-dropdown.options...map-val-dropdown.options...map-loc-mode-input.style...'
                    'map-loc-input.style...map-lat-input.style...map-lon-input.style...map-scope-input.style...'
                    'map-proj-input.style...proj-hover.style...proj-hover.children...loc-mode-hover.style...'
                    'loc-mode-hover.children..'
                ),
                'changedPropIds': ['map-type-tabs.value'],
                'inputs': [
                    {'id': 'map-type-tabs', 'property': 'value', 'value': 'scattergeo'},
                    {'id': 'map-loc-mode-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-loc-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-lat-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-lon-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-val-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-scope-dropdown', 'property': 'value', 'value': 'world'},
                    {'id': 'map-proj-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-group-dropdown', 'property': 'value', 'value': None},
                ],
                'state': [
                    pathname
                ]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            unittest.assertEqual(
                resp_data['map-input-data']['data'],
                {'map_type': 'scattergeo', 'lat': None, 'lon': None, 'map_val': None, 'scope': 'world', 'proj': None},
            )
            unittest.assertEqual(resp_data['map-loc-dropdown']['options'], [{'label': 'e', 'value': 'e'}])
            unittest.assertEqual(resp_data['map-loc-mode-input']['style'], {'display': 'none'})
            unittest.assertEqual(resp_data['map-lat-input']['style'], {})

            params['inputs'][0]['value'] = 'choropleth'
            params['inputs'][-1]['value'] = 'foo'
            params['inputs'][-2]['value'] = 'hammer'
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            unittest.assertEqual(resp_data['map-loc-mode-input']['style'], {})
            unittest.assertEqual(resp_data['map-lat-input']['style'], {'display': 'none'})
            img_src = resp_data['proj-hover']['children'][1]['props']['children'][1]['props']['src']
            assert img_src == '/images/projections/hammer.png'


@pytest.mark.unit
def test_group_values(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=pd.date_range('20200101', '20200103')))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            params = {
                'output': '..group-val-dropdown.options...group-val-dropdown.value..',
                'changedPropIds': ['group-dropdown.value'],
                'inputs': [
                    {'id': 'chart-tabs', 'property': 'value', 'value': None},
                    {'id': 'group-dropdown', 'property': 'value', 'value': None},
                    {'id': 'map-group-dropdown', 'property': 'value', 'value': None}
                ],
                'state': [
                    pathname,
                    {'id': 'input-data', 'property': 'data', 'value': {}},
                    {'id': 'group-val-dropdown', 'property': 'value', 'value': None}
                ]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            unittest.assertEqual(
                response.get_json()['response'],
                {'group-val-dropdown': {'options': [], 'value': None}}
            )
            params['inputs'][0]['value'] = 'line'
            params['inputs'][1]['value'] = ['c']
            params['state'][1]['value'] = dict(chart_type='line')

            response = c.post('/charts/_dash-update-component', json=params)
            unittest.assertEqual(
                response.get_json()['response'],
                {'group-val-dropdown': {'options': [
                    {'label': '7', 'value': '{"c": 7}'},
                    {'label': '8', 'value': '{"c": 8}'},
                    {'label': '9', 'value': '{"c": 9}'}
                ], 'value': ['{"c": 7}', '{"c": 8}', '{"c": 9}']}}
            )

            params['state'][2]['value'] = ['{"c": 7}']
            response = c.post('/charts/_dash-update-component', json=params)
            unittest.assertEqual(
                response.get_json()['response']['group-val-dropdown']['value'],
                ['{"c": 7}']
            )


@pytest.mark.unit
def test_main_input_styling(unittest):

    with app.test_client() as c:
        params = {
            'output': '..group-val-input.style...main-inputs.className..',
            'changedPropIds': ['input-data.modified_timestamp'],
            'inputs': [ts_builder('input-data'), ts_builder('map-input-data')],
            'state': [
                {'id': 'input-data', 'property': 'data', 'value': {'chart_type': 'maps'}},
                {'id': 'map-input-data', 'property': 'data', 'value': {}},
            ]
        }
        response = c.post('/charts/_dash-update-component', json=params)
        unittest.assertEqual(
            response.get_json()['response'],
            {'group-val-input': {'style': {'display': 'none'}}, 'main-inputs': {'className': 'col-md-12'}}
        )
        params['state'][0]['value']['chart_type'] = 'line'
        params['state'][0]['value']['group'] = ['foo']
        response = c.post('/charts/_dash-update-component', json=params)
        unittest.assertEqual(
            response.get_json()['response'],
            {'group-val-input': {'style': {'display': 'block'}}, 'main-inputs': {'className': 'col-md-8'}}
        )


@pytest.mark.unit
def test_chart_type_changes(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=pd.date_range('20200101', '20200103')))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            fig_data_outputs = (
                '..y-multi-input.style...y-single-input.style...z-input.style...group-input.style...'
                'rolling-inputs.style...cpg-input.style...barmode-input.style...barsort-input.style...'
                'yaxis-input.style...animate-input.style...animate-by-input.style...animate-by-dropdown.options..'
            )
            inputs = {'id': 'input-data', 'property': 'data', 'value': {
                'chart_type': 'line', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None}}
            params = {
                'output': fig_data_outputs,
                'changedPropIds': ['input-data.modified_timestamp'],
                'inputs': [ts_builder()],
                'state': [inputs, path_builder(c.port)]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            for id in ['z-input', 'rolling-inputs', 'cpg-input', 'barmode-input', 'barsort-input']:
                assert resp_data[id]['style']['display'] == 'none'
            for id in ['group-input', 'yaxis-input']:
                assert resp_data[id]['style']['display'] == 'block'

            inputs['value']['chart_type'] = 'bar'
            inputs['value']['y'] = ['b', 'c']
            params = {
                'output': fig_data_outputs,
                'changedPropIds': ['input-data.modified_timestamp'],
                'inputs': [ts_builder()],
                'state': [inputs, path_builder(c.port)]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['barmode-input']['style']['display'] == 'block'
            assert resp_data['barsort-input']['style']['display'] == 'block'

            inputs['value']['chart_type'] = 'line'
            inputs['value']['y'] = ['b']
            inputs['value']['group'] = ['c']
            params = {
                'output': fig_data_outputs,
                'changedPropIds': ['input-data.modified_timestamp'],
                'inputs': [ts_builder()],
                'state': [inputs, path_builder(c.port)]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['cpg-input']['style']['display'] == 'block'

            inputs['value']['chart_type'] = 'heatmap'
            inputs['value']['group'] = None
            inputs['value']['z'] = 'c'
            params = {
                'output': fig_data_outputs,
                'changedPropIds': ['input-data.modified_timestamp'],
                'inputs': [ts_builder()],
                'state': [inputs, path_builder(c.port)]
            }
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['z-input']['style']['display'] == 'block'


@pytest.mark.unit
def test_yaxis_changes(unittest):
    with app.test_client() as c:
        params = dict(
            output=(
                '..yaxis-min-input.value...yaxis-max-input.value...yaxis-dropdown.style...yaxis-min-label.style...'
                'yaxis-min-input.style...yaxis-max-label.style...yaxis-max-input.style...yaxis-type-div.style..'
            ),
            changedPropIds=['yaxis-dropdown.value'],
            inputs=[
                {'id': 'yaxis-type', 'property': 'value', 'value': 'default'},
                {'id': 'yaxis-dropdown', 'property': 'value'}
            ],
            state=[
                dict(id='input-data', property='data', value=dict(chart_type='line', x='a', y=['b'])),
                dict(id='yaxis-data', property='data', value=dict(yaxis={})),
                dict(id='range-data', property='data', value=dict(min={'b': 4, 'c': 5}, max={'b': 6, 'c': 7}))
            ]
        )
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'none'}},
            'yaxis-max-input': {'style': {'display': 'none', 'lineHeight': 'inherit'}, 'value': None},
            'yaxis-max-label': {'style': {'display': 'none'}},
            'yaxis-min-input': {'style': {'display': 'none', 'lineHeight': 'inherit'}, 'value': None},
            'yaxis-min-label': {'style': {'display': 'none'}},
            'yaxis-type-div': {'style': {'borderRadius': '0 0.25rem 0.25rem 0'}}
        })

        params['state'][0]['value']['y'] = None
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'none'}},
            'yaxis-max-input': {'style': {'display': 'none', 'lineHeight': 'inherit'}, 'value': None},
            'yaxis-max-label': {'style': {'display': 'none'}},
            'yaxis-min-input': {'style': {'display': 'none', 'lineHeight': 'inherit'}, 'value': None},
            'yaxis-min-label': {'style': {'display': 'none'}},
            'yaxis-type-div': {'style': {'borderRadius': '0 0.25rem 0.25rem 0'}}
        })

        params['state'][0]['value']['y'] = ['b']
        params['inputs'][0]['value'] = 'single'
        params['inputs'][1]['value'] = 'b'
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'none'}},
            'yaxis-max-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 6},
            'yaxis-max-label': {'style': {'display': 'block'}},
            'yaxis-min-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 4},
            'yaxis-min-label': {'style': {'display': 'block'}},
            'yaxis-type-div': {'style': None}
        })

        params['state'][0]['value']['y'] = ['b', 'c']
        params['inputs'][0]['value'] = 'multi'
        params['inputs'][1]['value'] = 'b'
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'block'}},
            'yaxis-max-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 6},
            'yaxis-max-label': {'style': {'display': 'block'}},
            'yaxis-min-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 4},
            'yaxis-min-label': {'style': {'display': 'block'}},
            'yaxis-type-div': {'style': None}
        })

        params['state'][0]['value']['chart_type'] = 'heatmap'
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'block'}},
            'yaxis-max-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 6},
            'yaxis-max-label': {'style': {'display': 'block'}},
            'yaxis-min-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 4},
            'yaxis-min-label': {'style': {'display': 'block'}},
            'yaxis-type-div': {'style': None}
        })

        params['state'][0]['value']['y'] = ['b']
        params['state'][0]['value']['chart_type'] = 'line'
        params['inputs'][0]['value'] = 'single'
        params['inputs'][1]['value'] = None
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response'], {
            'yaxis-dropdown': {'style': {'display': 'none'}},
            'yaxis-max-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 6},
            'yaxis-max-label': {'style': {'display': 'block'}},
            'yaxis-min-input': {'style': {'display': 'block', 'lineHeight': 'inherit'}, 'value': 4},
            'yaxis-min-label': {'style': {'display': 'block'}},
            'yaxis-type-div': {'style': None}
        })


@pytest.mark.unit
def test_chart_input_updates(unittest):
    with app.test_client() as c:
        params = {
            'output': 'chart-input-data.data',
            'changedPropIds': ['cpg-toggle.on'],
            'inputs': [
                {'id': 'cpg-toggle', 'property': 'on', 'value': False},
                {'id': 'barmode-dropdown', 'property': 'value', 'value': 'group'},
                {'id': 'barsort-dropdown', 'property': 'value'},
                {'id': 'colorscale-dropdown', 'property': 'value'},
                {'id': 'animate-toggle', 'property': 'on'},
                {'id': 'animate-by-dropdown', 'property': 'value'}
            ],
        }

        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response']['chart-input-data']['data'], {
            'cpg': False, 'barmode': 'group', 'barsort': None, 'colorscale': None, 'animate': None, 'animate_by': None
        })


@pytest.mark.unit
def test_yaxis_data(unittest):
    with app.test_client() as c:
        inputs = {
            'chart_type': 'line', 'x': 'a', 'y': ['Col1'], 'z': None, 'group': None, 'agg': None,
            'window': None, 'rolling_comp': None
        }
        params = {
            'output': 'yaxis-data.data',
            'changedPropIds': ['yaxis-min-input.value'],
            'inputs': [
                {'id': 'yaxis-type', 'property': 'value', 'value': 'single'},
                {'id': 'yaxis-min-input', 'property': 'value', 'value': -1.52},
                {'id': 'yaxis-max-input', 'property': 'value', 'value': 0.42}
            ],
            'state': [
                {'id': 'yaxis-dropdown', 'property': 'value', 'value': 'Col1'},
                {'id': 'yaxis-data', 'property': 'data', 'value': {}},
                {'id': 'range-data', 'property': 'data', 'value': {
                    'min': {'Col1': -0.52, 'Col2': -1},
                    'max': {'Col1': 0.42, 'Col2': 3}
                }},
                {'id': 'input-data', 'property': 'data', 'value': inputs}
            ]
        }
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data['response']['yaxis-data']['data'],
            {'data': {'all': {'max': 0.42, 'min': -1.52}}, 'type': 'single'}
        )

        params['inputs'][0]['value'] = 'multi'
        params['inputs'][2]['value'] = 1.42
        params['state'][1]['value'] = {'data': {'Col1': {'max': 0.42, 'min': -1.52}}, 'type': 'single'}
        params['state'][3]['value'] = ['Col1', 'Col2']
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data['response']['yaxis-data']['data'],
            {'data': {'Col1': {'max': 1.42, 'min': -1.52}}, 'type': 'multi'}
        )

        params['inputs'][1]['value'] = -0.52
        params['inputs'][2]['value'] = 0.42
        params['state'][1]['value'] = {'data': {'Col1': {'max': 1.42, 'min': -1.52}}, 'type': 'single'}
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        unittest.assertEqual(resp_data['response']['yaxis-data']['data'], {'data': {}, 'type': 'multi'})

        params['state'][0]['value'] = None
        response = c.post('/charts/_dash-update-component', json=params)
        assert response.get_json() is None

        params['state'][0]['value'] = 'Col1'


def build_chart_params(pathname, inputs={}, chart_inputs={}, yaxis={}, last_inputs={}, map_inputs={}):
    return {
        'output': (
            '..chart-content.children...last-chart-input-data.data...range-data.data...chart-code.value...'
            'yaxis-type.children..'
        ),
        'changedPropIds': ['input-data.modified_timestamp'],
        'inputs': [ts_builder(k) for k in ['input-data', 'chart-input-data', 'yaxis-data', 'map-input-data']],
        'state': [
            pathname,
            {'id': 'input-data', 'property': 'data', 'value': inputs},
            {'id': 'chart-input-data', 'property': 'data', 'value': chart_inputs},
            {'id': 'yaxis-data', 'property': 'data', 'value': yaxis},
            {'id': 'map-input-data', 'property': 'data', 'value': map_inputs},
            {'id': 'last-chart-input-data', 'property': 'data', 'value': last_inputs},
        ]
    }


@pytest.mark.unit
def test_chart_building_nones(unittest):

    with app.test_client() as c:
        pathname = path_builder(c.port)

        params = build_chart_params(pathname)
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        assert resp_data['response']['chart-content']['children'] is None

        params['state'][2]['value'] = {'cpg': False, 'barmode': 'group', 'barsort': None}
        params['state'][-1]['value'] = {'cpg': False, 'barmode': 'group', 'barsort': None, 'yaxis': {}}
        response = c.post('/charts/_dash-update-component', json=params)
        resp_data = response.get_json()
        assert resp_data is None


@pytest.mark.unit
def test_chart_building_wordcloud(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'wordcloud', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['chart-content']['children']['props']['children'][1]['type'] == 'Wordcloud'


@pytest.mark.unit
def test_chart_building_scatter(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'scatter', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['chart-content']['children'][0]['props']['children'][1]['props']['id'] == 'scatter-all-b'

            inputs['y'] = ['b']
            inputs['group'] = ['c']
            chart_inputs['cpg'] = True
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert len(resp_data['chart-content']['children']) == 2


@pytest.mark.unit
def test_chart_building_bar_and_popup(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=[10, 11, 12]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'bar', 'x': 'a', 'y': ['b', 'c'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs, chart_inputs, dict(type='multi', data={}))
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            links_div = resp_data['chart-content']['children']['props']['children'][0]['props']['children']
            url = links_div[0]['props']['href']
            assert url.startswith('/charts/{}?'.format(c.port))
            url_params = dict(get_url_parser()(url.split('?')[-1]))
            unittest.assertEqual(
                url_params,
                {'chart_type': 'bar', 'x': 'a', 'barmode': 'group', 'cpg': 'false', 'y': '["b", "c"]'}
            )
            unittest.assertEqual(
                resp_data['chart-content']['children']['props']['children'][1]['props']['figure']['layout'],
                {'barmode': 'group',
                 'legend': {'orientation': 'h', 'y': 1.2},
                 'title': {'text': 'b, c by a'},
                 'xaxis': {'tickformat': '.0f', 'title': {'text': 'a'}},
                 'yaxis': {'tickformat': '.0f', 'title': {'text': 'b'}},
                 'yaxis2': {'anchor': 'x', 'overlaying': 'y', 'side': 'right', 'tickformat': '.0f',
                            'title': {'text': 'c'}}}
            )

            response = c.get(url)
            assert response.status_code == 200
            [pathname_val, search_val] = url.split('?')
            response = c.post('/charts/_dash-update-component', json={
                'output': 'popup-content.children',
                'changedPropIds': ['url.modified_timestamp'],
                'inputs': [
                    {'id': 'url', 'property': 'pathname', 'value': pathname_val},
                    {'id': 'url', 'property': 'search', 'value': '?{}'.format(search_val)}
                ]
            })
            assert response.status_code == 200

            inputs['y'] = ['b']
            inputs['agg'] = 'sum'
            chart_inputs['animate_by'] = 'c'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children']['props']['children'][1]['props']['figure']

            inputs['y'] = ['b']
            inputs['agg'] = 'raw'
            inputs['group'] = ['d']
            chart_inputs['animate_by'] = 'c'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children']['props']['children'][1]['props']['figure']

            inputs['y'] = ['b', 'c']
            inputs['agg'] = 'raw'
            inputs['group'] = None
            chart_inputs['animate_by'] = None
            chart_inputs['barmode'] = 'stack'
            inputs['agg'] = 'raw'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            unittest.assertEqual(
                resp_data['chart-content']['children']['props']['children'][1]['props']['figure']['layout'],
                {'barmode': 'stack',
                 'legend': {'orientation': 'h', 'y': 1.2},
                 'title': {'text': 'b, c by a (No Aggregation)'},
                 'xaxis': {'tickformat': '.0f',
                           'tickmode': 'array',
                           'ticktext': [1, 2, 3],
                           'tickvals': [0, 1, 2],
                           'title': {'text': 'a'}},
                 'yaxis': {'tickformat': '.0f', 'title': {'text': 'b (No Aggregation)'}}}
            )

            chart_inputs['barmode'] = 'group'
            chart_inputs['barsort'] = 'b'
            inputs['agg'] = None
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            unittest.assertEqual(
                resp_data['chart-content']['children']['props']['children'][1]['props']['figure']['layout'],
                {'barmode': 'group',
                 'legend': {'orientation': 'h', 'y': 1.2},
                 'title': {'text': 'b, c by a'},
                 'xaxis': {
                     'tickmode': 'array', 'ticktext': [1, 2, 3], 'tickvals': [0, 1, 2],
                     'tickformat': '.0f', 'title': {'text': 'a'}
                 },
                 'yaxis': {'tickformat': '.0f', 'title': {'text': 'b, c'}}}
            )

            inputs['y'] = ['b']
            inputs['group'] = ['c']
            chart_inputs['cpg'] = True
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert len(resp_data['chart-content']['children']) == 2


@pytest.mark.unit
def test_chart_building_line(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'line', 'x': 'a', 'y': ['b'], 'z': None, 'group': ['c'],
                'group_val': [dict(c=7)], 'agg': None, 'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': True, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert len(resp_data['chart-content']['children']) == 1

            inputs['group'] = None
            inputs['group_val'] = None
            chart_inputs['cpg'] = False
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['chart-content']['children']['type'] == 'Div'

            chart_inputs['animate'] = True
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children']['props']['children'][1]['props']['figure']

    df = pd.DataFrame([dict(sec_id=i, y=1) for i in range(15500)])
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'line', 'x': 'sec_id', 'y': ['y'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'chart-content' in resp_data


@pytest.mark.unit
def test_chart_building_pie(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'pie', 'x': 'a', 'y': ['b'], 'z': None, 'group': ['c'], 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': True, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert len(resp_data['chart-content']['children']) == 2

            inputs['group'] = None
            chart_inputs['cpg'] = False
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert resp_data['chart-content']['children'][0]['type'] == 'Div'

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, -6]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'pie', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            error = resp_data['chart-content']['children'][0]['props']['children'][0]['props']['children']
            assert error['props']['children'][2]['props']['children']['props']['children'] == '3 (-6)'


@pytest.mark.unit
def test_chart_building_heatmap(unittest, test_data, rolling_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'heatmap', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            assert response.get_json()['response']['chart-content']['children'] is None
            inputs['z'] = 'c'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children']['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'b by a weighted by c'}
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'heatmap', 'x': 'date', 'y': ['security_id'], 'z': 'bar', 'group': None, 'agg': 'mean',
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children']['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'security_id by date weighted by bar (Mean)'}
            )
            inputs['agg'] = 'corr'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            error = resp_data['chart-content']['children']['props']['children'][1]['props']['children']
            assert error == 'No data returned for this computation!'

    def _data():
        for sec_id in range(10):
            for d in pd.date_range('20200101', '20200131'):
                yield dict(date=d, security_id=sec_id)
    df = pd.DataFrame(list(_data()))
    df['val'] = np.random.randn(len(df), 1)
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'heatmap', 'x': 'date', 'y': ['security_id'], 'z': 'val', 'group': None, 'agg': 'corr',
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            title = resp_data['chart-content']['children']['props']['children'][1]['props']['figure']['layout']['title']
            assert title['text'] == 'security_id1 by security_id0 weighted by val (Correlation)'


@pytest.mark.unit
def test_chart_building_3D_scatter(unittest, test_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=[10, 11, 12]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': '3d_scatter', 'x': 'a', 'y': ['b'], 'z': 'c', 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children'][0]['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'b by a weighted by c'}
            )

            inputs['agg'] = 'sum'
            chart_inputs['animate_by'] = 'd'
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children'][0]['props']['children'][1]['props']['figure']

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': '3d_scatter', 'x': 'date', 'y': ['security_id'], 'z': 'bar', 'group': None, 'agg': 'mean',
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children'][0]['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'security_id by date weighted by bar (Mean)'}
            )


@pytest.mark.unit
def test_chart_building_surface(unittest, test_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'surface', 'x': 'a', 'y': ['b'], 'z': 'c', 'group': None, 'agg': None,
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children'][0]['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'b by a weighted by c'}
            )

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(test_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {
                'chart_type': 'surface', 'x': 'date', 'y': ['security_id'], 'z': 'bar', 'group': None, 'agg': 'mean',
                'window': None, 'rolling_comp': None
            }
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': 'b'}
            params = build_chart_params(pathname, inputs, chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children'][0]['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'security_id by date weighted by bar (Mean)'}
            )


@pytest.mark.unit
def test_chart_building_map(unittest, state_data, scattergeo_data):
    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(state_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {'chart_type': 'maps', 'agg': 'raw'}
            map_inputs = {'map_type': 'choropleth', 'loc_mode': 'USA-states', 'loc': 'Code'}
            chart_inputs = {'colorscale': 'Reds'}
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            assert response.get_json()['response']['chart-content']['children'] is None
            map_inputs['map_val'] = 'val'
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children']['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'Map of val (No Aggregation)'}
            )

            chart_inputs['animate_by'] = 'cat'
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children']['props']['children'][1]['props']['figure']

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(scattergeo_data)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            pathname = path_builder(c.port)
            inputs = {'chart_type': 'maps', 'agg': 'raw'}
            map_inputs = {'map_type': 'scattergeo', 'lat': 'lat', 'lon': 'lon', 'map_val': 'val', 'scope': 'world',
                          'proj': 'mercator'}
            chart_inputs = {'colorscale': 'Reds'}
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            chart_markup = response.get_json()['response']['chart-content']['children']['props']['children'][1]
            unittest.assertEqual(
                chart_markup['props']['figure']['layout']['title'],
                {'text': 'Map of val (No Aggregation)'}
            )

            map_inputs['map_group'] = 'cat'
            group_val = str(df['cat'].values[0])
            inputs['group_val'] = [dict(cat=group_val)]
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            print(resp_data['chart-content']['children'])
            title = resp_data['chart-content']['children']['props']['children'][1]['props']['figure']['layout']['title']
            assert title['text'] == 'Map of val (No Aggregation) (cat == {})'.format(group_val)

            map_inputs['map_group'] = None
            inputs['group_val'] = None
            chart_inputs['animate_by'] = 'cat'
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            assert 'frames' in resp_data['chart-content']['children']['props']['children'][1]['props']['figure']

            map_inputs['map_val'] = 'foo'
            params = build_chart_params(pathname, inputs, chart_inputs, map_inputs=map_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']
            error = resp_data['chart-content']['children']['props']['children'][1]['props']['children']
            assert "'foo'" in error


@pytest.mark.unit
def test_load_chart_error(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))

            def build_base_chart_mock(raw_data, x, y, group_col=None, agg=None, allow_duplicates=False, **kwargs):
                raise Exception('error test')
            stack.enter_context(mock.patch(
                'dtale.dash_application.charts.build_base_chart',
                side_effect=build_base_chart_mock
            ))
            pathname = {'id': 'url', 'property': 'pathname', 'value': '/charts/{}'.format(c.port)}
            inputs = {'chart_type': 'line', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                      'window': None, 'rolling_comp': None}
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs=inputs, chart_inputs=chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']['chart-content']['children']
            assert resp_data['props']['children'][1]['props']['children'] == 'error test'


@pytest.mark.unit
def test_display_error(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            stack.enter_context(mock.patch(
                'dtale.dash_application.components.Wordcloud',
                mock.Mock(side_effect=Exception('error test'))
            ))
            pathname = {'id': 'url', 'property': 'pathname', 'value': '/charts/{}'.format(c.port)}
            inputs = {'chart_type': 'wordcloud', 'x': 'a', 'y': ['b'], 'z': None, 'group': None, 'agg': None,
                      'window': None, 'rolling_comp': None}
            chart_inputs = {'cpg': False, 'barmode': 'group', 'barsort': None}
            params = build_chart_params(pathname, inputs=inputs, chart_inputs=chart_inputs)
            response = c.post('/charts/_dash-update-component', json=params)
            resp_data = response.get_json()['response']['chart-content']['children']
            assert resp_data['props']['children'][1]['props']['children'] == 'error test'


@pytest.mark.unit
def test_build_axes(unittest):
    df = pd.DataFrame(dict(a=[1, 2, 3], b=[1, 2, 3], c=[4, 5, 6], d=[8, 9, 10], e=[11, 12, 13], f=[14, 15, 16]))
    with mock.patch('dtale.global_state.DATA', {'1': df}):
        y = ['b', 'c', 'd']
        yaxis_data = dict(type='multi', data=dict(b=dict(min=1, max=4), c=dict(min=5, max=7), d=dict(min=8, max=10)))
        mins = dict(b=2, c=5, d=8)
        maxs = dict(b=4, c=6, d=10)
        axes = build_axes('1', 'a', yaxis_data, mins, maxs)(y)
        unittest.assertEqual(axes, ({
            'yaxis': {'title': 'b', 'range': [1, 4], 'tickformat': '.0f'},
            'yaxis2': {'title': 'c', 'overlaying': 'y', 'side': 'right', 'anchor': 'x', 'range': [5, 7],
                       'tickformat': '.0f'},
            'yaxis3': {'title': 'd', 'overlaying': 'y', 'side': 'left', 'anchor': 'free', 'position': 0.05,
                       'tickformat': '.0f'},
            'xaxis': {'domain': [0.1, 1], 'tickformat': '.0f', 'title': 'a'}
        }, True))

        y.append('e')
        yaxis_data['data']['e'] = dict(min=11, max=13)
        mins['e'] = 11
        maxs['e'] = 13
        axes = build_axes('1', 'a', yaxis_data, mins, maxs)(y)
        unittest.assertEqual(axes, ({
            'yaxis': {'title': 'b', 'range': [1, 4], 'tickformat': '.0f'},
            'yaxis2': {'title': 'c', 'overlaying': 'y', 'side': 'right', 'anchor': 'x', 'range': [5, 7],
                       'tickformat': '.0f'},
            'yaxis3': {'title': 'd', 'overlaying': 'y', 'side': 'left', 'anchor': 'free', 'position': 0.05,
                       'tickformat': '.0f'},
            'yaxis4': {'title': 'e', 'overlaying': 'y', 'side': 'right', 'anchor': 'free', 'position': 0.95,
                       'tickformat': '.0f'},
            'xaxis': {'domain': [0.1, 0.8999999999999999], 'tickformat': '.0f', 'title': 'a'}
        }, True))

        y.append('f')
        yaxis_data['data']['f'] = dict(min=14, max=17)
        mins['f'] = 14
        maxs['f'] = 17
        axes = build_axes('1', 'a', yaxis_data, mins, maxs)(y)
        unittest.assertEqual(axes, ({
            'yaxis': {'title': 'b', 'range': [1, 4], 'tickformat': '.0f'},
            'yaxis2': {'title': 'c', 'overlaying': 'y', 'side': 'right', 'anchor': 'x', 'range': [5, 7],
                       'tickformat': '.0f'},
            'yaxis3': {'title': 'd', 'overlaying': 'y', 'side': 'left', 'anchor': 'free', 'position': 0.05,
                       'tickformat': '.0f'},
            'yaxis4': {'title': 'e', 'overlaying': 'y', 'side': 'right', 'anchor': 'free', 'position': 0.95,
                       'tickformat': '.0f'},
            'yaxis5': {'title': 'f', 'overlaying': 'y', 'side': 'left', 'anchor': 'free', 'position': 0.1,
                       'tickformat': '.0f'},
            'xaxis': {'domain': [0.15000000000000002, 0.8999999999999999], 'tickformat': '.0f', 'title': 'a'}
        }, True))

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[1, 2, 3], c=[4, 5, 6]))
    with mock.patch('dtale.global_state.DATA', {'1': df}):
        y = ['b']
        yaxis_data = dict(type='multi', data=dict(b=dict(min=1, max=4), c=dict(min=5, max=7), d=dict(min=8, max=10)))
        mins = dict(b=2, c=5, d=8)
        maxs = dict(b=4, c=6, d=10)
        axes = build_axes('1', 'a', yaxis_data, mins, maxs, z='c')(y)
        unittest.assertEqual(axes, ({
            'xaxis': {'title': 'a', 'tickformat': '.0f'},
            'yaxis': {'title': 'b', 'range': [1, 4], 'tickformat': '.0f'},
            'zaxis': {'title': 'c', 'tickformat': '.0f'}
        }, False))
        axes = build_axes('1', 'a', yaxis_data, mins, maxs, z='c', agg='corr')(y)
        unittest.assertEqual(axes, ({
            'xaxis': {'title': 'a', 'tickformat': '.0f'},
            'yaxis': {'title': 'b', 'range': [1, 4], 'tickformat': '.0f'},
            'zaxis': {'title': 'c (Correlation)', 'tickformat': '.0f'}
        }, False))
        axes = build_axes('1', 'a', yaxis_data, mins, maxs, agg='corr')(y)
        unittest.assertEqual(axes, ({
            'xaxis': {'title': 'a', 'tickformat': '.0f'},
            'yaxis': {'title': 'b (Correlation)', 'range': [1, 4], 'tickformat': '.0f'},
        }, False))
        yaxis_data['type'] = 'single'
        axes = build_axes('1', 'a', yaxis_data, mins, maxs, agg='corr')(y)
        unittest.assertEqual(axes, ({
            'xaxis': {'title': 'a', 'tickformat': '.0f'},
            'yaxis': {'tickformat': '.0f', 'title': 'b (Correlation)'},
        }, False))


@pytest.mark.unit
def test_build_figure_data(unittest):
    assert build_figure_data('/charts/1', x=None)[0] is None
    assert build_figure_data('/charts/1', x='a', y=['b'], chart_type='heatmap')[0] is None
    with mock.patch('dtale.global_state.DATA', {'1': pd.DataFrame([dict(a=1, b=2, c=3)])}):
        with pytest.raises(BaseException):
            build_figure_data('/charts/1', query='d == 4', x='a', y=['b'], chart_type='line')


@pytest.mark.unit
def test_chart_wrapper(unittest):
    assert chart_wrapper('1', None)('foo') == 'foo'
    url_params = dict(chart_type='line', y=['b', 'c'], yaxis={'b': {'min': 3, 'max': 6}, 'd': {'min': 7, 'max': 10}},
                      agg='rolling', window=10, rolling_calc='corr')
    cw = chart_wrapper('1', dict(min={'b': 4}, max={'b': 6}), url_params)
    output = cw('foo')
    url_params = chart_url_params('?{}'.format(output.children[0].children[0].href.split('?')[-1]))
    unittest.assertEqual(url_params, {'chart_type': 'line', 'agg': 'rolling', 'window': 10,
                                      'cpg': False, 'y': ['b', 'c'], 'yaxis': {'b': {'min': 3, 'max': 6}},
                                      'animate': False})

    url_params = dict(chart_type='bar', y=['b', 'c'], yaxis={'b': {'min': 3, 'max': 6}, 'd': {'min': 7, 'max': 10}},
                      agg='rolling', window=10, rolling_calc='corr', animate_by='d')
    cw = chart_wrapper('1', dict(min={'b': 4}, max={'b': 6}), url_params)
    output = cw('foo')
    url_params = chart_url_params('?{}'.format(output.children[0].children[0].href.split('?')[-1]))
    unittest.assertEqual(url_params, {'chart_type': 'bar', 'agg': 'rolling', 'window': 10,
                                      'cpg': False, 'y': ['b', 'c'], 'yaxis': {'b': {'min': 3, 'max': 6}},
                                      'animate_by': 'd'})


@pytest.mark.unit
def test_build_spaced_ticks(unittest):
    ticks = range(50)
    cfg = build_spaced_ticks(ticks)
    assert cfg['nticks'] == 26


@pytest.mark.unit
def test_wordcloud():
    with pytest.raises(TypeError) as error:
        Wordcloud('foo', {}, y='b', invalid_arg='blah')
    assert (
        'The `Wordcloud` component with the ID "foo" received an unexpected keyword argument: `invalid_arg`'
    ) in str(error)

    with pytest.raises(TypeError) as error:
        Wordcloud(data={}, y='b', invalid_arg='blah')
    assert 'Required argument `id` was not specified.' in str(error)


@pytest.mark.unit
def test_build_chart_type():
    from dtale.dash_application.charts import build_chart

    import dtale.views as views

    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9])))
            stack.enter_context(mock.patch('dtale.global_state.DATA', {c.port: df}))
            output = build_chart(c.port, chart_type='unknown', x='a', y='b')
            assert output[0].children[1].children == 'chart type: unknown'


@pytest.mark.unit
def test_update_label_for_freq(unittest):
    unittest.assertEqual(update_label_for_freq(['date|WD', 'date|D', 'foo']), 'date (Weekday), date, foo')


@pytest.mark.unit
def test_chart_url_params_w_group_filter(unittest):
    from dtale.dash_application.charts import chart_url_params, chart_url_querystring

    querystring = chart_url_querystring(dict(chart_type='bar', x='foo', y=['bar'], group=['baz'],
                                             group_val=[dict(baz='bizzle')], animate_by='bonk'),
                                        group_filter=dict(group="baz == 'bizzle'"))
    parsed_params = chart_url_params(querystring)
    unittest.assertEqual(
        parsed_params,
        {'chart_type': 'bar', 'x': 'foo', 'cpg': False, 'y': ['bar'], 'group': ['baz'],
         'group_val': [{'baz': 'bizzle'}], 'query': "baz == 'bizzle'", 'animate_by': 'bonk'}
    )


@pytest.mark.unit
def test_build_series_name():
    from dtale.dash_application.charts import build_series_name

    handler = build_series_name(['foo', 'bar'], chart_per_group=False)
    assert handler('foo', 'bizz')['name'] == 'bizz/foo'
