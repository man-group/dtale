import pandas as pd
import pytest

from tests import ExitStack
from tests.dtale import build_data_inst
from tests.dtale.test_views import app
from tests.dtale.dash.test_dash import ts_builder


@pytest.mark.unit
def test_build_saved_header(unittest):
    from dtale.dash_application.saved_charts import build_saved_header

    config = {
        "data_id": "1",
        "chart_type": "heatmap",
        "query": "test_query",
        "agg": "sum",
        "group": ["group"],
        "x": "x",
        "y": ["y1", "y2"],
        "z": "z",
        "group_type": "raw",
        "groups": ["group1", "group2"],
        "cpg": True,
        "cpy": True,
        "animate_by": "animate_by",
    }
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 65

    config["chart_type"] = "scatter"
    config["trendline"] = True
    config["group_type"] = "bins"
    config["bin_type"] = "width"
    config["bin_val"] = 5
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 65

    config["chart_type"] = "maps"
    config["map_group"] = "group"
    config["map_type"] = "scattergeo"
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 60

    config["map_type"] = "mapbox"
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 60

    config["map_type"] = "choropleth"
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 60

    config["chart_type"] = "candlestick"
    config["cs_group"] = "group"
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 50

    config["chart_type"] = "treemap"
    config["treemap_group"] = "group"
    header = build_saved_header(config)
    assert len(header.children[1].children[1]) == 50


@pytest.mark.unit
def test_save_chart(unittest):
    from dtale.dash_application.saved_charts import SAVED_CHART_IDS

    config_ids = "...".join(
        ["saved-chart-config-{}.data".format(i) for i in SAVED_CHART_IDS]
    )
    delete_ids = "...".join(
        ["saved-deletes-{}.data".format(i) for i in SAVED_CHART_IDS]
    )
    delete_clicks = [
        dict(id="delete-saved-btn-{}".format(i), property="n_clicks", value=None)
        for i in SAVED_CHART_IDS
    ]
    configs = [
        dict(id="saved-chart-config-{}".format(i), property="data", value=None)
        for i in SAVED_CHART_IDS
    ]
    deletes = [
        dict(id="saved-deletes-{}".format(i), property="data", value=None)
        for i in SAVED_CHART_IDS
    ]
    with app.test_client() as c:
        params = {
            "output": "..save-clicks.data...{}...{}..".format(config_ids, delete_ids),
            "changedPropIds": ["collapse-data-btn.n_clicks"],
            "inputs": [
                {"id": "save-btn", "property": "n_clicks", "value": 1},
            ]
            + delete_clicks,
            "state": [
                {"id": "input-data", "property": "data", "value": {}},
                {"id": "chart-input-data", "property": "data", "value": {}},
                {"id": "yaxis-data", "property": "data", "value": {}},
                {"id": "map-input-data", "property": "data", "value": {}},
                {"id": "candlestick-input-data", "property": "data", "value": {}},
                {"id": "treemap-input-data", "property": "data", "value": {}},
                {"id": "save-clicks", "property": "data", "value": 0},
            ]
            + configs
            + deletes,
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.status_code == 204

        input_data = {
            "data_id": str(c.port),
            "chart_type": "line",
            "agg": "sum",
            "x": "a",
            "y": ["b"],
            "yaxis": {},
        }
        params["state"][0]["value"] = input_data
        params["inputs"][0]["value"] = 1
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.status_code == 200
        response = response.json["response"]
        unittest.assertEqual(input_data, response["saved-chart-config-1"]["data"])

        params["inputs"][0]["value"] = 1
        params["inputs"][1]["value"] = 1
        params["state"][6]["value"] = 1
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.json["response"]
        unittest.assertEqual(None, response["saved-chart-config-1"]["data"])


@pytest.mark.unit
def test_load_saved_chart(unittest):
    import dtale.views as views

    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6], c=[7, 8, 9]))
    with app.test_client() as c:
        with ExitStack():
            df, _ = views.format_data(df)
            build_data_inst({c.port: df})

            input_data = {
                "data_id": str(c.port),
                "query": None,
                "chart_type": "line",
                "agg": "sum",
                "x": "a",
                "y": ["b"],
                "yaxis": {},
                "cpg": False,
                "cpy": False,
                "animate": False,
                "trendline": False,
            }
            params = {
                "output": (
                    "..saved-chart-div-1.style...saved-chart-1.children...prev-saved-chart-config-1.data."
                    "..saved-chart-header-1.children.."
                ),
                "inputs": [ts_builder("saved-chart-config-1")],
                "state": [
                    {
                        "id": "saved-chart-config-1",
                        "property": "data",
                        "value": input_data,
                    },
                    {
                        "id": "prev-saved-chart-config-1",
                        "property": "data",
                        "value": None,
                    },
                ],
            }
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            response = response.json["response"]
            assert response["saved-chart-div-1"]["style"]["display"] == "block"

            params["state"][1]["value"] = input_data
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            assert response.status_code == 204

            params["state"][0]["value"] = None
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            response = response.json["response"]
            assert response["saved-chart-div-1"]["style"]["display"] == "none"
