import pandas as pd
import pytest

import dtale.pandas_util as pandas_util


@pytest.mark.unit
def test_check_pandas_version():
    assert pandas_util.check_pandas_version("0.20.0") is True
    assert pandas_util.check_pandas_version("999.0.0") is False


@pytest.mark.unit
def test_has_dropna():
    result = pandas_util.has_dropna()
    assert isinstance(result, bool)
    if pandas_util.check_pandas_version("1.1.0"):
        assert result is True
    else:
        assert result is False


@pytest.mark.unit
def test_groupby():
    df = pd.DataFrame({"a": [1, 1, 2, 2], "b": [10, 20, 30, 40]})
    result = pandas_util.groupby(df, "a")
    assert len(result) == 2

    result = pandas_util.groupby(df, "a", dropna=False)
    assert len(result) == 2


@pytest.mark.unit
def test_groupby_code():
    code = pandas_util.groupby_code(["col1", "col2"])
    assert "col1" in code
    assert "col2" in code
    if pandas_util.has_dropna():
        assert "dropna" in code

    code = pandas_util.groupby_code(["col1"], dropna=False)
    if pandas_util.has_dropna():
        assert "dropna=False" in code


@pytest.mark.unit
def test_is_pandas2():
    result = pandas_util.is_pandas2()
    assert isinstance(result, bool)


@pytest.mark.unit
def test_is_pandas3():
    result = pandas_util.is_pandas3()
    assert isinstance(result, bool)


@pytest.mark.unit
def test_run_function():
    s = pd.Series([1, 2, 3])
    result = pandas_util.run_function(s, "mean")
    assert result == 2.0

    # Test with non-existent function
    result = pandas_util.run_function(s, "nonexistent_function")
    assert result is None

    # Test with function that raises an exception
    class BadObj:
        def bad_method(self):
            raise ValueError("test error")

    result = pandas_util.run_function(BadObj(), "bad_method")
    assert result is None


@pytest.mark.unit
def test_assign_col_data():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    pandas_util.assign_col_data(df, "a", [10, 20, 30])
    assert list(df["a"]) == [10, 20, 30]
