import pandas as pd

from pkg_resources import parse_version


def check_pandas_version(version_number):
    return parse_version(pd.__version__) >= parse_version(version_number)


def has_dropna():
    return check_pandas_version("1.1.0")


def groupby(df, index, dropna=True):
    if has_dropna():
        return df.groupby(index, dropna=dropna)
    return df.groupby(index)


def groupby_code(index, dropna=True):
    if has_dropna():
        return ".groupby(['{index}'], dropna={dropna})".format(
            index="','".join(index), dropna=dropna
        )
    return ".groupby(['{index}'])".format(index="','".join(index))


def is_pandas2():
    return check_pandas_version("2.0.0")
