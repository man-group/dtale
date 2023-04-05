import pandas as pd

from pkg_resources import parse_version
from six import PY3


def groupby(df, index, dropna=True):
    if PY3:
        return df.groupby(index, dropna=dropna)
    return df.groupby(index)


def groupby_code(index, dropna=True):
    if PY3:
        return ".groupby(['{index}'], dropna={dropna})".format(
            index="','".join(index), dropna=dropna
        )
    return ".groupby(['{index}'])".format(index="','".join(index))


def is_pandas2():
    return parse_version(pd.__version__) >= parse_version("2.0.0")
