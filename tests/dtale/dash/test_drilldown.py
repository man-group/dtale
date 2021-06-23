import pandas as pd
import pytest

from tests.dtale import build_data_inst
from tests.dtale.dash.test_dash import (
    build_dash_request,
    print_traceback,
    ts_builder,
)
from tests.dtale.test_views import app


@pytest.mark.unit
def test_toggle_modal():
    with app.test_client() as c:
        fig_data_outputs = "drilldown-modal-1.is_open"
        inputs = {
            "id": "input-data",
            "property": "data",
            "value": {
                "chart_type": "scatter3d",
                "x": "a",
                "y": ["b"],
                "z": "c",
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
                "animate_by": "date",
            },
        }
        params = build_dash_request(
            fig_data_outputs,
            "chart-1.clickData",
            [
                {
                    "id": "close-drilldown-modal-1",
                    "property": "n_clicks",
                    "value": None,
                },
                {
                    "id": "close-drilldown-modal-header-1",
                    "property": "n_clicks",
                    "value": None,
                },
                {"id": "chart-1", "property": "clickData", "value": None},
            ],
            [
                {"id": "drilldown-modal-1", "property": "is_open", "value": False},
                inputs,
                {"id": "drilldown-toggle", "property": "on", "value": False},
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][-1]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][1]["value"]["agg"] = "mean"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert not response.get_json()["response"]["drilldown-modal-1"]["is_open"]
        params["inputs"][-1]["value"] = {"points": []}
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json()["response"]["drilldown-modal-1"]["is_open"]


@pytest.mark.unit
def test_build_x_dropdown():
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[4, 5, 6],
            c=[7, 8, 9],
            d=pd.date_range("20200101", "20200103"),
            e=[10, 11, 12],
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        fig_data_outputs = (
            "..drilldown-x-dropdown-1.options...drilldown-x-dropdown-1.value.."
        )
        inputs = {
            "id": "input-data",
            "property": "data",
            "value": {
                "data_id": c.port,
                "chart_type": "scatter3d",
                "x": "a",
                "y": ["b"],
                "z": "c",
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
                "animate_by": "date",
            },
        }
        params = build_dash_request(
            fig_data_outputs,
            "chart-1.clickData",
            {"id": "drilldown-modal-1", "property": "is_open", "value": False},
            [
                inputs,
                {
                    "id": "chart-input-data",
                    "property": "data",
                    "value": {"cpg": False, "barmode": "group", "barsort": None},
                },
                {"id": "yaxis-data", "property": "data", "value": {}},
                {"id": "map-input-data", "property": "data", "value": {}},
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["inputs"][0]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.get_json()["response"]["drilldown-x-dropdown-1"]
        assert len(response["options"]) == 12
        assert response["options"][0] == {"label": "__index__", "value": "__index__"}
        assert response["options"][-1] == {"label": "e", "value": "e"}
        assert response["value"] == "a"

        params["state"][1]["value"]["chart_type"] = "maps"
        params["state"][-1]["value"] = {
            "map_type": "choropleth",
            "loc": "a",
            "map_val": "b",
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json()["response"]["drilldown-x-dropdown-1"]["value"] == "a"

        params["state"][-1]["value"] = {
            "map_type": "scattergeo",
            "lat": "a",
            "lon": "b",
            "map_val": "c",
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert (
            response.get_json()["response"]["drilldown-x-dropdown-1"]["value"]
            == "lat_lon"
        )


@pytest.mark.unit
def test_update_click_data():
    import dtale.views as views

    df = pd.DataFrame(
        dict(
            a=[1, 2, 3],
            b=[4, 5, 6],
            c=[7, 8, 9],
            e=[10, 11, 12],
            d=pd.date_range("20200101", "20200103"),
        )
    )
    with app.test_client() as c:
        df, _ = views.format_data(df)
        build_data_inst({c.port: df})
        fig_data_outputs = (
            "..chart-click-data-1.data...drilldown-modal-header-1.children.."
        )
        inputs = {
            "id": "input-data",
            "property": "data",
            "value": {
                "data_id": c.port,
                "chart_type": "scatter3d",
                "x": "a",
                "y": ["b"],
                "z": "c",
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
                "animate_by": "date",
            },
        }
        params = build_dash_request(
            fig_data_outputs,
            "chart-1.clickData",
            {"id": "chart-1", "property": "clickData", "value": None},
            [
                inputs,
                {
                    "id": "chart-input-data",
                    "property": "data",
                    "value": {"cpg": False, "barmode": "group", "barsort": None},
                },
                {"id": "yaxis-data", "property": "data", "value": {}},
                {"id": "map-input-data", "property": "data", "value": {}},
                {"id": "chart-click-data-1", "property": "data", "value": {}},
                {"id": "drilldown-toggle", "property": "on", "value": False},
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][-1]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][0]["value"]["agg"] = "mean"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204

        # Scatter 3D
        params["inputs"][0]["value"] = {
            "points": [{"x": "x", "y": "y", "z": "z", "customdata": "customdata"}]
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        header = response.get_json()["response"]["drilldown-modal-header-1"]["children"]
        assert header == "Drilldown for: date (customdata), a (x), b (y), Mean c (z)"

        # Heatmap Animation
        params["inputs"][0]["value"] = {
            "points": [
                {
                    "x": "x",
                    "y": "y",
                    "z": "z",
                    "text": "date: date<br>x: x<br>y: y<br>z: z",
                }
            ]
        }
        params["state"][0]["value"]["chart_type"] = "heatmap"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        header = response.get_json()["response"]["drilldown-modal-header-1"]["children"]
        assert header == "Drilldown for: date (date), x (x), y (y), z (z)"

        # Choropleth
        params["inputs"][0]["value"] = {
            "points": [{"location": "x", "z": "z", "customdata": "customdata"}]
        }
        params["state"][0]["value"]["chart_type"] = "maps"
        params["state"][-3]["value"] = {
            "map_type": "choropleth",
            "loc": "b",
            "map_val": "c",
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        header = response.get_json()["response"]["drilldown-modal-header-1"]["children"]
        assert header == "Drilldown for: date (customdata), b (x), Mean c (z)"

        # Scattergeo
        params["inputs"][0]["value"] = {
            "points": [{"lat": "x", "lon": "y", "z": "z", "customdata": "customdata"}]
        }
        params["state"][0]["value"]["chart_type"] = "maps"
        params["state"][-3]["value"] = {
            "map_type": "scattergeo",
            "lat": "b",
            "lon": "e",
            "map_val": "c",
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        header = response.get_json()["response"]["drilldown-modal-header-1"]["children"]
        assert header == "Drilldown for: date (customdata), b (x), e (y), Mean c (z)"


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_load_drilldown_content(custom_data):
    import dtale.views as views

    with app.test_client() as c:
        custom_data.loc[:, "Col4"] = 4
        df, _ = views.format_data(custom_data)
        build_data_inst({c.port: df})
        fig_data_outputs = (
            "..drilldown-content-1.children...drilldown-x-input-1.style.."
        )
        inputs = {
            "id": "input-data",
            "property": "data",
            "value": {
                "data_id": c.port,
                "chart_type": "bar",
                "x": "security_id",
                "y": ["Col0"],
                "z": None,
                "group": None,
                "agg": None,
                "window": None,
                "rolling_comp": None,
                "animate_by": "date",
            },
        }
        params = build_dash_request(
            fig_data_outputs,
            "chart-click-data-1.modified_timestamp",
            [
                ts_builder("chart-click-data-1"),
                {
                    "id": "drilldown-chart-type-1",
                    "property": "value",
                    "value": None,
                },
                {
                    "id": "drilldown-x-dropdown-1",
                    "property": "value",
                    "value": None,
                },
            ],
            [
                inputs,
                {
                    "id": "chart-input-data",
                    "property": "data",
                    "value": {"cpg": False, "barmode": "group", "barsort": None},
                },
                {"id": "yaxis-data", "property": "data", "value": {}},
                {"id": "map-input-data", "property": "data", "value": {}},
                {"id": "chart-click-data-1", "property": "data", "value": {}},
                {"id": "drilldown-toggle", "property": "on", "value": False},
            ],
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][-1]["value"] = True
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["state"][0]["value"]["agg"] = "mean"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert response.get_json() is None
        assert response.status_code == 204
        params["inputs"][-1]["value"] = "security_id"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        response = response.get_json()["response"]
        assert response["drilldown-content-1"]["children"] is None
        assert response["drilldown-x-input-1"]["style"]["display"] == "none"
        params["state"][-2]["value"] = {
            "points": [
                {
                    "x": 100000,
                    "y": 1.23,
                    "customdata": pd.Timestamp(df.date.values[0]).strftime("%Y%m%d"),
                }
            ]
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        exception = print_traceback(
            response, chart_key="drilldown-content-1", return_output=True
        )
        assert "NotImplementedError: chart type: None" in exception
        params["inputs"][-2]["value"] = "histogram"
        response = c.post("/dtale/charts/_dash-update-component", json=params)

        def _chart_title(resp, histogram=False):
            if histogram:
                return resp.get_json()["response"]["drilldown-content-1"]["children"][
                    "props"
                ]["figure"]["layout"]["title"]["text"]
            return resp.get_json()["response"]["drilldown-content-1"]["children"][
                "props"
            ]["children"][1]["props"]["figure"]["layout"]["title"]["text"]

        assert _chart_title(response, True) == "Histogram of Col0 (1 data points)"
        params["inputs"][-2]["value"] = "bar"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response) == "Col0 by security_id"

        params["inputs"][-2]["value"] = "histogram"
        params["state"][0]["value"]["chart_type"] = "3d_scatter"
        params["state"][0]["value"]["y"] = "Col4"
        params["state"][0]["value"]["z"] = "Col0"
        params["state"][-2]["value"]["points"][0]["y"] = 4
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response, True) == "Histogram of Col0 (1 data points)"
        params["inputs"][-2]["value"] = "bar"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response) == "Col0 by security_id"

        params["inputs"][-2]["value"] = "histogram"
        params["state"][0]["value"]["chart_type"] = "heatmap"
        date_val = pd.Timestamp(
            df[(df.security_id == 100000) & (df.Col4 == 4)].date.values[0]
        ).strftime("%Y%m%d")
        params["state"][-2]["value"] = {
            "points": [
                {
                    "x": 100000,
                    "y": 4,
                    "z": 1,
                    "text": "date: {}<br>security_id: 100000<br>Col4: 4<br>Col0: 1".format(
                        date_val
                    ),
                    "customdata": date_val,
                }
            ]
        }
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response, True) == "Histogram of Col0 (1 data points)"
        params["inputs"][-2]["value"] = "bar"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response) == "Col0 by security_id"

        params["inputs"][-2]["value"] = "histogram"
        params["state"][0]["value"]["chart_type"] = "maps"
        params["state"][-3]["value"] = {
            "map_type": "choropleth",
            "loc": "security_id",
            "map_val": "Col0",
        }
        params["state"][-2]["value"]["points"][0]["location"] = 100000
        params["state"][-2]["value"]["points"][0]["z"] = 1.23
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response, True) == "Histogram of Col0 (1 data points)"
        params["inputs"][-2]["value"] = "bar"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response) == "Col0 by security_id"

        params["inputs"][-2]["value"] = "histogram"
        params["state"][-3]["value"] = {
            "map_type": "scattergeo",
            "lat": "security_id",
            "lon": "Col4",
            "map_val": "Col0",
        }
        params["state"][-2]["value"]["points"][0]["lat"] = 100000
        params["state"][-2]["value"]["points"][0]["lon"] = 4
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response, True) == "Histogram of Col0 (1 data points)"
        params["inputs"][-2]["value"] = "bar"
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        assert _chart_title(response) == "Col0 by lat_lon"
