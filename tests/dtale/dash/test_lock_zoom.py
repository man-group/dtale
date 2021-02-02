import pytest

from tests.dtale.dash.test_dash import build_dash_request
from tests.dtale.test_views import app


@pytest.mark.unit
def test_lock_zoom(unittest):
    with app.test_client() as c:
        fig_data_outputs = "chart-1.figure"
        params = build_dash_request(
            fig_data_outputs,
            "lock-zoom-btn.n_clicks",
            [{"id": "lock-zoom-btn", "property": "n_clicks", "value": 0}],
            [
                {"id": "chart-1", "property": "relayoutData", "value": {}},
                {"id": "chart-1", "property": "figure", "value": {}},
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204

        params["inputs"][0]["value"] = 1
        camera = {
            "center": {"x": 0, "y": 0, "z": 0},
            "eye": {
                "x": 1.5790423078962952,
                "y": -1.4712784852280218,
                "z": 0.17165374676562864,
            },
            "projection": {"type": "perspective"},
            "up": {"x": 0, "y": 0, "z": 1},
        }
        params["state"][0]["value"] = {"scene.camera": camera}
        chart_data = {
            "customdata": ["99"],
            "opacity": 0.7,
            "type": "scatter3d",
            "x": ["mle"],
            "y": [24],
            "z": [23.12345],
        }
        params["state"][1]["value"] = {
            "data": [chart_data],
            "id": "chart-1",
            "layout": {
                "scene": {
                    "xaxis": {"title": {"text": "dsp_name"}, "type": "category"},
                    "yaxis": {
                        "tickformat": ".0f",
                        "title": {"text": "ref_range_m"},
                        "type": "linear",
                    },
                    "zaxis": {"title": {"text": "ranges (Mean)"}, "type": "linear"},
                }
            },
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        unittest.assertEqual(
            response.get_json()["response"]["chart-1"]["figure"]["layout"]["scene"][
                "camera"
            ],
            camera,
        )
