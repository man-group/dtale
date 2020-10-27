import base64
import os

import mock
import pandas as pd
import pytest

from six import PY3

from dtale.app import build_app

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


URL = "http://localhost:40000"


def build_upload_data(
    fname="/../".join([os.path.dirname(__file__), "data/test_df.csv"])
):
    with open(fname, "r") as f:
        data = f.read()
    data = base64.b64encode(data.encode("utf-8"))
    return "data:text/csv;base64," + data.decode("utf-8")


@pytest.mark.unit
def test_upload():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame([1, 2, 3]))
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            data = {c.port: df}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            stack.enter_context(
                mock.patch(
                    "dtale.global_state.DTYPES", {c.port: views.build_dtypes_state(df)}
                )
            )

            resp = c.post("/dtale/upload")
            assert not resp.get_json()["success"]

            c.post(
                "/dtale/upload",
                data={"contents": build_upload_data(), "filename": "test_df.csv"},
            )
            assert len(data) == 2
            new_key = next((k for k in data if k != c.port), None)
            assert list(data[new_key].columns) == ["a", "b", "c"]


@pytest.mark.unit
def test_web_upload(unittest):
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            data = {}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            load_csv = stack.enter_context(
                mock.patch(
                    "dtale.cli.loaders.csv_loader.loader_func",
                    mock.Mock(return_value=pd.DataFrame(dict(a=[1], b=[2]))),
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
            assert len(data) == 1
            load_csv.reset_mock()

            params = {"type": "tsv", "url": "http://test.com"}
            c.get("/dtale/web-upload", query_string=params)
            load_csv.assert_called_once()
            unittest.assertEqual(
                load_csv.call_args.kwargs,
                {"path": "http://test.com", "proxy": None, "delimiter": "\t"},
            )
            assert len(data) == 2

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
            assert len(data) == 3


@pytest.mark.unit
def test_covid_dataset():
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
            data = {}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            stack.enter_context(
                mock.patch("dtale.cli.loaders.csv_loader.loader_func", mock_load_csv)
            )
            c.get("/dtale/datasets", query_string=dict(dataset="covid"))
            assert data["1"].state_code.values[0] == "A"


@pytest.mark.unit
def test_seinfeld_dataset():
    def mock_load_csv(**kwargs):
        return pd.DataFrame(dict(SEID=["a"]))

    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            data = {}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            stack.enter_context(
                mock.patch("dtale.cli.loaders.csv_loader.loader_func", mock_load_csv)
            )
            c.get("/dtale/datasets", query_string=dict(dataset="seinfeld"))
            assert data["1"].SEID.values[0] == "a"


@pytest.mark.unit
def test_time_dataframe_dataset():
    with build_app(url=URL).test_client() as c:
        with ExitStack() as stack:
            data = {}
            stack.enter_context(mock.patch("dtale.global_state.DATA", data))
            c.get("/dtale/datasets", query_string=dict(dataset="time_dataframe"))
            assert data["1"]["A"].isnull().sum() == 0
