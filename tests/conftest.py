import unittest as ut

import numpy as np
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
def rolling_data():
    # https://github.com/man-group/dtale/issues/43
    ii = pd.date_range(start='2018-01-01', end='2019-12-01', freq='D')
    ii = pd.Index(ii, name='date')
    n = ii.shape[0]
    c = 5
    data = np.random.random((n, c))
    return pd.DataFrame(data, index=ii)


@pytest.fixture(scope="module")
def builtin_pkg():
    if PY3:
        return 'builtins'
    return '__builtin__'
