import json
import pandas as pd
import pytest

from tests.dtale.test_views import app
from tests.dtale import build_data_inst, build_settings, build_dtypes


@pytest.mark.unit
def test_merge(unittest):
    from dtale.views import build_dtypes_state
    import dtale.global_state as global_state

    global_state.clear_store()

    left = pd.DataFrame(
        {
            "key1": ["K0", "K0", "K1", "K2"],
            "key2": ["K0", "K1", "K0", "K1"],
            "A": ["A0", "A1", "A2", "A3"],
            "B": ["B0", "B1", "B2", "B3"],
        }
    )
    right = pd.DataFrame(
        {
            "key1": ["K0", "K1", "K1", "K2"],
            "key2": ["K0", "K0", "K0", "K0"],
            "C": ["C0", "C1", "C2", "C3"],
            "D": ["D0", "D1", "D2", "D3"],
        }
    )
    right2 = pd.DataFrame(
        {
            "key1": ["K0", "K1"],
            "key2": ["K0", "K0"],
            "E": ["E0", "E1"],
            "F": ["F0", "F1"],
        }
    )
    with app.test_client() as c:
        data = {"1": left, "2": right, "3": right2}
        dtypes = {k: build_dtypes_state(v) for k, v in data.items()}
        settings = {k: {} for k in data.keys()}
        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        datasets = [
            dict(dataId="1", columns=[], index=["key1", "key2"], suffix=""),
            dict(dataId="2", columns=[], index=["key1", "key2"], suffix=""),
        ]
        config = dict(how="inner", sort=False, indicator=False)
        resp = c.post(
            "/dtale/merge",
            data=dict(
                action="merge",
                config=json.dumps(config),
                datasets=json.dumps(datasets),
            ),
        )
        assert resp.status_code == 200
        final_df = global_state.get_data(resp.json["data_id"])
        unittest.assertEqual(
            list(final_df.columns), ["key1", "key2", "A", "B", "C", "D"]
        )
        assert len(final_df) == 3

        datasets[0]["columns"] = ["A"]
        datasets[1]["columns"] = ["C"]
        config["how"] = "left"
        config["indicator"] = True
        resp = c.post(
            "/dtale/merge",
            data=dict(
                action="merge",
                config=json.dumps(config),
                datasets=json.dumps(datasets),
            ),
        )
        assert resp.status_code == 200
        final_df = global_state.get_data(resp.json["data_id"])
        unittest.assertEqual(
            list(final_df.columns), ["key1", "key2", "A", "C", "merge_1"]
        )
        unittest.assertEqual(
            list(final_df["merge_1"].values),
            ["both", "left_only", "both", "both", "left_only"],
        )

        datasets.append(dict(dataId="3", index=["key1", "key2"], suffix="3"))
        resp = c.post(
            "/dtale/merge",
            data=dict(
                action="merge",
                config=json.dumps(config),
                datasets=json.dumps(datasets),
            ),
        )
        assert resp.status_code == 200
        final_df = global_state.get_data(resp.json["data_id"])
        unittest.assertEqual(
            list(final_df.columns),
            ["key1", "key2", "A", "C", "merge_1", "E", "F", "merge_2"],
        )
        unittest.assertEqual(
            list(final_df["merge_2"].values),
            ["both", "left_only", "both", "both", "left_only"],
        )


@pytest.mark.unit
def test_stack(unittest):
    from dtale.views import build_dtypes_state
    import dtale.global_state as global_state

    global_state.clear_store()
    df1 = pd.DataFrame(
        {
            "A": ["A0", "A1"],
            "B": ["B0", "B1"],
            "C": ["C0", "C1"],
            "D": ["D0", "D1"],
        }
    )
    df2 = pd.DataFrame(
        {
            "A": ["A2", "A3"],
            "B": ["B3", "B3"],
            "C": ["C3", "C3"],
            "D": ["D3", "D3"],
        }
    )

    with app.test_client() as c:
        data = {"1": df1, "2": df2}
        dtypes = {k: build_dtypes_state(v) for k, v in data.items()}
        settings = {k: {} for k in data.keys()}
        build_data_inst(data)
        build_dtypes(dtypes)
        build_settings(settings)
        datasets = [dict(dataId="1", columns=[]), dict(dataId="2", columns=[])]
        config = dict(ignore_index=False)
        resp = c.post(
            "/dtale/merge",
            data=dict(
                action="stack",
                config=json.dumps(config),
                datasets=json.dumps(datasets),
            ),
        )
        assert resp.status_code == 200
        final_df = global_state.get_data(resp.json["data_id"])
        unittest.assertEqual(list(final_df["A"].values), ["A0", "A1", "A2", "A3"])
        unittest.assertEqual(list(final_df["index"].values), [0, 1, 0, 1])

        config["ignoreIndex"] = True
        resp = c.post(
            "/dtale/merge",
            data=dict(
                action="stack",
                config=json.dumps(config),
                datasets=json.dumps(datasets),
            ),
        )
        assert resp.status_code == 200
        final_df = global_state.get_data(resp.json["data_id"])
        assert "index" not in final_df.columns
        unittest.assertEqual(list(final_df["A"].values), ["A0", "A1", "A2", "A3"])
