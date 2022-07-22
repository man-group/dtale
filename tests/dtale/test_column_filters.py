import pandas as pd
import pytest
from pkg_resources import parse_version

from dtale.column_filters import DateFilter, NumericFilter, StringFilter


@pytest.mark.unit
def test_numeric():
    assert NumericFilter("foo", "I", None).build_filter() is None
    assert (
        NumericFilter("foo", "I", dict(operand="=", value=None)).build_filter() is None
    )
    assert (
        NumericFilter("foo", "I", dict(operand="<", value=None)).build_filter() is None
    )
    assert NumericFilter("foo", "I", dict(operand="[]")).build_filter() is None


@pytest.mark.unit
def test_date():
    assert DateFilter("foo", "D", None).build_filter() is None


@pytest.mark.unit
def test_string():
    is_pandas25 = parse_version(pd.__version__) >= parse_version("0.25.0")

    def build_query(fltr):
        query = fltr.build_filter()["query"]
        if is_pandas25:
            return query
        return query.replace("`", "")

    df = pd.DataFrame(dict(foo=["AAA", "aaa", "ABB", "ACC", "\'\"{[\\AA"]))

    cfg = dict(action="equals", operand="=", value=["AAA"])

    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["operand"] = "ne"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 4

    cfg["value"] = ["AAA", "aaa"]
    cfg["operand"] = "="
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 2
    cfg["value"] = ["\'\"{[\\AA"]
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["value"] = ["aaa", "\'\"{[\\AA"]
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 2

    cfg["raw"] = "'"
    cfg["action"] = "startswith"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 1

    cfg["raw"] = "AA"
    cfg["action"] = "startswith"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 2
    cfg["operand"] = "ne"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 3
    cfg["action"] = "endswith"
    cfg["operand"] = "="
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 3
    cfg["caseSensitive"] = True
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 2

    cfg["action"] = "contains"
    cfg["caseSensitive"] = False
    cfg["raw"] = "\'\""
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["raw"] = "[\\" # str.contains parses regex
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 1

    cfg["raw"] = "A"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 5
    cfg["caseSensitive"] = True
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 4
    cfg["raw"] = "D"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 0

    cfg["action"] = "length"
    cfg["raw"] = "3"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 4

    df = pd.DataFrame(dict(foo=["a", "aa", "aaa", "aaaa"]))
    cfg["raw"] = "1,3"
    assert len(df.query(build_query(StringFilter("foo", "S", cfg)))) == 3
