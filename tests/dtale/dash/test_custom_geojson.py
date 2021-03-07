import base64
import json

import mock
import os
import pandas as pd
import pytest

from tests import ExitStack
from tests.dtale import build_data_inst
from tests.dtale.dash.test_dash import build_chart_params
from tests.dtale.test_views import app


def build_geojson_data(
    fname=os.path.join(os.path.dirname(__file__), "../..", "data/USA.json")
):
    with open(fname, "r") as f:
        data = f.read()
    data = json.loads(data)
    data = json.dumps(data)
    data = base64.b64encode(data.encode("utf-8"))
    return "," + data.decode("utf-8")


@pytest.mark.unit
def test_update_geojson():
    with app.test_client() as c:
        with ExitStack() as stack:
            custom_geojson_data = []
            build_data_inst({c.port: None})
            stack.enter_context(
                mock.patch(
                    "dtale.dash_application.custom_geojson.CUSTOM_GEOJSON",
                    custom_geojson_data,
                )
            )
            params = {
                "output": "..output-geojson-upload.children...geojson-dropdown.options..",
                "changedPropIds": ["upload-geojson.content"],
                "inputs": [
                    {
                        "id": "upload-geojson",
                        "property": "content",
                        "value": build_geojson_data(),
                    }
                ],
                "state": [
                    {
                        "id": "upload-geojson",
                        "property": "filename",
                        "value": "USA.json",
                    }
                ],
            }
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert resp_data["output-geojson-upload"]["children"] == "USA uploaded!"
            assert resp_data["geojson-dropdown"]["options"] == [
                {"label": "USA", "value": "USA"}
            ]
            assert len(custom_geojson_data) == 1
            assert custom_geojson_data[0]["key"] == "USA"

            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert resp_data["output-geojson-upload"]["children"] == "USA2 uploaded!"
            assert resp_data["geojson-dropdown"]["options"][-1] == {
                "label": "USA2",
                "value": "USA2",
            }
            assert len(custom_geojson_data) == 2
            assert custom_geojson_data[-1]["key"] == "USA2"

            africa_fname = "/../../../".join(
                [os.path.dirname(__file__), "dtale/static/maps/africa_110m.json"]
            )
            africa_data = build_geojson_data(fname=africa_fname)
            params["inputs"][0]["value"] = africa_data
            params["state"][0]["value"] = "africa_110m.json"
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert (
                resp_data["output-geojson-upload"]["children"]
                == "africa_110m uploaded!"
            )
            assert resp_data["geojson-dropdown"]["options"][-1] == {
                "label": "africa_110m",
                "value": "africa_110m",
            }
            assert len(custom_geojson_data) == 3
            assert custom_geojson_data[-1]["key"] == "africa_110m"
            assert custom_geojson_data[-1].get("properties") is None

            params["state"][0]["value"] = None
            response = c.post("/dtale/charts/_dash_update-component", json=params)
            assert response.status_code == 405

            params["state"][0]["value"] = "USA.json"
            params["inputs"][0]["value"] = None
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert (
                resp_data["output-geojson-upload"]["children"]
                == "'NoneType' object has no attribute 'split'"
            )


@pytest.mark.unit
def test_update_featureidkey_options():
    with app.test_client() as c:
        with ExitStack() as stack:
            custom_geojson_data = [
                dict(
                    key="test",
                    type="FeatureCollection",
                    properties=["foo", "bar", "baz"],
                ),
                dict(key="test2", type="Topology"),
            ]
            stack.enter_context(
                mock.patch(
                    "dtale.dash_application.custom_geojson.CUSTOM_GEOJSON",
                    custom_geojson_data,
                )
            )
            params = {
                "output": (
                    "..featureidkey-dropdown.options...featureidkey-dropdown.disabled..."
                    "featureidkey-dropdown.placeholder.."
                ),
                "changedPropIds": ["geojson-dropdown.value"],
                "inputs": [
                    {"id": "geojson-dropdown", "property": "content", "value": "test"}
                ],
            }
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert resp_data["featureidkey-dropdown"]["options"] == [
                {"label": "foo", "value": "foo"},
                {"label": "bar", "value": "bar"},
                {"label": "baz", "value": "baz"},
            ]

            params["inputs"][0]["value"] = "test2"
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert resp_data["featureidkey-dropdown"]["options"] == []
            assert resp_data["featureidkey-dropdown"]["disabled"]
            assert resp_data["featureidkey-dropdown"]["placeholder"] == "id"

            params["inputs"][0]["value"] = "missing"
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            resp_data = response.get_json()["response"]
            assert resp_data["featureidkey-dropdown"]["options"] == []


@pytest.mark.unit
def test_toggle_modal():
    with app.test_client() as c:
        params = {
            "output": "geojson-modal.is_open",
            "changedPropIds": ["geojson-dropdown.value"],
            "inputs": [
                {"id": "open-geojson-modal", "property": "n_clicks", "value": 0},
                {"id": "close-geojson-modal", "property": "n_clicks", "value": 0},
            ],
            "state": [{"id": "geojson-modal", "property": "is_open", "value": True}],
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["geojson-modal"]["is_open"]

        params["inputs"][0]["value"] = 1
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert not resp_data["geojson-modal"]["is_open"]

        params["state"][0]["value"] = False
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert resp_data["geojson-modal"]["is_open"]


@pytest.mark.unit
def test_building_choropleth_map_w_custom_geojson(unittest):
    import dtale.views as views

    df = pd.DataFrame(
        [
            dict(id="US.MA", name="mass", pop=125),
            dict(id="US.WA", name="wash", pop=500),
            dict(id="US.CA", name="cali", pop=1000),
        ]
    )

    with app.test_client() as c:
        with ExitStack() as stack:
            custom_geojson_data = []
            stack.enter_context(
                mock.patch(
                    "dtale.dash_application.custom_geojson.CUSTOM_GEOJSON",
                    custom_geojson_data,
                )
            )
            params = {
                "output": "..output-geojson-upload.children...geojson-dropdown.options..",
                "changedPropIds": ["upload-geojson.content"],
                "inputs": [
                    {
                        "id": "upload-geojson",
                        "property": "content",
                        "value": build_geojson_data(),
                    }
                ],
                "state": [
                    {
                        "id": "upload-geojson",
                        "property": "filename",
                        "value": "USA.json",
                    }
                ],
            }
            c.post("/dtale/charts/_dash-update-component", json=params)

            df, _ = views.format_data(df)
            build_data_inst({c.port: df})
            inputs = {"chart_type": "maps", "agg": "raw"}
            map_inputs = {
                "map_type": "choropleth",
                "loc_mode": "geojson-id",
                "geojson": "USA",
                "featureidkey": "HASC_1",
                "loc": "id",
                "map_val": "pop",
            }
            chart_inputs = {"colorscale": "Reds"}
            params = build_chart_params(
                c.port, inputs, chart_inputs, map_inputs=map_inputs
            )
            response = c.post("/dtale/charts/_dash-update-component", json=params)
            chart_markup = response.get_json()["response"]["chart-content"]["children"][
                "props"
            ]["children"][1]
            unittest.assertEqual(
                chart_markup["props"]["figure"]["layout"]["title"],
                {"text": "Map of pop (No Aggregation)"},
            )
