import json
import os

import mock
import pytest
from six import PY3

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_show_csv():
    import dtale

    csv_path = "/../".join([os.path.dirname(__file__), "data/test_df.csv"])

    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.csv_loader.show", mock_show):
        dtale.show_csv(path=csv_path)
        mock_show.call_args.kwargs["data_loader"]()
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
            mock_show.call_args.kwargs["data_loader"]()
            mock_show.reset_mock()
            dtale.show_csv(path="http://test-csv", proxy="http://test-proxy")
            mock_show.call_args.kwargs["data_loader"]()
            mock_show.reset_mock()


@pytest.mark.unit
def test_show_json():
    import dtale

    json_path = "/../".join([os.path.dirname(__file__), "data/test_df.json"])

    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.json_loader.show", mock_show):
        dtale.show_json(path=json_path)
        mock_show.call_args.kwargs["data_loader"]()
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
            mock_show.call_args.kwargs["data_loader"]()
            mock_show.reset_mock()
            dtale.show_json(
                path="http://test-json", proxy="http://test-proxy", normalize=True
            )
            mock_show.call_args.kwargs["data_loader"]()
            mock_show.reset_mock()
            dtale.show_json(path="http://test-json")
            mock_show.call_args.kwargs["data_loader"]()
            mock_show.reset_mock()


@pytest.mark.unit
def test_show_parquet():
    import dtale

    parquet_path = "/../".join([os.path.dirname(__file__), "data/test_df.parquet"])
    mock_show = mock.Mock()
    with mock.patch("dtale.cli.loaders.parquet_loader.show", mock_show):
        dtale.show_parquet(path=parquet_path)
        df = mock_show.call_args.kwargs["data_loader"]()
        assert df is not None
