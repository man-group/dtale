import unittest as ut

import pandas as pd
import pytest
from six import PY3


@pytest.fixture(scope="module")
def unittest():
    tc = ut.TestCase('__init__')
    tc.longMessage = True
    return tc


@pytest.fixture(scope="module")
def test_data():
    now = pd.Timestamp('20000101')
    return pd.DataFrame(
        [dict(date=now, security_id=i, foo=1, bar=1.5, baz='baz') for i in range(50)],
        columns=['date', 'security_id', 'foo', 'bar', 'baz']
    )


@pytest.fixture(scope="module")
def builtin_pkg():
    if PY3:
        return 'builtins'
    return '__builtin__'
