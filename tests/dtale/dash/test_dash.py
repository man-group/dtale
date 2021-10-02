import json

import mock
import numpy as np
import pandas as pd
import pytest
import dtale.global_state as global_state
from six import PY3


from dtale.app import build_app
from dtale.dash_application.charts import (
    build_axes,
    build_figure_data,
    build_spaced_ticks,
    chart_url_params,
    chart_wrapper,
    get_url_parser,
)
from dtale.dash_application.components import Wordcloud
from dtale.dash_application.layout.layout import REDS, update_label_for_freq_and_agg
from dtale.utils import dict_merge, make_list
from tests import ExitStack
from tests.dtale import build_data_inst
from tests.dtale.test_views import URL


app = build_app(url=URL)


def ts_builder(input_id="input-data"):
    return {"id": input_id, "property": "modified_timestamp", "value": 1579972492434}


def path_builder(port):
    return {
        "id": "url",
        "property": "pathname",
        "value": "/dtale/charts/{}".format(port),
    }


def print_traceback(resp, chart_key="chart-content", return_output=True):
    content = resp.get_json()["response"][chart_key]
    items = content["children"]["props"]["children"]
    if len(items) == 3:
        output = items[2]["props"]["children"]["props"]["children"]
    else:
        output = "No Exception..."
    if return_output:
        return output
    print(output)


@pytest.mark.unit
def test_display_page(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        pathname = path_builder(c.port)
        params = {
            "output": "popup-content.children",
            "changedPropIds": ["url.modified_timestamp"],
            "inputs": [
                pathname,
                {"id": "url", "property": "search", "value": None},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        component_defs = resp_data["popup-content"]["children"]["props"]["children"]
        x_dd = component_defs[19]["props"]["children"][0]
        x_dd = x_dd["props"]["children"][0]
        x_dd = x_dd["props"]["children"][0]
        x_dd = x_dd["props"]["children"][0]
        x_dd_options = x_dd["props"]["children"][1]["props"]["options"]
        unittest.assertEqual(
            [dict(label=v, value=v) for v in ["__index__", "a", "b", "c"]], x_dd_options
        )


@pytest.mark.unit
def test_query_changes():
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        params = {
            "output": "..query-data.data...query-input.style...query-input.title...load-input.marks..",
            "changedPropIds": ["query-input.value"],
            "inputs": [{"id": "query-input", "property": "value", "value": "d"}],
            "state": [
                {"id": "query-data", "property": "data"},
                {"id": "load-input", "property": "marks"},
                {"id": "data-tabs", "property": "value", "value": c.port},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["query-data"]["data"] is None
        assert resp_data["query-input"]["title"] == "name 'd' is not defined"

        params["inputs"][0]["value"] = "a == 1"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["query-data"]["data"] == "a == 1"


@pytest.mark.unit
def test_update_data_selection():
    with app.test_client() as c:
        params = {
            "output": (
                "..x-dropdown.value...y-multi-dropdown.value...y-single-dropdown.value."
                "..z-dropdown.value...group-dropdown.value...query-input.value.."
            ),
            "changedPropIds": ["data-tabs.value"],
            "inputs": [
                {"id": "chart-tabs", "property": "value", "value": "1"},
            ],
            "state": [
                {"id": "input-data", "property": "data", "value": {"data_id": "1"}},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.status_code == 204
        params["state"][0]["value"]["data_id"] = "2"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.get_json()
        assert all(v["value"] is None for v in response["response"].values())


@pytest.mark.unit
def test_collapse_data_input():
    with app.test_client() as c:
        params = {
            "output": "..collapse-data.is_open...collapse-data-btn.children..",
            "changedPropIds": ["collapse-data-btn.n_clicks"],
            "inputs": [
                {"id": "collapse-data-btn", "property": "n_clicks", "value": 1},
            ],
            "state": [
                {"id": "collapse-data", "property": "is_open", "value": False},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert response["collapse-data"]["is_open"]
        assert response["collapse-data-btn"]["children"] == "\u25BC Data Selection"

        params["state"][0]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert not response["collapse-data"]["is_open"]
        assert response["collapse-data-btn"]["children"] == "\u25B6 Data Selection"

        params["inputs"][0]["value"] = 0
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert response["collapse-data"]["is_open"]


@pytest.mark.unit
def test_collapse_cleaners_input():
    with app.test_client() as c:
        params = {
            "output": "..collapse-cleaners.is_open...collapse-cleaners-btn.children..",
            "changedPropIds": ["collapse-cleaners-btn.n_clicks"],
            "inputs": [
                {"id": "collapse-cleaners-btn", "property": "n_clicks", "value": 1},
            ],
            "state": [
                {"id": "collapse-cleaners", "property": "is_open", "value": False},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert response["collapse-cleaners"]["is_open"]
        assert response["collapse-cleaners-btn"]["children"] == "\u25BC Cleaners"

        params["state"][0]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert not response["collapse-cleaners"]["is_open"]
        assert response["collapse-cleaners-btn"]["children"] == "\u25B6 Cleaners"

        params["inputs"][0]["value"] = 0
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        assert response["collapse-cleaners"]["is_open"]


@pytest.mark.unit
def test_input_changes(unittest):
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[4, 5, 6],
            c=[7, 8, 9],
            d=pd.date_range("20200101", "20200103"),
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        pathname = path_builder(c.port)
        params = {
            "output": (
                "..input-data.data...x-dropdown.options...y-single-dropdown.options...y-multi-dropdown.options."
                "..z-dropdown.options...group-dropdown.options...barsort-dropdown.options...yaxis-dropdown.options."
                "..standard-inputs.style...map-inputs.style...candlestick-inputs.style...treemap-inputs.style."
                "..funnel-inputs.style...clustergram-inputs.style...colorscale-input.style...drilldown-input.style."
                "..lock-zoom-btn.style...open-extended-agg-modal.style...selected-cleaners.children.."
            ),
            "changedPropIds": ["chart-tabs.value"],
            "inputs": [
                ts_builder("query-data"),
                ts_builder("extended-aggregations"),
                {"id": "chart-tabs", "property": "value", "value": "line"},
                {"id": "x-dropdown", "property": "value"},
                {"id": "y-multi-dropdown", "property": "value"},
                {"id": "y-single-dropdown", "property": "value"},
                {"id": "z-dropdown", "property": "value"},
                {"id": "group-dropdown", "property": "value", "value": "foo"},
                {"id": "group-type", "property": "value"},
                {
                    "id": "group-val-dropdown",
                    "property": "value",
                    "value": [json.dumps(dict(foo="bar"))],
                },
                {"id": "bins-val-input", "property": "value"},
                {"id": "bins-type", "property": "value"},
                {"id": "agg-dropdown", "property": "value"},
                {"id": "window-input", "property": "value"},
                {"id": "rolling-comp-dropdown", "property": "value"},
                {"id": "load-input", "property": "value"},
                {"id": "load-type-dropdown", "property": "value"},
                {"id": "cleaners-dropdown", "property": "value"},
            ],
            "state": [
                pathname,
                {"id": "query-data", "property": "data"},
                {"id": "data-tabs", "property": "value", "value": c.port},
                {"id": "extended-aggregations", "property": "data"},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["input-data"]["data"],
            {
                "chart_type": "line",
                "x": None,
                "y": [],
                "z": None,
                "group": "foo",
                "group_val": [dict(foo="bar")],
                "agg": "raw",
                "window": None,
                "rolling_comp": None,
                "query": None,
                "load": None,
                "load_type": None,
                "bins_val": None,
                "bin_type": "width",
                "group_type": "groups",
                "data_id": c.port,
                "cleaners": [],
            },
        )
        unittest.assertEqual(
            resp_data["response"]["x-dropdown"]["options"],
            [
                {"label": "__index__", "value": "__index__"},
                {"label": "a", "value": "a"},
                {"label": "b", "value": "b"},
                {"label": "c", "value": "c"},
                {"label": "d (Hourly)", "value": "d|H"},
                {"label": "d (Hour)", "value": "d|H2"},
                {"label": "d (Weekday)", "value": "d|WD"},
                {"label": "d", "value": "d"},
                {"label": "d (Weekly)", "value": "d|W"},
                {"label": "d (Monthly)", "value": "d|M"},
                {"label": "d (Quarterly)", "value": "d|Q"},
                {"label": "d (Yearly)", "value": "d|Y"},
            ],
        )
        params["inputs"][3]["value"] = "a"
        params["inputs"][4]["value"] = ["b", "c"]
        params["inputs"][7]["value"] = ["d"]
        params["inputs"][8]["value"] = [json.dumps(dict(d="20200101"))]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            [o["value"] for o in resp_data["barsort-dropdown"]["options"]],
            ["a", "b", "c"],
        )
        unittest.assertEqual(
            [o["value"] for o in resp_data["yaxis-dropdown"]["options"]], ["b", "c"]
        )


@pytest.mark.unit
def test_map_data(unittest):
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            lat=[4.0, 5.0, 6.0],
            lon=[7.0, 8.0, 9.0],
            d=pd.date_range("20200101", "20200103"),
            e=["a", "b", "c"],
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        params = {
            "output": (
                "..map-input-data.data...map-loc-dropdown.options...map-lat-dropdown.options..."
                "map-lon-dropdown.options...map-val-dropdown.options...map-loc-mode-input.style..."
                "map-loc-input.style...map-lat-input.style...map-lon-input.style...map-scope-input.style..."
                "map-mapbox-style-input.style...map-proj-input.style...proj-hover.style...proj-hover.children..."
                "loc-mode-hover.style...loc-mode-hover.children...custom-geojson-input.style.."
            ),
            "changedPropIds": ["map-type-tabs.value"],
            "inputs": [
                {"id": "map-type-tabs", "property": "value", "value": "scattergeo"},
                {"id": "map-loc-mode-dropdown", "property": "value", "value": None},
                {"id": "map-loc-dropdown", "property": "value", "value": None},
                {"id": "map-lat-dropdown", "property": "value", "value": None},
                {"id": "map-lon-dropdown", "property": "value", "value": None},
                {"id": "map-val-dropdown", "property": "value", "value": None},
                {"id": "map-scope-dropdown", "property": "value", "value": "world"},
                {
                    "id": "map-mapbox-style-dropdown",
                    "property": "value",
                    "value": "open-street-map",
                },
                {"id": "map-proj-dropdown", "property": "value", "value": None},
                {"id": "map-group-dropdown", "property": "value", "value": None},
                {"id": "geojson-dropdown", "property": "value", "value": None},
                {"id": "featureidkey-dropdown", "property": "value", "value": None},
            ],
            "state": [{"id": "data-tabs", "property": "value", "value": c.port}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["map-input-data"]["data"],
            {
                "map_type": "scattergeo",
                "lat": None,
                "lon": None,
                "map_val": None,
                "scope": "world",
                "proj": None,
            },
        )

        unittest.assertEqual(
            resp_data["map-loc-dropdown"]["options"], [{"label": "e", "value": "e"}]
        )
        unittest.assertEqual(
            resp_data["map-loc-mode-input"]["style"], {"display": "none"}
        )
        unittest.assertEqual(resp_data["map-lat-input"]["style"], {})
        unittest.assertEqual(
            resp_data["map-lat-dropdown"]["options"],
            [{"label": "lat", "value": "lat"}],
        )
        unittest.assertEqual(
            resp_data["map-lon-dropdown"]["options"],
            [{"label": "lon", "value": "lon"}],
        )

        params["inputs"][0]["value"] = "mapbox"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["map-loc-mode-input"]["style"], {"display": "none"}
        )
        unittest.assertEqual(resp_data["map-lat-input"]["style"], {})

        params["inputs"][0]["value"] = "choropleth"
        params["inputs"][-3]["value"] = "foo"
        params["inputs"][-4]["value"] = "hammer"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(resp_data["map-loc-mode-input"]["style"], {})
        unittest.assertEqual(resp_data["map-lat-input"]["style"], {"display": "none"})
        img_src = resp_data["proj-hover"]["children"][1]["props"]["children"][1][
            "props"
        ]["src"]
        assert img_src == "../static/images/projections/hammer.png"


@pytest.mark.unit
def test_group_values(unittest):
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[4, 5, 6],
            c=[7, 8, 9],
            d=pd.date_range("20200101", "20200103"),
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        params = {
            "output": "..group-val-dropdown.options...group-val-dropdown.value..",
            "changedPropIds": ["group-dropdown.value"],
            "inputs": [
                {"id": "chart-tabs", "property": "value", "value": None},
                {"id": "group-dropdown", "property": "value", "value": None},
                {"id": "map-group-dropdown", "property": "value", "value": None},
                {
                    "id": "candlestick-group-dropdown",
                    "property": "value",
                    "value": None,
                },
                {
                    "id": "treemap-group-dropdown",
                    "property": "value",
                    "value": None,
                },
                {
                    "id": "funnel-group-dropdown",
                    "property": "value",
                    "value": None,
                },
                {
                    "id": "clustergram-group-dropdown",
                    "property": "value",
                    "value": None,
                },
            ],
            "state": [
                {"id": "input-data", "property": "data", "value": {"data_id": c.port}},
                {"id": "group-val-dropdown", "property": "value", "value": None},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"],
            {"group-val-dropdown": {"options": [], "value": None}},
        )
        params["inputs"][0]["value"] = "line"
        params["inputs"][1]["value"] = ["c"]
        params["state"][0]["value"] = dict(chart_type="line", data_id=c.port)
        expected = {
            "group-val-dropdown": {
                "options": [
                    {"label": "7", "value": '{"c": 7}'},
                    {"label": "8", "value": '{"c": 8}'},
                    {"label": "9", "value": '{"c": 9}'},
                ],
                "value": ['{"c": 7}', '{"c": 8}', '{"c": 9}'],
            }
        }

        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(response.get_json()["response"], expected)

        params["inputs"][0]["value"] = "maps"
        params["inputs"][1]["value"] = None
        params["inputs"][2]["value"] = ["c"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(response.get_json()["response"], expected)

        params["inputs"][0]["value"] = "candlestick"
        params["inputs"][2]["value"] = None
        params["inputs"][3]["value"] = ["c"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(response.get_json()["response"], expected)

        params["inputs"][0]["value"] = "treemap"
        params["inputs"][2]["value"] = None
        params["inputs"][3]["value"] = None
        params["inputs"][4]["value"] = ["c"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(response.get_json()["response"], expected)

        params["state"][1]["value"] = ['{"c": 7}']
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"]["group-val-dropdown"]["value"],
            ['{"c": 7}'],
        )


@pytest.mark.unit
def test_main_input_styling(unittest):
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1.1, 2.1, 3.3],
            b=[4, 5, 6],
            c=[
                pd.Timestamp("20000101"),
                pd.Timestamp("20000102"),
                pd.Timestamp("20000103"),
            ],
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        params = {
            "output": (
                "..group-type-input.style...group-val-input.style...bins-input.style...main-inputs.className..."
                "group-inputs-row.style.."
            ),
            "changedPropIds": ["input-data.modified_timestamp"],
            "inputs": [
                ts_builder("input-data"),
                ts_builder("map-input-data"),
                ts_builder("candlestick-input-data"),
                ts_builder("treemap-input-data"),
                ts_builder("funnel-input-data"),
                ts_builder("clustergram-input-data"),
            ],
            "state": [
                {
                    "id": "input-data",
                    "property": "data",
                    "value": {"chart_type": "maps", "data_id": c.port},
                },
                {"id": "map-input-data", "property": "data", "value": {}},
                {"id": "candlestick-input-data", "property": "data", "value": {}},
                {"id": "treemap-input-data", "property": "data", "value": {}},
                {"id": "funnel-input-data", "property": "data", "value": {}},
                {"id": "clustergram-input-data", "property": "data", "value": {}},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"],
            {
                "bins-input": {"style": {"display": "none"}},
                "group-type-input": {"style": {"display": "none"}},
                "group-inputs-row": {"style": {"display": "none"}},
                "group-val-input": {"style": {"display": "none"}},
                "main-inputs": {"className": "col-md-12"},
            },
        )
        params["state"][1]["value"]["chart_type"] = "line"
        params["state"][1]["value"]["group"] = ["b"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"],
            {
                "bins-input": {"style": {"display": "none"}},
                "group-inputs-row": {"style": {"display": "block"}},
                "group-type-input": {"style": {"display": "block"}},
                "group-val-input": {"style": {"display": "none"}},
                "main-inputs": {"className": "col-md-8"},
            },
        )
        params["state"][1]["value"]["group"] = ["a"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"],
            {
                "bins-input": {"style": {"display": "block"}},
                "group-inputs-row": {"style": {"display": "block"}},
                "group-type-input": {"style": {"display": "none"}},
                "group-val-input": {"style": {"display": "none"}},
                "main-inputs": {"className": "col-md-8"},
            },
        )

        params["state"][1]["value"]["group"] = ["c"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert (
            response.get_json()["response"]["bins-input"]["style"]["display"] == "none"
        )
        assert (
            response.get_json()["response"]["group-val-input"]["style"]["display"]
            == "block"
        )

        params["state"][1]["value"]["group"] = ["c|WD"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert (
            response.get_json()["response"]["bins-input"]["style"]["display"] == "none"
        )
        assert (
            response.get_json()["response"]["group-val-input"]["style"]["display"]
            == "block"
        )


@pytest.mark.unit
def test_chart_type_changes():
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[4, 5, 6],
            c=[7, 8, 9],
            d=pd.date_range("20200101", "20200103"),
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        fig_data_outputs = (
            "..y-multi-input.style...y-single-input.style...z-input.style...group-input.style..."
            "rolling-inputs.style...cpg-input.style...cpy-input.style...barmode-input.style...barsort-input.style..."
            "top-bars-input.style...yaxis-input.style...animate-input.style...animate-by-input.style..."
            "animate-by-dropdown.options...trendline-input.style.."
        )
        inputs = {
            "id": "input-data",
            "property": "data",
            "value": {
                "chart_type": "line",
                "x": "a",
                "y": ["b"],
                "z": None,
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
            },
        }
        params = {
            "output": fig_data_outputs,
            "changedPropIds": ["input-data.modified_timestamp"],
            "inputs": [ts_builder()],
            "state": [inputs, path_builder(c.port)],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        for id in [
            "z-input",
            "rolling-inputs",
            "cpg-input",
            "barmode-input",
            "barsort-input",
        ]:
            assert resp_data[id]["style"]["display"] == "none"
        for id in ["group-input", "yaxis-input"]:
            assert resp_data[id]["style"]["display"] == "block"

        inputs["value"]["chart_type"] = "bar"
        inputs["value"]["y"] = ["b", "c"]
        params = {
            "output": fig_data_outputs,
            "changedPropIds": ["input-data.modified_timestamp"],
            "inputs": [ts_builder()],
            "state": [inputs, path_builder(c.port)],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["barmode-input"]["style"]["display"] == "block"
        assert resp_data["barsort-input"]["style"]["display"] == "block"

        inputs["value"]["chart_type"] = "line"
        inputs["value"]["y"] = ["b"]
        inputs["value"]["group"] = ["c"]
        params = {
            "output": fig_data_outputs,
            "changedPropIds": ["input-data.modified_timestamp"],
            "inputs": [ts_builder()],
            "state": [inputs, path_builder(c.port)],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["cpg-input"]["style"]["display"] == "block"

        inputs["value"]["chart_type"] = "heatmap"
        inputs["value"]["group"] = None
        inputs["value"]["z"] = "c"
        params = {
            "output": fig_data_outputs,
            "changedPropIds": ["input-data.modified_timestamp"],
            "inputs": [ts_builder()],
            "state": [inputs, path_builder(c.port)],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["z-input"]["style"]["display"] == "block"


@pytest.mark.unit
def test_yaxis_changes(unittest):
    with app.test_client() as c:
        params = dict(
            output=(
                "..yaxis-min-input.value...yaxis-max-input.value...yaxis-dropdown.style...yaxis-min-label.style..."
                "yaxis-min-input.style...yaxis-max-label.style...yaxis-max-input.style...yaxis-type-div.style.."
            ),
            changedPropIds=["yaxis-dropdown.value"],
            inputs=[
                {"id": "yaxis-type", "property": "value", "value": "default"},
                {"id": "yaxis-dropdown", "property": "value"},
            ],
            state=[
                dict(
                    id="input-data",
                    property="data",
                    value=dict(chart_type="line", x="a", y=["b"]),
                ),
                dict(id="yaxis-data", property="data", value=dict(yaxis={})),
                dict(
                    id="range-data",
                    property="data",
                    value=dict(min={"b": 4, "c": 5}, max={"b": 6, "c": 7}),
                ),
                dict(id="extended-aggregations", property="data"),
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "none"}},
                "yaxis-max-input": {
                    "style": {"display": "none", "lineHeight": "inherit"},
                    "value": None,
                },
                "yaxis-max-label": {"style": {"display": "none"}},
                "yaxis-min-input": {
                    "style": {"display": "none", "lineHeight": "inherit"},
                    "value": None,
                },
                "yaxis-min-label": {"style": {"display": "none"}},
                "yaxis-type-div": {"style": {"borderRadius": "0 0.25rem 0.25rem 0"}},
            },
        )

        params["state"][0]["value"]["y"] = None
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "none"}},
                "yaxis-max-input": {
                    "style": {"display": "none", "lineHeight": "inherit"},
                    "value": None,
                },
                "yaxis-max-label": {"style": {"display": "none"}},
                "yaxis-min-input": {
                    "style": {"display": "none", "lineHeight": "inherit"},
                    "value": None,
                },
                "yaxis-min-label": {"style": {"display": "none"}},
                "yaxis-type-div": {"style": {"borderRadius": "0 0.25rem 0.25rem 0"}},
            },
        )

        params["state"][0]["value"]["y"] = ["b"]
        params["inputs"][0]["value"] = "single"
        params["inputs"][1]["value"] = "b"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "none"}},
                "yaxis-max-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 6,
                },
                "yaxis-max-label": {"style": {"display": "block"}},
                "yaxis-min-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 4,
                },
                "yaxis-min-label": {"style": {"display": "block"}},
                "yaxis-type-div": {"style": None},
            },
        )

        params["state"][0]["value"]["y"] = ["b", "c"]
        params["inputs"][0]["value"] = "multi"
        params["inputs"][1]["value"] = "b"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "block"}},
                "yaxis-max-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 6,
                },
                "yaxis-max-label": {"style": {"display": "block"}},
                "yaxis-min-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 4,
                },
                "yaxis-min-label": {"style": {"display": "block"}},
                "yaxis-type-div": {"style": None},
            },
        )

        params["state"][0]["value"]["chart_type"] = "heatmap"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "block"}},
                "yaxis-max-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 6,
                },
                "yaxis-max-label": {"style": {"display": "block"}},
                "yaxis-min-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 4,
                },
                "yaxis-min-label": {"style": {"display": "block"}},
                "yaxis-type-div": {"style": None},
            },
        )

        params["state"][0]["value"]["y"] = ["b"]
        params["state"][0]["value"]["chart_type"] = "line"
        params["inputs"][0]["value"] = "single"
        params["inputs"][1]["value"] = None
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"],
            {
                "yaxis-dropdown": {"style": {"display": "none"}},
                "yaxis-max-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 6,
                },
                "yaxis-max-label": {"style": {"display": "block"}},
                "yaxis-min-input": {
                    "style": {"display": "block", "lineHeight": "inherit"},
                    "value": 4,
                },
                "yaxis-min-label": {"style": {"display": "block"}},
                "yaxis-type-div": {"style": None},
            },
        )


@pytest.mark.unit
def test_chart_input_updates(unittest):
    with app.test_client() as c:
        params = {
            "output": "chart-input-data.data",
            "changedPropIds": ["cpg-toggle.on"],
            "inputs": [
                {"id": "cpg-toggle", "property": "on", "value": False},
                {"id": "cpy-toggle", "property": "on", "value": False},
                {"id": "barmode-dropdown", "property": "value", "value": "group"},
                {"id": "barsort-dropdown", "property": "value"},
                {"id": "top-bars", "property": "value"},
                {"id": "colorscale-dropdown", "property": "value"},
                {"id": "animate-toggle", "property": "on"},
                {"id": "animate-by-dropdown", "property": "value"},
                {"id": "trendline-dropdown", "property": "value"},
                {"id": "yaxis-scale", "property": "value"},
            ],
        }

        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["chart-input-data"]["data"],
            {
                "cpg": False,
                "cpy": False,
                "barmode": "group",
                "barsort": None,
                "top_bars": None,
                "colorscale": None,
                "animate": None,
                "animate_by": None,
                "trendline": None,
                "scale": None,
            },
        )


@pytest.mark.unit
def test_yaxis_data(unittest):
    with app.test_client() as c:
        inputs = {
            "chart_type": "line",
            "x": "a",
            "y": ["Col1"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        params = {
            "output": "yaxis-data.data",
            "changedPropIds": ["yaxis-min-input.value"],
            "inputs": [
                {"id": "yaxis-type", "property": "value", "value": "single"},
                {"id": "yaxis-min-input", "property": "value", "value": -1.52},
                {"id": "yaxis-max-input", "property": "value", "value": 0.42},
            ],
            "state": [
                {"id": "yaxis-dropdown", "property": "value", "value": "Col1"},
                {
                    "id": "yaxis-dropdown",
                    "property": "options",
                    "value": [{"value": "Col1"}, {"value": "Col2"}],
                },
                {"id": "yaxis-data", "property": "data", "value": {}},
                {
                    "id": "range-data",
                    "property": "data",
                    "value": {
                        "min": {"Col1": -0.52, "Col2": -1},
                        "max": {"Col1": 0.42, "Col2": 3},
                    },
                },
                {"id": "input-data", "property": "data", "value": inputs},
                {"id": "extended-aggregations", "property": "data"},
            ],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["yaxis-data"]["data"],
            {"data": {"all": {"max": 0.42, "min": -1.52}}, "type": "single"},
        )

        params["inputs"][0]["value"] = "multi"
        params["inputs"][2]["value"] = 1.42
        params["state"][2]["value"] = {
            "data": {"Col1": {"max": 0.42, "min": -1.52}},
            "type": "single",
        }
        params["state"][4]["value"] = ["Col1", "Col2"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["yaxis-data"]["data"],
            {"data": {"Col1": {"max": 1.42, "min": -1.52}}, "type": "multi"},
        )

        params["inputs"][1]["value"] = -0.52
        params["inputs"][2]["value"] = 0.42
        params["state"][2]["value"] = {
            "data": {"Col1": {"max": 1.42, "min": -1.52}},
            "type": "single",
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["yaxis-data"]["data"], {"data": {}, "type": "multi"}
        )

        params["state"][0]["value"] = None
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        unittest.assertEqual(
            resp_data["response"]["yaxis-data"]["data"], {"data": {}, "type": "multi"}
        )


def build_dash_request(output, changed_prop_id, inputs, state):
    return {
        "output": output,
        "changedPropIds": make_list(changed_prop_id),
        "inputs": make_list(inputs),
        "state": make_list(state),
    }


def build_chart_params(
    data_id,
    inputs={},
    chart_inputs={},
    yaxis={},
    last_inputs={},
    map_inputs={},
    cs_inputs={},
    treemap_inputs={},
    funnel_inputs={},
    clustergram_inputs={},
    extended_aggregation=[],
):
    return build_dash_request(
        (
            "..chart-content.children...last-chart-input-data.data...range-data.data...chart-code.value..."
            "yaxis-type.children...load-clicks.data...save-btn.style...agg-dropdown.disabled..."
            "extended-aggregation-tooltip.children...ext-agg-warning.style.."
        ),
        "input-data.modified_timestamp",
        [
            ts_builder(k)
            for k in [
                "input-data",
                "chart-input-data",
                "yaxis-data",
                "map-input-data",
                "candlestick-input-data",
                "treemap-input-data",
                "funnel-input-data",
                "clustergram-input-data",
                "extended-aggregations",
            ]
        ]
        + [{"id": "load-btn", "property": "n_clicks", "value": 0}],
        [
            {
                "id": "input-data",
                "property": "data",
                "value": dict_merge(dict(data_id=data_id), inputs),
            },
            {"id": "chart-input-data", "property": "data", "value": chart_inputs},
            {"id": "yaxis-data", "property": "data", "value": yaxis},
            {"id": "map-input-data", "property": "data", "value": map_inputs},
            {"id": "candlestick-input-data", "property": "data", "value": cs_inputs},
            {"id": "treemap-input-data", "property": "data", "value": treemap_inputs},
            {"id": "funnel-input-data", "property": "data", "value": funnel_inputs},
            {
                "id": "clustergram-input-data",
                "property": "data",
                "value": clustergram_inputs,
            },
            {"id": "last-chart-input-data", "property": "data", "value": last_inputs},
            {"id": "auto-load-toggle", "property": "on", "value": True},
            {"id": "load-clicks", "property": "data", "value": 0},
            {
                "id": "extended-aggregations",
                "property": "data",
                "value": extended_aggregation,
            },
        ],
    )


@pytest.mark.unit
def test_chart_building_nones():

    with app.test_client() as c:
        params = build_chart_params(c.port)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()
        assert resp_data["response"]["chart-content"]["children"] is None

        params["state"][1]["value"] = {
            "cpg": False,
            "cpy": False,
            "barmode": "group",
            "barsort": None,
        }
        params["state"][-3]["value"] = {
            "cpg": False,
            "cpy": False,
            "barmode": "group",
            "barsort": None,
            "yaxis": {},
            "data_id": c.port,
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]["chart-content"]["children"]
        assert resp_data is None


@pytest.mark.unit
def test_chart_building_wordcloud():
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "wordcloud",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
            "load": 80,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": None}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            resp_data["chart-content"]["children"]["props"]["children"][1]["type"]
            == "Wordcloud"
        )

        inputs["load_type"] = "head"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            resp_data["chart-content"]["children"]["props"]["children"][1]["type"]
            == "Wordcloud"
        )

        inputs["y"] = None
        inputs["agg"] = "count"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            resp_data["chart-content"]["children"]["props"]["children"][1]["type"]
            == "Wordcloud"
        )


@pytest.mark.unit
def test_chart_building_scatter():
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "scatter",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": None}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        plot_data = resp_data["chart-content"]["children"][0]["props"]["children"][1][
            "props"
        ]
        assert plot_data["id"] == "chart-1"
        assert len(plot_data["figure"]["data"]) == 1

        chart_inputs["trendline"] = "ols"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        plot_data = resp_data["chart-content"]["children"][0]["props"]["children"][1][
            "props"
        ]
        assert plot_data["id"] == "chart-1"
        assert len(plot_data["figure"]["data"]) == 2

        chart_inputs["trendline"] = "lowess"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        plot_data = resp_data["chart-content"]["children"][0]["props"]["children"][1][
            "props"
        ]
        assert plot_data["id"] == "chart-1"
        assert len(plot_data["figure"]["data"]) == 2

        inputs["y"] = ["b"]
        inputs["group"] = ["c"]
        chart_inputs["cpg"] = True
        chart_inputs["trendline"] = None
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 2


@pytest.mark.unit
def test_chart_building_scatter_trendline_with_dates():
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[
                pd.Timestamp("20000101"),
                pd.Timestamp("20000102"),
                pd.Timestamp("20000103"),
            ],
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        inputs = {
            "chart_type": "scatter",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {
            "cpg": False,
            "cpy": False,
            "barmode": "group",
            "barsort": None,
            "trendline": "ols",
        }
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        plot_data = resp_data["chart-content"]["children"][0]["props"]["children"][1][
            "props"
        ]
        assert plot_data["id"] == "chart-1"
        assert len(plot_data["figure"]["data"]) == 2


@pytest.mark.unit
def test_chart_building_bar_and_popup(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=[10, 11, 12]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        inputs = {
            "chart_type": "bar",
            "x": "a",
            "y": ["b", "c"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": True, "barmode": "group", "barsort": None}
        params = build_chart_params(
            c.port, inputs, chart_inputs, dict(type="multi", data={})
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        chart_inputs["cpy"] = False
        params = build_chart_params(
            c.port, inputs, chart_inputs, dict(type="multi", data={})
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        links_div = resp_data["chart-content"]["children"]["props"]["children"][0][
            "props"
        ]["children"]
        url = links_div[0]["props"]["children"][0]["props"]["href"]
        assert url.startswith("/dtale/charts/{}?".format(c.port))
        url_params = dict(get_url_parser()(url.split("?")[-1]))
        unittest.assertEqual(
            url_params,
            {
                "chart_type": "bar",
                "x": "a",
                "barmode": "group",
                "cpg": "false",
                "cpy": "false",
                "y": '["b", "c"]',
            },
        )
        unittest.assertEqual(
            resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]["layout"],
            {
                "barmode": "group",
                "legend": {"orientation": "h"},
                "title": {"text": "b, c by a"},
                "xaxis": {"tickformat": "0:g", "title": {"text": "a"}},
                "yaxis": {"tickformat": "0:g", "title": {"text": "b"}},
                "yaxis2": {
                    "anchor": "x",
                    "overlaying": "y",
                    "side": "right",
                    "tickformat": "0:g",
                    "title": {"text": "c"},
                },
            },
        )

        response = c.get(url)
        assert response.status_code == 200
        [pathname_val, search_val] = url.split("?")
        response = c.post(
            "/dtale/charts/_dash-update-component",
            json={
                "output": "popup-content.children",
                "changedPropIds": ["url.modified_timestamp"],
                "inputs": [
                    {"id": "url", "property": "pathname", "value": pathname_val},
                    {
                        "id": "url",
                        "property": "search",
                        "value": "?{}".format(search_val),
                    },
                ],
            },
        )
        assert response.status_code == 200

        inputs["y"] = ["b"]
        inputs["agg"] = "sum"
        chart_inputs["animate_by"] = "c"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

        inputs["y"] = ["b"]
        inputs["agg"] = "raw"
        inputs["group"] = ["d"]
        chart_inputs["animate_by"] = "c"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

        inputs["y"] = ["b", "c"]
        inputs["agg"] = "raw"
        inputs["group"] = None
        chart_inputs["animate_by"] = None
        chart_inputs["barmode"] = "stack"
        inputs["agg"] = "raw"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]["layout"],
            {
                "barmode": "stack",
                "legend": {"orientation": "h"},
                "title": {"text": "b, c by a"},
                "xaxis": {
                    "tickformat": "0:g",
                    "title": {"text": "a"},
                },
                "yaxis": {
                    "tickformat": "0:g",
                    "title": {"text": "b"},
                },
            },
        )

        inputs["agg"] = None
        inputs["y"] = "__index__"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "pd.Series(df.index, index=df.index, name='__index__')"
            in resp_data["chart-code"]["value"]
        )

        inputs["y"] = ["b", "c"]
        chart_inputs["barmode"] = "group"
        chart_inputs["barsort"] = "b"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]["layout"],
            {
                "barmode": "group",
                "legend": {"orientation": "h"},
                "title": {"text": "b, c by a"},
                "xaxis": {
                    "tickmode": "array",
                    "ticktext": [1, 2, 3],
                    "tickvals": [0, 1, 2],
                    "tickformat": "0:g",
                    "title": {"text": "a"},
                },
                "yaxis": {"tickformat": "0:g", "title": {"text": "b, c"}},
            },
        )

        inputs["y"] = ["b"]
        inputs["group"] = ["c"]
        chart_inputs["cpg"] = True
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 2

        chart_inputs["top_bars"] = 5
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 2

        chart_inputs["top_bars"] = None
        params["inputs"][-1]["value"] = 1
        params["state"][-3]["value"] = False
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json()["response"]["load-clicks"]["data"] == 1

        params["state"][-2]["value"] = 1
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.status_code == 204


@pytest.mark.unit
def test_chart_building_line(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "line",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": ["c"],
            "group_val": [dict(c=7)],
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": True, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 1

        inputs["group"] = None
        inputs["group_val"] = None
        chart_inputs["cpg"] = False
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["chart-content"]["children"]["type"] == "Div"

        chart_inputs["animate"] = True
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

    df = pd.DataFrame([dict(sec_id=i, y=1) for i in range(15500)])
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "line",
            "x": "sec_id",
            "y": ["y"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": None}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert "chart-content" in resp_data


@pytest.mark.unit
def test_chart_building_pie():
    import dtale.views as views

    df = pd.DataFrame(
        dict(a=[1, 2, 3, 4, 5, 6], b=[7, 8, 9, 10, 11, 12], c=[13, 14, 15, 16, 17, 18])
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "pie",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": ["c"],
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": True, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 3

        inputs["group"] = None
        chart_inputs["cpg"] = False
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["chart-content"]["children"][0]["type"] == "Div"

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, -6]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "pie",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        error = resp_data["chart-content"]["children"][0]["props"]["children"][0][
            "props"
        ]["children"]
        assert (
            error["props"]["children"][2]["props"]["children"]["props"]["children"]
            == "3 (-6)"
        )


@pytest.mark.unit
def test_chart_building_heatmap(unittest, test_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "heatmap",
            "x": "a",
            "y": ["b"],
            "z": None,
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json()["response"]["chart-content"]["children"] is None
        inputs["z"] = "c"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "b by a weighted by c"},
        )

    with app.test_client() as c:
        df, _ = views.format_data(test_data)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "heatmap",
            "x": "date",
            "y": ["security_id"],
            "z": "bar",
            "group": None,
            "agg": "mean",
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "security_id by date weighted by Mean of bar"},
        )
        inputs["animate_by"] = "foo"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "security_id by date weighted by Mean of bar"},
        )
        del inputs["animate_by"]
        inputs["agg"] = "corr"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        error = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "children"
        ]
        assert error == "No data returned for this computation!"

    def _data():
        for sec_id in range(10):
            for d in pd.date_range("20200101", "20200131"):
                yield dict(date=d, security_id=sec_id)

    df = pd.DataFrame(list(_data()))
    df["val"] = np.random.randn(len(df), 1)
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "heatmap",
            "x": "date",
            "y": ["security_id"],
            "z": "val",
            "group": None,
            "agg": "corr",
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        title = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "figure"
        ]["layout"]["title"]
        assert (
            title["text"]
            == "security_id1 by security_id0 weighted by val (Correlation)"
        )


@pytest.mark.unit
def test_chart_building_3D_scatter(unittest, test_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9], d=[10, 11, 12]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "3d_scatter",
            "x": "a",
            "y": ["b"],
            "z": "c",
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "b by a weighted by c"},
        )

        inputs["group"] = ["d"]
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        assert len(chart_markup["props"]["figure"]["data"]) == 3

        inputs["agg"] = "sum"
        inputs["group"] = None
        chart_inputs["animate_by"] = "d"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"][0]["props"]["children"][1][
                "props"
            ]["figure"]
        )

    with app.test_client() as c:
        df, _ = views.format_data(test_data)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "3d_scatter",
            "x": "date",
            "y": ["security_id"],
            "z": "bar",
            "group": None,
            "agg": "mean",
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "security_id by date weighted by Mean of bar"},
        )

        inputs["agg"] = "pctsum"
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "security_id by date weighted by Percentage Sum of bar"},
        )


@pytest.mark.unit
def test_chart_building_surface(unittest, test_data):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "surface",
            "x": "a",
            "y": ["b"],
            "z": "c",
            "group": None,
            "agg": None,
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "b by a weighted by c"},
        )

    with app.test_client() as c:
        df, _ = views.format_data(test_data)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "surface",
            "x": "date",
            "y": ["security_id"],
            "z": "bar",
            "group": None,
            "agg": "mean",
            "window": None,
            "rolling_comp": None,
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": "b"}
        params = build_chart_params(c.port, inputs, chart_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][0][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "security_id by date weighted by Mean of bar"},
        )


@pytest.mark.unit
def test_chart_building_map_choropleth(unittest, state_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(state_data)
        build_data_inst({c.port: df})
        inputs = {"chart_type": "maps", "agg": "raw"}
        map_inputs = {
            "map_type": "choropleth",
            "loc_mode": "USA-states",
            "loc": "Code",
        }
        chart_inputs = {"colorscale": REDS}
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json()["response"]["chart-content"]["children"] is None
        map_inputs["map_val"] = "val"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "Map of val (No Aggregation)"},
        )

        chart_inputs["animate_by"] = "cat"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

    # test duplicate data
    with app.test_client() as c:
        df, _ = views.format_data(
            pd.concat([state_data, state_data], ignore_index=True)
        )
        build_data_inst({c.port: df})
        inputs = {"chart_type": "maps", "agg": "raw"}
        map_inputs = {
            "map_type": "choropleth",
            "loc_mode": "USA-states",
            "loc": "Code",
            "map_val": "val",
        }
        chart_inputs = {"colorscale": REDS}
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        content = resp_data["chart-content"]["children"]["props"]["children"][1][
            "props"
        ]["children"]
        error_msg = (
            "'No Aggregation' is not a valid aggregation for a choropleth map!  Code contains duplicates, please "
            "select a different aggregation or additional filtering."
        )
        assert content == error_msg


@pytest.mark.unit
def test_chart_building_map_scattergeo(unittest, scattergeo_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(scattergeo_data)
        build_data_inst({c.port: df})
        inputs = {"chart_type": "maps", "agg": "raw"}
        map_inputs = {
            "map_type": "scattergeo",
            "lat": "lat",
            "lon": "lon",
            "map_val": "val",
            "scope": "world",
            "proj": "mercator",
        }
        chart_inputs = {"colorscale": REDS}
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "Map of val (No Aggregation)"},
        )

        map_inputs["map_group"] = "cat"
        group_val = str(df["cat"].values[0])
        inputs["group_val"] = [dict(cat=group_val)]
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        title = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "figure"
        ]["layout"]["title"]
        assert title["text"] == "Map of val (No Aggregation) (cat: {})".format(
            group_val
        )

        map_inputs["map_group"] = None
        inputs["group_val"] = None
        chart_inputs["animate_by"] = "cat"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

        map_inputs["map_val"] = "foo"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        error = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "children"
        ]
        assert "'foo'" in error


@pytest.mark.unit
def test_chart_building_map_mapbox(unittest, scattergeo_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(scattergeo_data)
        build_data_inst({c.port: df})
        inputs = {"chart_type": "maps", "agg": "raw"}
        map_inputs = {
            "map_type": "mapbox",
            "lat": "lat",
            "lon": "lon",
            "map_val": "val",
        }
        chart_inputs = {"colorscale": REDS}
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        chart_markup = response.get_json()["response"]["chart-content"]["children"][
            "props"
        ]["children"][1]
        unittest.assertEqual(
            chart_markup["props"]["figure"]["layout"]["title"],
            {"text": "Map of val (No Aggregation)"},
        )

        map_inputs["map_group"] = "cat"
        group_val = str(df["cat"].values[0])
        inputs["group_val"] = [dict(cat=group_val)]
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        title = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "figure"
        ]["layout"]["title"]
        assert title["text"] == "Map of val (No Aggregation) (cat: {})".format(
            group_val
        )

        map_inputs["map_group"] = None
        inputs["group_val"] = None
        chart_inputs["animate_by"] = "cat"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

        map_inputs["map_val"] = "foo"
        params = build_chart_params(c.port, inputs, chart_inputs, map_inputs=map_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        error = resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
            "children"
        ]
        assert "'foo'" in error


@pytest.mark.unit
def test_candlestick_data(candlestick_data, unittest):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(candlestick_data)
        build_data_inst({c.port: df})
        params = {
            "output": (
                "..candlestick-input-data.data...candlestick-x-dropdown.options."
                "..candlestick-open-dropdown.options...candlestick-close-dropdown.options."
                "..candlestick-high-dropdown.options...candlestick-low-dropdown.options.."
            ),
            "changedPropIds": ["candlestick-x-dropdown.value"],
            "inputs": [
                {"id": "candlestick-x-dropdown", "property": "value", "value": "x"},
                {
                    "id": "candlestick-open-dropdown",
                    "property": "value",
                    "value": "open",
                },
                {
                    "id": "candlestick-close-dropdown",
                    "property": "value",
                    "value": "close",
                },
                {
                    "id": "candlestick-high-dropdown",
                    "property": "value",
                    "value": "high",
                },
                {
                    "id": "candlestick-low-dropdown",
                    "property": "value",
                    "value": "low",
                },
                {
                    "id": "candlestick-group-dropdown",
                    "property": "value",
                    "value": ["symbol"],
                },
            ],
            "state": [{"id": "data-tabs", "property": "value", "value": c.port}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["candlestick-input-data"]["data"],
            {
                "cs_x": "x",
                "cs_open": "open",
                "cs_close": "close",
                "cs_high": "high",
                "cs_low": "low",
                "cs_group": ["symbol"],
            },
        )


@pytest.mark.unit
def test_chart_building_candlestick(candlestick_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(candlestick_data)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "candlestick",
            "agg": "mean",
        }
        chart_inputs = {}
        cs_inputs = {
            "cs_x": "x",
            "cs_open": "open",
            "cs_close": "close",
            "cs_high": "high",
            "cs_low": "low",
            "cs_group": ["symbol"],
        }
        params = build_chart_params(c.port, inputs, chart_inputs, cs_inputs=cs_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 3

        inputs["query"] = "symbol == 'a'"
        cs_inputs["cs_group"] = None
        params = build_chart_params(c.port, inputs, chart_inputs, cs_inputs=cs_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 3

        inputs["query"] = "symbol == 'c'"
        params = build_chart_params(c.port, inputs, chart_inputs, cs_inputs=cs_inputs)
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        exception = print_traceback(response, return_output=True)
        assert "found no data" in exception


@pytest.mark.unit
def test_treemap_data(treemap_data, unittest):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(treemap_data)
        build_data_inst({c.port: df})
        params = {
            "output": (
                "..treemap-input-data.data...treemap-value-dropdown.options...treemap-label-dropdown.options.."
            ),
            "changedPropIds": ["treemap-value-dropdown.value"],
            "inputs": [
                {
                    "id": "treemap-value-dropdown",
                    "property": "value",
                    "value": "volume",
                },
                {
                    "id": "treemap-label-dropdown",
                    "property": "value",
                    "value": "label",
                },
                {
                    "id": "treemap-group-dropdown",
                    "property": "value",
                    "value": ["group"],
                },
            ],
            "state": [{"id": "data-tabs", "property": "value", "value": c.port}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["treemap-input-data"]["data"],
            {
                "treemap_value": "volume",
                "treemap_label": "label",
                "treemap_group": ["group"],
            },
        )


@pytest.mark.unit
def test_chart_building_treemap(treemap_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(treemap_data)
        build_data_inst({c.port: df})
        inputs = {
            "chart_type": "treemap",
            "agg": "mean",
            "cleaners": ["drop_multispace"],
        }
        chart_inputs = {}
        treemap_inputs = {
            "treemap_value": "volume",
            "treemap_label": "label",
            "treemap_group": ["group"],
        }
        params = build_chart_params(
            c.port, inputs, chart_inputs, treemap_inputs=treemap_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        inputs["query"] = "group == 'group1'"
        treemap_inputs["treemap_group"] = None
        params = build_chart_params(
            c.port, inputs, chart_inputs, treemap_inputs=treemap_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 1

        inputs["query"] = "group == 'group3'"
        params = build_chart_params(
            c.port, inputs, chart_inputs, treemap_inputs=treemap_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        exception = print_traceback(response, return_output=True)
        assert "found no data" in exception


@pytest.mark.unit
def test_chart_building_treemap_bins(rolling_data, unittest):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(rolling_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        inputs = {
            "chart_type": "treemap",
            "agg": "mean",
            "group_type": "bins",
            "bins_val": 5,
            "bin_type": "freq",
        }
        chart_inputs = {}
        treemap_inputs = {
            "treemap_value": "1",
            "treemap_label": "2",
            "treemap_group": ["3"],
        }
        params = build_chart_params(
            c.port, inputs, chart_inputs, treemap_inputs=treemap_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        inputs["bin_type"] = "width"
        params = build_chart_params(
            c.port, inputs, chart_inputs, treemap_inputs=treemap_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        charts_div = resp_data["chart-content"]["children"][0]["props"]["children"][0][
            "props"
        ]["children"]
        links_div = charts_div["props"]["children"][0]["props"]["children"]
        url = links_div[0]["props"]["children"][0]["props"]["href"]
        assert url.startswith("/dtale/charts/{}?".format(c.port))
        url_params = dict(get_url_parser()(url.split("?")[-1]))
        group_filter = url_params.get("group_filter")
        assert group_filter is not None
        assert group_filter.startswith("`3` == '(") and group_filter.endswith("]'")
        unittest.assertEqual(
            url_params,
            {
                "agg": "mean",
                "group_type": "bins",
                "bins_val": "5",
                "bin_type": "width",
                "chart_type": "treemap",
                "cpg": "false",
                "cpy": "false",
                "group_filter": group_filter,
                "treemap_group": """["3"]""",
                "treemap_label": "2",
                "treemap_value": "1",
            },
        )
        response = c.get(url)
        assert response.status_code == 200
        [_, search_val] = url.split("?")
        assert len(search_val)


@pytest.mark.unit
def test_funnel_data(treemap_data, unittest):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(treemap_data)
        build_data_inst({c.port: df})
        params = {
            "output": (
                "..funnel-input-data.data...funnel-value-dropdown.options...funnel-label-dropdown.options."
                "..funnel-stack-input.style.."
            ),
            "changedPropIds": ["funnel-value-dropdown.value"],
            "inputs": [
                {
                    "id": "funnel-value-dropdown",
                    "property": "value",
                    "value": "volume",
                },
                {
                    "id": "funnel-label-dropdown",
                    "property": "value",
                    "value": "label",
                },
                {
                    "id": "funnel-group-dropdown",
                    "property": "value",
                    "value": ["group"],
                },
                {
                    "id": "funnel-stack-toggle",
                    "property": "on",
                    "value": False,
                },
            ],
            "state": [{"id": "data-tabs", "property": "value", "value": c.port}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["funnel-input-data"]["data"],
            {
                "funnel_value": "volume",
                "funnel_label": "label",
                "funnel_group": ["group"],
                "funnel_stacked": False,
            },
        )


@pytest.mark.unit
def test_clustergram_data(clustergram_data, unittest):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(clustergram_data)
        build_data_inst({c.port: df})
        params = {
            "output": (
                "..clustergram-input-data.data...clustergram-value-dropdown.options."
                "..clustergram-label-dropdown.options.."
            ),
            "changedPropIds": ["clustergram-value-dropdown.value"],
            "inputs": [
                {
                    "id": "clustergram-value-dropdown",
                    "property": "value",
                    "value": ["mpg", "cyl"],
                },
                {
                    "id": "clustergram-label-dropdown",
                    "property": "value",
                    "value": "model",
                },
                {
                    "id": "clustergram-group-dropdown",
                    "property": "value",
                    "value": None,
                },
            ],
            "state": [{"id": "data-tabs", "property": "value", "value": c.port}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["clustergram-input-data"]["data"],
            {
                "clustergram_value": ["mpg", "cyl"],
                "clustergram_label": "model",
            },
        )


@pytest.mark.unit
def test_chart_building_funnel(treemap_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(treemap_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        inputs = {
            "chart_type": "funnel",
            "agg": "mean",
        }
        chart_inputs = {}
        funnel_inputs = {
            "funnel_value": "volume",
            "funnel_label": "label",
            "funnel_group": ["group"],
            "funnel_stacked": False,
        }
        params = build_chart_params(
            c.port, inputs, chart_inputs, funnel_inputs=funnel_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        funnel_inputs["funnel_stacked"] = True
        params = build_chart_params(
            c.port, inputs, chart_inputs, funnel_inputs=funnel_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            len(
                resp_data["chart-content"]["children"][0]["props"]["children"][1][
                    "props"
                ]["figure"]["data"]
            )
            == 2
        )

        inputs["query"] = "group == 'group1'"
        funnel_inputs["funnel_group"] = None
        funnel_inputs["funnel_stacked"] = False
        params = build_chart_params(
            c.port, inputs, chart_inputs, funnel_inputs=funnel_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 1

        inputs["query"] = "group == 'group3'"
        params = build_chart_params(
            c.port, inputs, chart_inputs, funnel_inputs=funnel_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        exception = print_traceback(response, return_output=True)
        assert "found no data" in exception


@pytest.mark.skipif(not PY3, reason="requires python 3 or higher")
def test_chart_building_clustergram(clustergram_data):
    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(clustergram_data)
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        inputs = {
            "chart_type": "clustergram",
        }
        chart_inputs = {}
        clustergram_inputs = {
            "clustergram_value": ["_all_columns_"],
            "clustergram_label": "model",
        }
        params = build_chart_params(
            c.port, inputs, chart_inputs, clustergram_inputs=clustergram_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            resp_data["chart-content"]["children"][0]["props"]["children"][1]["props"][
                "id"
            ]
            == "chart-1"
        )

        clustergram_inputs["clustergram_value"] = ["mpg"]
        params = build_chart_params(
            c.port, inputs, chart_inputs, clustergram_inputs=clustergram_inputs
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        exception = print_traceback(response, return_output=True)
        assert "Please select at least 2 values for clustergram." in exception


@pytest.mark.unit
def test_load_chart_error():
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            build_data_inst({c.port: df})

            def build_base_chart_mock(
                raw_data,
                x,
                y,
                group_col=None,
                agg=None,
                allow_duplicates=False,
                **kwargs
            ):
                raise Exception("error test")

            stack.enter_context(
                mock.patch(
                    "dtale.dash_application.charts.build_base_chart",
                    side_effect=build_base_chart_mock,
                )
            )
            inputs = {
                "chart_type": "line",
                "x": "a",
                "y": ["b"],
                "z": None,
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
            }
            chart_inputs = {
                "cpg": False,
                "cpy": False,
                "barmode": "group",
                "barsort": None,
            }
            params = build_chart_params(
                c.port, inputs=inputs, chart_inputs=chart_inputs
            )
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]["chart-content"]["children"]
            assert (
                resp_data["props"]["children"][1]["props"]["children"] == "error test"
            )


@pytest.mark.unit
def test_display_error():
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack() as stack:
            df, _ = views.format_data(df)
            build_data_inst({c.port: df})
            stack.enter_context(
                mock.patch(
                    "dtale.dash_application.components.Wordcloud",
                    mock.Mock(side_effect=Exception("error test")),
                )
            )
            inputs = {
                "chart_type": "wordcloud",
                "x": "a",
                "y": ["b"],
                "z": None,
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
            }
            chart_inputs = {
                "cpg": False,
                "cpy": False,
                "barmode": "group",
                "barsort": None,
            }
            params = build_chart_params(
                c.port, inputs=inputs, chart_inputs=chart_inputs
            )
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]["chart-content"]["children"]
            assert (
                resp_data["props"]["children"][1]["props"]["children"] == "error test"
            )


@pytest.mark.unit
def test_build_axes(unittest):
    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[1, 2, 3],
            c=[4, 5, 6],
            d=[8, 9, 10],
            e=[11, 12, 13],
            f=[14, 15, 16],
        )
    )
    build_data_inst({1: df})
    y = ["b", "c", "d"]
    yaxis_data = dict(
        type="multi",
        data=dict(b=dict(min=1, max=4), c=dict(min=5, max=7), d=dict(min=8, max=10)),
    )
    chart_data = dict(
        data=dict(all=dict(x=[1, 2, 3], b=[1, 2, 3], c=[4, 5, 6], d=[8, 9, 10])),
        min=dict(b=2, c=5, d=8),
        max=dict(b=4, c=6, d=10),
    )
    axes = build_axes(chart_data, "a", yaxis_data)(y)
    unittest.assertEqual(
        axes,
        (
            {
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis2": {
                    "title": "c",
                    "overlaying": "y",
                    "side": "right",
                    "anchor": "x",
                    "range": [5, 7],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis3": {
                    "title": "d",
                    "overlaying": "y",
                    "side": "left",
                    "anchor": "free",
                    "position": 0.05,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "xaxis": {"domain": [0.1, 1], "tickformat": "0:g", "title": "a"},
            },
            True,
        ),
    )

    y.append("e")
    yaxis_data["data"]["e"] = dict(min=11, max=13)
    chart_data["data"]["all"]["e"] = [11, 12, 13]
    chart_data["min"]["e"] = 11
    chart_data["max"]["e"] = 13
    axes = build_axes(chart_data, "a", yaxis_data)(y)
    unittest.assertEqual(
        axes,
        (
            {
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis2": {
                    "title": "c",
                    "overlaying": "y",
                    "side": "right",
                    "anchor": "x",
                    "range": [5, 7],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis3": {
                    "title": "d",
                    "overlaying": "y",
                    "side": "left",
                    "anchor": "free",
                    "position": 0.05,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis4": {
                    "title": "e",
                    "overlaying": "y",
                    "side": "right",
                    "anchor": "free",
                    "position": 0.95,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "xaxis": {
                    "domain": [0.1, 0.8999999999999999],
                    "tickformat": "0:g",
                    "title": "a",
                },
            },
            True,
        ),
    )

    y.append("f")
    yaxis_data["data"]["f"] = dict(min=14, max=17)
    chart_data["data"]["all"]["f"] = [14, 15, 16]
    chart_data["min"]["f"] = 14
    chart_data["max"]["f"] = 17
    axes = build_axes(chart_data, "a", yaxis_data)(y)
    unittest.assertEqual(
        axes,
        (
            {
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis2": {
                    "title": "c",
                    "overlaying": "y",
                    "side": "right",
                    "anchor": "x",
                    "range": [5, 7],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis3": {
                    "title": "d",
                    "overlaying": "y",
                    "side": "left",
                    "anchor": "free",
                    "position": 0.05,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis4": {
                    "title": "e",
                    "overlaying": "y",
                    "side": "right",
                    "anchor": "free",
                    "position": 0.95,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "yaxis5": {
                    "title": "f",
                    "overlaying": "y",
                    "side": "left",
                    "anchor": "free",
                    "position": 0.1,
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "xaxis": {
                    "domain": [0.15000000000000002, 0.8999999999999999],
                    "tickformat": "0:g",
                    "title": "a",
                },
            },
            True,
        ),
    )

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[1, 2, 3], c=[4, 5, 6]))
    build_data_inst({1: df})

    y = ["b"]
    yaxis_data = dict(
        type="multi",
        data={
            "b": dict(min=1, max=4),
            "c|corr": dict(min=5, max=7),
            "d": dict(min=8, max=10),
        },
    )
    chart_data = dict(
        data=dict(all={"x": [1, 2, 3], "b": [1, 2, 3], "c|corr": [4, 5, 6]}),
        min={"b": 2, "c|corr": 5, "d": 8},
        max={"b": 4, "c|corr": 6, "d": 10},
    )
    axes = build_axes(chart_data, "a", yaxis_data, z="c|corr")(y)
    unittest.assertEqual(
        axes,
        (
            {
                "xaxis": {"title": "a", "tickformat": "0:g"},
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "zaxis": {"title": "Correlation of c", "tickformat": "0:g"},
            },
            False,
        ),
    )
    axes = build_axes(chart_data, "a", yaxis_data, z="c|corr")(y)
    unittest.assertEqual(
        axes,
        (
            {
                "xaxis": {"title": "a", "tickformat": "0:g"},
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
                "zaxis": {"title": "Correlation of c", "tickformat": "0:g"},
            },
            False,
        ),
    )
    axes = build_axes(chart_data, "a", yaxis_data)(y)
    unittest.assertEqual(
        axes,
        (
            {
                "xaxis": {"title": "a", "tickformat": "0:g"},
                "yaxis": {
                    "title": "b",
                    "range": [1, 4],
                    "tickformat": "0:g",
                    "type": "linear",
                },
            },
            False,
        ),
    )
    yaxis_data["type"] = "single"
    axes = build_axes(chart_data, "a", yaxis_data)(y)
    unittest.assertEqual(
        axes,
        (
            {
                "xaxis": {"title": "a", "tickformat": "0:g"},
                "yaxis": {
                    "tickformat": "0:g",
                    "title": "b",
                    "type": "linear",
                },
            },
            False,
        ),
    )


@pytest.mark.unit
def test_build_figure_data():
    assert build_figure_data("/dtale/charts/1", x=None)[0] is None
    assert (
        build_figure_data("/dtale/charts/1", x="a", y=["b"], chart_type="heatmap")[0]
        is None
    )
    build_data_inst({1: pd.DataFrame([dict(a=1, b=2, c=3)])})
    with pytest.raises(BaseException):
        build_figure_data(
            "/dtale/charts/1", query="d == 4", x="a", y=["b"], chart_type="line"
        )


@pytest.mark.unit
def test_chart_wrapper(unittest):
    assert chart_wrapper("1", None)("foo") == "foo"
    url_params = dict(
        chart_type="line",
        y=["b", "c"],
        yaxis={"b": {"min": 3, "max": 6}, "d": {"min": 7, "max": 10}},
        agg="rolling",
        window=10,
        rolling_calc="corr",
    )
    cw = chart_wrapper("1", dict(min={"b": 4}, max={"b": 6}), url_params)
    output = cw("foo")
    url_params = chart_url_params(
        "?{}".format(output.children[0].children[0].children[0].href.split("?")[-1])
    )
    unittest.assertEqual(
        url_params,
        {
            "chart_type": "line",
            "agg": "rolling",
            "window": 10,
            "cpg": False,
            "cpy": False,
            "y": ["b", "c"],
            "yaxis": {"b": {"min": 3, "max": 6}},
            "animate": False,
        },
    )

    url_params = dict(
        chart_type="bar",
        y=["b", "c"],
        yaxis={"b": {"min": 3, "max": 6}, "d": {"min": 7, "max": 10}},
        agg="rolling",
        window=10,
        rolling_calc="corr",
        animate_by="d",
    )
    cw = chart_wrapper("1", dict(min={"b": 4}, max={"b": 6}), url_params)
    output = cw("foo")
    url_params = chart_url_params(
        "?{}".format(output.children[0].children[0].children[0].href.split("?")[-1])
    )
    unittest.assertEqual(
        url_params,
        {
            "chart_type": "bar",
            "agg": "rolling",
            "window": 10,
            "cpg": False,
            "cpy": False,
            "y": ["b", "c"],
            "yaxis": {"b": {"min": 3, "max": 6}},
            "animate_by": "d",
        },
    )


@pytest.mark.unit
def test_build_spaced_ticks(unittest):
    ticks = range(50)
    cfg = build_spaced_ticks(ticks)
    assert cfg["nticks"] == 26


@pytest.mark.unit
def test_wordcloud():
    with pytest.raises(TypeError) as error:
        Wordcloud("foo", {}, y="b", invalid_arg="blah")
    assert (
        'The `Wordcloud` component with the ID "foo" received an unexpected keyword argument: `invalid_arg`'
    ) in str(error)

    with pytest.raises(TypeError) as error:
        Wordcloud(data={}, y="b", invalid_arg="blah")
    assert "Required argument `id` was not specified." in str(error)


@pytest.mark.unit
def test_build_chart_type():
    from dtale.dash_application.charts import build_chart

    import dtale.views as views

    with app.test_client() as c:
        df, _ = views.format_data(
            pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
        )
        build_data_inst({c.port: df})
        output = build_chart(c.port, chart_type="unknown", x="a", y="b")
        assert output[0].children[1].children == "chart type: unknown"


@pytest.mark.unit
def test_update_label_for_freq(unittest):
    unittest.assertEqual(
        update_label_for_freq_and_agg(["date|WD", "date|D", "foo"]),
        "date (Weekday), date, foo",
    )


@pytest.mark.unit
def test_chart_url_params_w_group_filter(unittest):
    from dtale.dash_application.charts import chart_url_params, chart_url_querystring

    querystring = chart_url_querystring(
        dict(
            chart_type="bar",
            x="foo",
            y=["bar"],
            group=["baz"],
            group_val=[dict(baz="bizzle")],
            animate_by="bonk",
            colorscale="",
        ),
        group_filter=dict(group="baz == 'bizzle'"),
    )
    parsed_params = chart_url_params(querystring)
    unittest.assertEqual(
        parsed_params,
        {
            "chart_type": "bar",
            "x": "foo",
            "cpg": False,
            "cpy": False,
            "y": ["bar"],
            "group": ["baz"],
            "group_val": [{"baz": "bizzle"}],
            "query": "baz == 'bizzle'",
            "animate_by": "bonk",
        },
    )

    querystring = chart_url_querystring(
        dict(
            chart_type="bar",
            x="foo",
            y=["bar"],
            group=["baz"],
            bins_val=3,
            bin_type="width",
            animate_by="bonk",
        ),
        group_filter=dict(group="baz == '(0.5,0.75]'"),
    )
    parsed_params = chart_url_params(querystring)
    unittest.assertEqual(
        parsed_params,
        {
            "chart_type": "bar",
            "x": "foo",
            "cpg": False,
            "cpy": False,
            "y": ["bar"],
            "bins_val": "3",
            "bin_type": "width",
            "query": "(0.5 <= baz <= 0.75)",
            "animate_by": "bonk",
        },
    )


@pytest.mark.unit
def test_build_series_name():
    from dtale.dash_application.charts import build_series_name

    handler = build_series_name(["foo", "bar"], chart_per_group=False)
    assert handler("foo", "bizz")["name"] == "bizz/foo"


@pytest.mark.unit
def test_build_loc_mode_hover_children():
    from dtale.dash_application.layout.layout import build_loc_mode_hover_children

    hover = build_loc_mode_hover_children("ISO-3")
    assert len(hover[1].children) == 2
    hover = build_loc_mode_hover_children("geojson-id")
    assert len(hover[1].children) == 1


@pytest.mark.unit
def test_chart_url_params():
    from dtale.dash_application.charts import chart_url_querystring, chart_url_params
    from dtale.dash_application.layout.layout import REDS

    def test_parsing(params):
        search = chart_url_querystring(params)
        parsed_params = chart_url_params(search)
        for k in params:
            assert parsed_params[k] == params[k]

    params = dict(chart_type="3d_scatter", x="x", y=["y"], z="z", colorscale=REDS)
    test_parsing(params)

    params = dict(
        chart_type="candlestick",
        cs_x="x",
        cs_close="close",
        cs_open="open",
        cs_high="high",
        cs_low="low",
        cs_group=["group"],
    )
    test_parsing(params)

    params = dict(
        chart_type="treemap",
        treemap_value="x",
        treemap_label="y",
        treemap_group=["group"],
    )
    test_parsing(params)


@pytest.mark.unit
def test_load_style(unittest):
    with app.test_client() as c:
        params = build_dash_request(
            "load-btn.style",
            "auto-load-toggle.on",
            {"id": "auto-load-toggle", "property": "on", "value": False},
            [],
        )
        del params["state"]
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(resp_data, {"load-btn": {"style": {"display": "block"}}})
