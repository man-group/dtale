import pytest

from dtale.column_filters import DateFilter, NumericFilter


@pytest.mark.unit
def test_numeric(unittest):
    assert NumericFilter("foo", "I", None).build_filter() is None
    assert (
        NumericFilter("foo", "I", dict(operand="=", value=None)).build_filter() is None
    )
    assert (
        NumericFilter("foo", "I", dict(operand="<", value=None)).build_filter() is None
    )
    assert NumericFilter("foo", "I", dict(operand="[]")).build_filter() is None


@pytest.mark.unit
def test_date(unittest):
    assert DateFilter("foo", "D", None).build_filter() is None
