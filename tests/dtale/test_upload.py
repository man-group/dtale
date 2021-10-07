import os

import mock
import pandas as pd
import pytest
from six import BytesIO, PY3

from dtale.app import build_app
from tests import ExitStack
from tests.dtale import build_data_inst

URL = "http://localhost:40000"


def build_upload_data(
    fname=os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")
):
    with open(fname, "r") as f:
        data = f.read()
    return BytesIO(str.encode(data))


@pytest.mark.unit
def test_upload(unittest):
    import dtale.views as views
    import dtale.global_state as global_state

    global_state.clear_store()
    df, _ = views.format_data(pd.DataFrame([1, 2, 3]))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))

        resp = c.post("/dtale/upload")
        assert not resp.get_json()["success"]

        c.post(
            "/dtale/upload",
            data={
                "tests_df.csv": (build_upload_data(), "test_df.csv"),
                "separatorType": "csv",
            },
        )
        assert global_state.size() == 2
        new_key = next((k for k in global_state.keys() if k != c.port), None)
        assert list(global_state.get_data(new_key).columns) == ["a", "b", "c"]

    with build_app(url=URL).test_client() as c:
        global_state.clear_store()
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))

        resp = c.post("/dtale/upload")
        assert not resp.get_json()["success"]

        c.post(
            "/dtale/upload",
            data={
                "tests_df.csv": (build_upload_data(), "test_df.csv"),
                "separatorType": "custom",
                "separator": ",",
            },
        )
        assert global_state.size() == 2
        new_key = next((k for k in global_state.keys() if k != c.port), None)
        assert list(global_state.get_data(new_key).columns) == ["a", "b", "c"]

    with build_app(url=URL).test_client() as c:
        global_state.clear_store()
        build_data_inst({c.port: df})
        global_state.set_dtypes(c.port, views.build_dtypes_state(df))
        assert global_state.size() == 1
        if PY3:
            c.post(
                "/dtale/upload",
                data={
                    "test_df.xlsx": (
                        os.path.join(
                            os.path.dirname(__file__), "..", "data/test_df.xlsx"
                        ),
                        "test_df.xlsx",
                    )
                },
            )
            assert global_state.size() == 2
            new_key = next((k for k in global_state.keys() if k != c.port), None)
            assert list(global_state.get_data(new_key).columns) == ["a", "b", "c"]

    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            global_state.clear_store()
            data = {c.port: df}
            build_data_inst(data)
            global_state.set_dtypes(c.port, views.build_dtypes_state(df))
            stack.enter_context(
                mock.patch(
                    "dtale.views.pd.read_excel",
                    mock.Mock(
                        return_value={
                            "Sheet 1": pd.DataFrame(dict(a=[1], b=[2])),
                            "Sheet 2": pd.DataFrame(dict(c=[1], d=[2])),
                        }
                    ),
                )
            )
            resp = c.post(
                "/dtale/upload",
                data={
                    "test_df.xlsx": (
                        os.path.join(
                            os.path.dirname(__file__), "..", "data/test_df.xlsx"
                        ),
                        "test_df.xlsx",
                    )
                },
            )
            assert global_state.size() == 3
            sheets = resp.json["sheets"]
            assert len(sheets) == 2
            unittest.assertEqual(
                sorted([s["name"] for s in sheets]),
                ["Sheet 1", "Sheet 2"],
            )


@pytest.mark.unit
def test_web_upload(unittest):
    import dtale.global_state as global_state

    global_state.clear_store()
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            load_csv = stack.enter_context(
                mock.patch(
                    "dtale.cli.loaders.csv_loader.loader_func",
                    mock.Mock(return_value=pd.DataFrame(dict(a=[1], b=[2]))),
                )
            )
            load_excel = stack.enter_context(
                mock.patch(
                    "dtale.cli.loaders.excel_loader.load_file",
                    mock.Mock(
                        return_value={"Sheet 1": pd.DataFrame(dict(a=[1], b=[2]))}
                    ),
                )
            )
            load_json = stack.enter_context(
                mock.patch(
                    "dtale.cli.loaders.json_loader.loader_func",
                    mock.Mock(return_value=pd.DataFrame(dict(a=[1], b=[2]))),
                )
            )
            params = {"type": "csv", "url": "http://test.com"}
            c.get("/dtale/web-upload", query_string=params)
            load_csv.assert_called_once()
            unittest.assertEqual(
                load_csv.call_args.kwargs,
                {"path": "http://test.com", "proxy": None},
            )
            assert global_state.size() == 1
            load_csv.reset_mock()

            params = {"type": "tsv", "url": "http://test.com"}
            c.get("/dtale/web-upload", query_string=params)
            load_csv.assert_called_once()
            unittest.assertEqual(
                load_csv.call_args.kwargs,
                {"path": "http://test.com", "proxy": None, "delimiter": "\t"},
            )
            assert global_state.size() == 2

            params = {
                "type": "json",
                "url": "http://test.com",
                "proxy": "http://testproxy.com",
            }
            c.get("/dtale/web-upload", query_string=params)
            load_json.assert_called_once()
            unittest.assertEqual(
                load_json.call_args.kwargs,
                {"path": "http://test.com", "proxy": "http://testproxy.com"},
            )
            assert global_state.size() == 3

            params = {"type": "excel", "url": "http://test.com"}
            c.get("/dtale/web-upload", query_string=params)
            load_excel.assert_called_once()
            unittest.assertEqual(
                load_excel.call_args.kwargs,
                {"path": "http://test.com", "proxy": None},
            )
            assert global_state.size() == 4
            global_state.clear_store()
            load_excel.reset_mock()
            load_excel.return_value = {
                "Sheet 1": pd.DataFrame(dict(a=[1], b=[2])),
                "Sheet 2": pd.DataFrame(dict(c=[1], d=[2])),
            }
            resp = c.get("/dtale/web-upload", query_string=params)
            sheets = resp.json["sheets"]
            assert len(sheets) == 2
            unittest.assertEqual(
                sorted([s["name"] for s in sheets]),
                ["Sheet 1", "Sheet 2"],
            )


@pytest.mark.unit
def test_covid_dataset():
    import dtale.global_state as global_state

    global_state.clear_store()

    def mock_load_csv(**kwargs):
        if (
            kwargs.get("path")
            == "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
        ):
            return pd.DataFrame(dict(state=["a", "b"]))
        elif (
            kwargs.get("path")
            == "https://raw.githubusercontent.com/jasonong/List-of-US-States/master/states.csv"
        ):
            return pd.DataFrame(dict(State=["a"], Abbreviation=["A"]))
        return None

    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.cli.loaders.csv_loader.loader_func", mock_load_csv)
            )
            c.get("/dtale/datasets", query_string=dict(dataset="covid"))
            assert global_state.get_data(1).state_code.values[0] == "A"


@pytest.mark.unit
def test_seinfeld_dataset():
    import dtale.global_state as global_state

    global_state.clear_store()

    def mock_load_csv(**kwargs):
        return pd.DataFrame(dict(SEID=["a"]))

    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.cli.loaders.csv_loader.loader_func", mock_load_csv)
            )
            c.get("/dtale/datasets", query_string=dict(dataset="seinfeld"))
            assert global_state.get_data(1).SEID.values[0] == "a"


@pytest.mark.unit
def test_time_dataframe_dataset():
    import dtale.global_state as global_state

    global_state.clear_store()
    with build_app(url=URL).test_client() as c:
        c.get("/dtale/datasets", query_string=dict(dataset="time_dataframe"))
        assert global_state.get_data(1)["A"].isnull().sum() == 0
