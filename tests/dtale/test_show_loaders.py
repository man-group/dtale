import json
import os
import pandas as pd

import mock
import pytest
from six import PY3

from tests import ExitStack


@pytest.mark.unit
def test_show_csv():
    import dtale

    csv_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.csv")

    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.csv_loader.show", mock_show):
        dtale.show_csv(path=csv_path)
        mock_show.call_args[1]["data_loader"]()
        mock_show.reset_mock()

    with open(csv_path, "r") as f:
        csv_txt = f.read()
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.cli.loaders.csv_loader.show", mock_show)
            )

            class MockRequest(object):
                def __init__(self):
                    self.content = csv_txt.encode() if PY3 else csv_txt
                    self.status_code = 200

            stack.enter_context(
                mock.patch("requests.get", mock.Mock(return_value=MockRequest()))
            )
            dtale.show_csv(path="http://test-csv")
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()
            dtale.show_csv(path="http://test-csv", proxy="http://test-proxy")
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()


@pytest.mark.unit
def test_show_excel(unittest):
    import dtale

    excel_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.xlsx")

    mock_show = mock.Mock()
    if PY3:
        with mock.patch("dtale.cli.loaders.excel_loader.show", mock_show):
            dtale.show_excel(path=excel_path)
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()

            with pytest.raises(Exception) as e:
                dtale.show_excel(path=excel_path, sheet="Worksheet")
                mock_show.reset_mock()
                assert (
                    str(e)
                    == "Excel file loaded but there was no sheet named 'Worksheet'."
                )

    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("dtale.cli.loaders.excel_loader.show", mock_show)
        )

        class MockRequest(object):
            def __init__(self):
                self.content = str.encode("blah")
                self.status_code = 200

        stack.enter_context(
            mock.patch("requests.get", mock.Mock(return_value=MockRequest()))
        )
        mock_read_excel = stack.enter_context(
            mock.patch(
                "pandas.read_excel",
                mock.Mock(return_value={"blah": pd.DataFrame([1, 2, 3, 4])}),
            )
        )
        dtale.show_excel(path="http://test-excel.xlsx", sheet="blah")
        mock_show.call_args[1]["data_loader"]()
        unittest.assertEqual(
            mock_read_excel.call_args[1], {"sheet_name": "blah", "engine": "openpyxl"}
        )
        mock_show.mock_reset()
        mock_read_excel.mock_reset()
        dtale.show_excel(path="http://test-excel.xls", sheet="blah")
        mock_show.call_args[1]["data_loader"]()
        assert mock_read_excel.call_args[1]["engine"] == "xlrd"


@pytest.mark.unit
def test_show_json():
    import dtale

    json_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.json")

    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.json_loader.show", mock_show):
        dtale.show_json(path=json_path)
        mock_show.call_args[1]["data_loader"]()
        mock_show.reset_mock()

    with open(json_path, "r") as f:
        json_txt = f.read()
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch("dtale.cli.loaders.json_loader.show", mock_show)
            )

            import dtale

            class MockRequest(object):
                def __init__(self):
                    self.text = json_txt.encode() if PY3 else json_txt
                    self.status_code = 200

                def json(self):
                    return json.loads(json_txt)

            stack.enter_context(
                mock.patch("requests.get", mock.Mock(return_value=MockRequest()))
            )
            dtale.show_json(path="http://test-json", normalize=True)
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()
            dtale.show_json(
                path="http://test-json", proxy="http://test-proxy", normalize=True
            )
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()
            dtale.show_json(path="http://test-json")
            mock_show.call_args[1]["data_loader"]()
            mock_show.reset_mock()


@pytest.mark.unit
def test_show_parquet():
    # the parquet data was built using these versions of pyarrow & pandas
    pytest.importorskip("pyarrow", minversion="0.17.1")
    pytest.importorskip("pandas", minversion="1.1.0")
    import dtale

    parquet_path = os.path.join(os.path.dirname(__file__), "..", "data/test_df.parquet")
    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.parquet_loader.show", mock_show):
        dtale.show_parquet(path=parquet_path)
        df = mock_show.call_args[1]["data_loader"]()
        assert df is not None


@pytest.mark.unit
def test_show_sqlite():
    import dtale

    parquet_path = os.path.join(os.path.dirname(__file__), "..", "data/test.sqlite3")
    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.sqlite_loader.show", mock_show):
        dtale.show_sqlite(path=parquet_path, table="test_simpsons")
        df = mock_show.call_args[1]["data_loader"]()
        assert df is not None

    with mock.patch("dtale.cli.loaders.sqlite_loader.show", mock_show):
        with pytest.raises(Exception) as error:
            dtale.show_sqlite(path=parquet_path)
            assert (
                "You must specify a table name in order to use sqlite loader!"
                in str(error.value)
            )


@pytest.mark.unit
def test_show_arcticdb(arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")
    import dtale
    from dtale.views import startup
    import dtale.global_state as global_state

    with mock.patch("dtale.cli.loaders.arcticdb_loader.show", mock.Mock()) as mock_show:
        dtale.show_arcticdb(uri=arcticdb_path, library="dtale", symbol="df1")
        df = mock_show.call_args[1]["data_loader"]()
        assert len(df) == 3

    with ExitStack() as stack:
        mock_show = stack.enter_context(
            mock.patch("dtale.cli.loaders.arcticdb_loader.show", mock.Mock())
        )

        mock_startup = stack.enter_context(
            mock.patch("dtale.views.startup", mock.Mock(side_effect=startup))
        )

        dtale.show_arcticdb(
            uri=arcticdb_path, library="dtale", symbol="df1", use_store=True
        )
        show_output = mock_show.call_args[1]["data_loader"]()
        assert show_output == "df1"

        df = mock_startup.call_args[1]["data"]
        assert len(df) == 1

        global_state.cleanup()
        global_state.use_default_store()  # make sure we switch the default store back

    with mock.patch("dtale.cli.loaders.arcticdb_loader.show", mock.Mock()) as mock_show:
        dtale.show_arcticdb(uri=arcticdb_path, library="dtale", use_store=True)
        df = mock_show.call_args[1]["data_loader"]()
        assert df is None

        global_state.cleanup()
        global_state.use_default_store()  # make sure we switch the default store back
