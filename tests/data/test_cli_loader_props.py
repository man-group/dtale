import pandas as pd

from dtale.cli.clickutils import get_loader_options

LOADER_KEY = "testcli2"
LOADER_PROPS = ["prop"]


def find_loader(kwargs):

    test_cli_props = get_loader_options(LOADER_KEY, LOADER_PROPS, kwargs)
    if len([f for f in test_cli_props.values() if f]):

        def _testcli():
            return pd.DataFrame([dict(security_id=1, foo=test_cli_props["prop"])])

        return _testcli
    return None
