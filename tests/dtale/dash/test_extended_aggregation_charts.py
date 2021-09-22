import pandas as pd
import platform
import pytest

import dtale.global_state as global_state

from dtale.app import build_app

from tests.dtale import build_data_inst
from tests.dtale.dash.test_dash import build_chart_params, get_url_parser
from tests.dtale.test_views import URL

app = build_app(url=URL)


@pytest.mark.unit
def test_scatter():
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
        extended_aggregation = [dict(col="b", agg="sum"), dict(col="b", agg="mean")]
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 4
        chart1 = resp_data["chart-content"]["children"][0]["props"]["children"][1][
            "props"
        ]
        assert chart1["id"] == "chart-1"
        assert chart1["figure"]["layout"]["title"]["text"] == "Sum of b, Mean of b by a"


@pytest.mark.unit
def test_bar_and_popup(unittest):
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
        extended_aggregation = [dict(col="b", agg="sum"), dict(col="c", agg="mean")]
        params = build_chart_params(
            c.port,
            inputs,
            chart_inputs,
            dict(type="multi", data={}),
            extended_aggregation=extended_aggregation,
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"][0]["props"]["children"]) == 2

        chart_inputs["cpy"] = False
        params = build_chart_params(
            c.port,
            inputs,
            chart_inputs,
            dict(type="multi", data={}),
            extended_aggregation=extended_aggregation,
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
                "extended_aggregation": '[{"agg": "sum", "col": "b"}, {"agg": "mean", "col": "c"}]',
            },
        )
        expected = {
            "barmode": "group",
            "legend": {"orientation": "h"},
            "title": {"text": "Sum of b, Mean of c by a"},
            "xaxis": {"tickformat": "0:g", "title": {"text": "a"}},
            "yaxis": {"tickformat": "0:g", "title": {"text": "Sum of b"}},
            "yaxis2": {
                "anchor": "x",
                "overlaying": "y",
                "side": "right",
                "tickformat": "0:g",
                "title": {"text": "Mean of c"},
            },
        }
        major, minor, revision = [int(i) for i in platform.python_version_tuple()]
        if major == 3 and minor > 6:
            del expected["yaxis2"]["tickformat"]
        unittest.assertEqual(
            resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]["layout"],
            expected,
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
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
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
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            "frames"
            in resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]
        )

        inputs["y"] = ["b", "c"]
        inputs["group"] = None
        chart_inputs["animate_by"] = None
        chart_inputs["barmode"] = "group"
        chart_inputs["barsort"] = "b|sum"
        inputs["agg"] = None
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        unittest.assertEqual(
            resp_data["chart-content"]["children"]["props"]["children"][1]["props"][
                "figure"
            ]["layout"],
            {
                "barmode": "group",
                "legend": {"orientation": "h"},
                "title": {"text": "Sum of b, Mean of c by a"},
                "xaxis": {
                    "tickmode": "array",
                    "ticktext": [1, 2, 3],
                    "tickvals": [0, 1, 2],
                    "tickformat": "0:g",
                    "title": {"text": "a"},
                },
                "yaxis": {
                    "tickformat": "0:g",
                    "title": {"text": "Sum of b, Mean of c"},
                },
            },
        )

        inputs["y"] = ["b"]
        inputs["group"] = ["c"]
        chart_inputs["cpg"] = True
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 2

        chart_inputs["top_bars"] = 5
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
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
def test_line(unittest):
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
        extended_aggregation = [dict(col="b", agg="sum"), dict(col="c", agg="mean")]
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 1
        chart = resp_data["chart-content"]["children"][0]["props"]["children"][1]
        unittest.assertEqual(
            chart["props"]["figure"]["layout"],
            {
                "legend": {"orientation": "h"},
                "title": {"text": "(c: 7) - Sum of b, Mean of c by a"},
                "xaxis": {"tickformat": "0:g", "title": {"text": "a"}},
                "yaxis": {
                    "tickformat": "0:g",
                    "title": {"text": "Sum of b, Mean of c"},
                },
            },
        )
        unittest.assertEqual(
            list(map(lambda d: d["name"], chart["props"]["figure"]["data"])),
            ["Sum of b", "Mean of c"],
        )

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
        extended_aggregation = [dict(col="y", agg="sum"), dict(col="y", agg="mean")]
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert "chart-content" in resp_data


@pytest.mark.unit
def test_pie(unittest):
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
        extended_aggregation = [dict(col="b", agg="sum"), dict(col="b", agg="mean")]
        chart_inputs = {"cpg": True, "barmode": "group", "barsort": "b"}
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert len(resp_data["chart-content"]["children"]) == 6
        chart = resp_data["chart-content"]["children"][0]
        chart = chart["props"]["children"][0]["props"]["children"]["props"]["children"][
            1
        ]
        unittest.assertEqual(
            chart["props"]["figure"]["layout"],
            {
                "legend": {"orientation": "h"},
                "title": {"text": "(c: 13) - Sum of b by a"},
            },
        )
        unittest.assertEqual(
            list(map(lambda d: d["name"], chart["props"]["figure"]["data"])),
            ["Sum of b"],
        )
        chart = resp_data["chart-content"]["children"][0]
        chart = chart["props"]["children"][1]["props"]["children"]["props"]["children"][
            1
        ]
        unittest.assertEqual(
            chart["props"]["figure"]["layout"],
            {
                "legend": {"orientation": "h"},
                "title": {"text": "(c: 13) - Mean of b by a"},
            },
        )
        unittest.assertEqual(
            list(map(lambda d: d["name"], chart["props"]["figure"]["data"])),
            ["Mean of b"],
        )

        inputs["group"] = None
        chart_inputs["cpg"] = False
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
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
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        [error, chart] = resp_data["chart-content"]["children"][0]["props"]["children"][
            0
        ]["props"]["children"]["props"]["children"]
        assert (
            error["props"]["children"]["props"]["children"][2]["props"]["children"][
                "props"
            ]["children"]
            == "3 (-6)"
        )
        chart = chart["props"]["children"]["props"]["children"][1]["props"]["figure"]
        unittest.assertEqual(
            chart["layout"],
            {"legend": {"orientation": "h"}, "title": {"text": "Sum of b by a"}},
        )


@pytest.mark.unit
def test_wordcloud():
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
        }
        chart_inputs = {"cpg": False, "cpy": False, "barmode": "group", "barsort": None}
        extended_aggregation = [dict(col="b", agg="mean"), dict(col="b", agg="sum")]
        params = build_chart_params(
            c.port, inputs, chart_inputs, extended_aggregation=extended_aggregation
        )
        response = c.post("/dtale/charts/_dash-update-component", json=params)
        resp_data = response.get_json()["response"]
        assert (
            resp_data["chart-content"]["children"]["props"]["children"][1]["type"]
            == "Wordcloud"
        )
