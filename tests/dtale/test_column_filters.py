import re

import pandas as pd
import pytest

from dtale.column_filters import DateFilter, NumericFilter, StringFilter
from dtale.pandas_util import check_pandas_version
from dtale.query import run_query


@pytest.mark.unit
def test_numeric():
    assert NumericFilter("foo", "I", None).build_filter() is None
    assert (
        NumericFilter(
            "foo", "I", dict(operand="=", value=None, type="int")
        ).build_filter()
        is None
    )
    assert (
        NumericFilter(
            "foo", "I", dict(operand="<", value=None, type="int")
        ).build_filter()
        is None
    )
    assert (
        NumericFilter("foo", "I", dict(operand="[]", type="int")).build_filter() is None
    )


@pytest.mark.unit
def test_date():
    assert DateFilter("foo", "D", None).build_filter() is None


@pytest.mark.unit
def test_string():
    is_pandas25 = check_pandas_version("0.25.0")

    def build_query(fltr):
        query = fltr.build_filter()["query"]
        if is_pandas25:
            return query
        return query.replace("`", "")

    df = pd.DataFrame(dict(foo=["AAA", "aaa", "ABB", "ACC", "'\"{[\\AA"]))

    cfg = dict(action="equals", operand="=", value=["AAA"], type="string")

    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["operand"] = "ne"
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4

    cfg["value"] = ["AAA", "aaa"]
    cfg["operand"] = "="
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2
    cfg["value"] = ["'\"{[\\AA"]
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
    cfg["value"] = ["aaa", "'\"{[\\AA"]
    assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

    if is_pandas25:
        cfg["raw"] = "'"
        cfg["action"] = "startswith"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1

        cfg["raw"] = "AA"
        cfg["action"] = "startswith"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        cfg["operand"] = "ne"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3

        cfg["action"] = "endswith"
        cfg["operand"] = "="
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3

        cfg["caseSensitive"] = True
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        cfg["action"] = "contains"
        cfg["caseSensitive"] = False
        cfg["raw"] = "'\""
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1
        cfg["raw"] = "[\\"  # don't parse this as regex
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 1

        cfg["raw"] = "A"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 5
        cfg["caseSensitive"] = True
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4
        cfg["raw"] = "D"
        assert (
            len(
                run_query(
                    df, build_query(StringFilter("foo", "S", cfg)), ignore_empty=True
                )
            )
            == 0
        )

        cfg["action"] = "regex"
        cfg["raw"] = "[[A].+A$"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 2

        with pytest.raises(re.error):
            cfg["raw"] = "["
            run_query(df, build_query(StringFilter("foo", "S", cfg)))

        cfg["action"] = "length"
        cfg["raw"] = "3"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 4

        df = pd.DataFrame(dict(foo=["a", "aa", "aaa", "aaaa"]))
        cfg["raw"] = "1,3"
        assert len(run_query(df, build_query(StringFilter("foo", "S", cfg)))) == 3
