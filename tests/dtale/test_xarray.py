import json
import numpy as np
import pandas as pd
import pytest
import xarray as xr
from six import PY3
from tests.dtale.test_views import app, URL


def xarray_data():
    np.random.seed(123)

    times = pd.date_range("2000-01-01", "2001-12-31", name="time")
    annual_cycle = np.sin(2 * np.pi * (times.dayofyear.values / 365.25 - 0.28))

    base = 10 + 15 * annual_cycle.reshape(-1, 1)
    tmin_values = base + 3 * np.random.randn(annual_cycle.size, 3)
    tmax_values = base + 10 + 3 * np.random.randn(annual_cycle.size, 3)

    return xr.Dataset(
        {
            "tmin": (("time", "location"), tmin_values),
            "tmax": (("time", "location"), tmax_values),
        },
        {"time": times, "location": ["IA", "IN", "IL"]},
    )


@pytest.mark.unit
def test_view(unittest):
    from dtale.views import startup
    import dtale.global_state as global_state

    global_state.clear_store()

    with app.test_client() as c:
        global_state.new_data_inst(c.port)
        startup(URL, data=xarray_data(), data_id=c.port)
        assert global_state.get_dataset(c.port) is not None

        response = c.get("/dtale/main/{}".format(c.port))
        assert 'input id="xarray" value="True"' not in str(response.data)
        assert 'input id="xarray_dim" value="{}"' not in str(response.data)

        resp = c.get("/dtale/code-export/{}".format(c.port))
        assert resp.status_code == 200
        response_data = resp.json
        assert response_data["success"]

        resp = c.get("/dtale/xarray-coordinates/{}".format(c.port))
        response_data = resp.json
        expected = [
            {
                "count": 3,
                "dtype": "str64" if PY3 else "string16",
                "name": "location",
            },
            {"count": 731, "dtype": "datetime64[ns]", "name": "time"},
        ]
        unittest.assertEqual(
            sorted(response_data["data"], key=lambda c: c["name"]), expected
        )

        resp = c.get("/dtale/xarray-dimension-values/{}/location".format(c.port))
        response_data = resp.json
        unittest.assertEqual(
            response_data["data"],
            [{"value": "IA"}, {"value": "IN"}, {"value": "IL"}],
        )

        resp = c.get(
            "/dtale/update-xarray-selection/{}".format(c.port),
            query_string=dict(selection=json.dumps(dict(location="IA"))),
        )
        assert resp.status_code == 200
        assert list(global_state.get_data(c.port).location.unique()) == ["IA"]
        assert global_state.get_dataset_dim(c.port)["location"] == "IA"

        resp = c.get(
            "/dtale/update-xarray-selection/{}".format(c.port),
            query_string=dict(selection=json.dumps(dict())),
        )
        assert resp.status_code == 200
        assert list(global_state.get_data(c.port).location.unique()) == [
            "IA",
            "IN",
            "IL",
        ]

        resp = c.get("/dtale/code-export/{}".format(c.port))
        assert resp.status_code == 200
        response_data = resp.json
        assert response_data["success"]

    with app.test_client() as c:
        zero_dim_xarray = xarray_data().sel(location="IA", time="2000-01-01")
        startup(URL, data=zero_dim_xarray, data_id=c.port)
        assert global_state.get_dataset(c.port) is not None
        response = c.get("/dtale/main/{}".format(c.port))
        assert 'input id="xarray" value="True"' not in str(response.data)
        assert 'input id="xarray_dim" value="{}"' not in str(response.data)


@pytest.mark.unit
def test_convert():
    from dtale.views import startup
    from tests.dtale.test_replacements import replacements_data
    import dtale.global_state as global_state

    global_state.clear_store()
    with app.test_client() as c:
        global_state.new_data_inst(c.port)
        startup(URL, data=replacements_data(), data_id=c.port)

        resp = c.get(
            "/dtale/to-xarray/{}".format(c.port),
            query_string=dict(index=json.dumps(["a"])),
        )
        assert resp.status_code == 200
        assert global_state.get_dataset(c.port) is not None
        assert global_state.get_settings(c.port)["locked"] == ["a"]
