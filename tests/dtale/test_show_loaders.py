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

    with mock.patch('dtale.app.show', mock.Mock()):
        csv_path = "/../".join([os.path.dirname(__file__), 'data/test_df.csv'])
        dtale.show_csv(path=csv_path)


@pytest.mark.unit
def test_show_json():
    import dtale

    json_path = "/../".join([os.path.dirname(__file__), 'data/test_df.json'])

    with mock.patch('dtale.app.show', mock.Mock()):
        dtale.show_json(path=json_path)

    with open(json_path, 'r') as f:
        json_txt = f.read()
        with ExitStack() as stack:
            stack.enter_context(mock.patch('dtale.app.show', mock.Mock()))

            class MockRequest(object):
                def __init__(self):
                    self.text = json_txt

                def json(self):
                    return json.loads(json_txt)

            stack.enter_context(mock.patch('requests.get', mock.Mock(return_value=MockRequest())))
            dtale.show_json(path='http://test-json', normalize=True)
            dtale.show_json(path='http://test-json', proxy='http://test-proxy', normalize=True)
            dtale.show_json(path='http://test-json')
