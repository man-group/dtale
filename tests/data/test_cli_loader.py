import pandas as pd

LOADER_KEY = "testcli"
LOADER_PROPS = []


def find_loader(kwargs):

    if kwargs.get(LOADER_KEY, False):

        def _testcli():
            return pd.DataFrame([dict(security_id=1, foo=1.5)])

        return _testcli
    return None
