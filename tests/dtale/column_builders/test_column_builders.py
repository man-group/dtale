import numpy as np
import pandas as pd
import pytest
from numpy.random import randn
from six import PY3

from dtale.column_builders import ColumnBuilder, ZERO_STD_ERROR
from tests.dtale import build_data_inst


def verify_builder(builder, checker):
    assert checker(builder.build_column())
    assert builder.build_code()


@pytest.mark.unit
def test_random():
    def _data():
        for i in range(100):
            a = i % 5
            b = i % 3
            c = i % 4
            yield dict(a=a, b=b, c=c, i=i)

    df = pd.DataFrame(list(_data()))
    data_id, column_type = "1", "random"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "i", "type": "float", "low": 0, "high": 5}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: sum((col < 0) | (col > 5)) == 0)


@pytest.mark.unit
def test_transform():
    def _data():
        for i in range(100):
            a = i % 5
            b = i % 3
            c = i % 4
            yield dict(a=a, b=b, c=c, i=i)

    df = pd.DataFrame(list(_data()))

    aggs = [
        "count",
        "nunique",
        "sum",
        "first",
        "last",
        "median",
        "min",
        "max",
        "std",
        "var",
        "mad",
        "prod",
    ]
    data_id, column_type = "1", "transform"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "i", "group": ["a"], "agg": "mean"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(
        builder, lambda col: col.values[0] == 47.5 and col.values[-1] == 51.5
    )

    for agg in aggs:
        cfg["agg"] = agg
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
        verify_builder(builder, lambda col: len(col[col.isnull()]) == 0)


@pytest.mark.unit
def test_winsorize():
    def _data():
        for i in range(100):
            a = i % 5
            b = i % 3
            c = i % 4
            yield dict(a=a, b=b, c=c, i=i)

    df = pd.DataFrame(list(_data()))
    data_id, column_type = "1", "winsorize"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "i", "inclusive": [True, False], "limits": [0.1, 0.1]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 4950)

    cfg = {"col": "i", "group": ["b"], "limits": [0.1, 0.1]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 4950)

    cfg = {"col": "i"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.sum() == 4950)


@pytest.mark.unit
def test_zscore_normalize():
    def _data():
        for i in range(100):
            yield dict(a=1, i=i)

    df = pd.DataFrame(list(_data()))

    data_id, column_type = "1", "zscore_normalize"
    i = 0
    build_data_inst({data_id: df})

    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), {"col": "i"})
    verify_builder(builder, lambda col: col.sum() == 4.440892098500626e-16)

    with pytest.raises(BaseException) as error:
        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), {"col": "a"})
        builder.build_column()
        assert ZERO_STD_ERROR in str(error.value)


@pytest.mark.unit
def test_cumsum():
    def _data():
        for i in range(100):
            yield dict(a=1, i=i)

    df = pd.DataFrame(list(_data()))

    data_id, column_type = "1", "cumsum"
    i = 0
    build_data_inst({data_id: df})

    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), {"col": "i"})
    verify_builder(builder, lambda col: col.max() == 4950)


@pytest.mark.unit
@pytest.mark.parametrize("custom_data", [dict(rows=1000, cols=3)], indirect=True)
def test_cumsum_groupby(custom_data):

    data_id, column_type = "1", "cumsum"
    build_data_inst({data_id: custom_data})

    builder = ColumnBuilder(
        data_id, column_type, "Col0", {"col": "int_val", "group": ["security_id"]}
    )
    verify_builder(builder, lambda col: col.max() > 0)


@pytest.mark.unit
def test_substring():
    df = pd.DataFrame(dict(a=["aaaaa", "bbbbbbb", "ccccccccc"]))

    data_id, column_type = "1", "substring"
    build_data_inst({data_id: df})

    builder = ColumnBuilder(
        data_id, column_type, "Col1", {"col": "a", "start": 0, "end": 3}
    )
    verify_builder(builder, lambda col: list(col.values) == ["aaa", "bbb", "ccc"])

    builder = ColumnBuilder(
        data_id, column_type, "Col1", {"col": "a", "start": 5, "end": 6}
    )
    verify_builder(builder, lambda col: list(col.values) == ["", "b", "c"])


@pytest.mark.unit
def test_splitting():
    df = pd.DataFrame(dict(a=["a,a,a"]))

    data_id, column_type = "1", "split"
    build_data_inst({data_id: df})

    builder = ColumnBuilder(
        data_id, column_type, "a_split", {"col": "a", "delimiter": ","}
    )

    def _test(col):
        assert list(col.columns) == ["a_split_0", "a_split_1", "a_split_2"]
        return list(col.loc[0, :].values) == ["a", "a", "a"]

    verify_builder(builder, _test)


@pytest.mark.unit
def test_string():
    df = pd.DataFrame(dict(a=[1], b=[2], c=["a"], d=[True]))
    data_id, column_type = "1", "string"
    build_data_inst({data_id: df})

    cfg = {"cols": list(df.columns), "joinChar": "-"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == "1-2-a-True")


@pytest.mark.unit
def test_similarity():
    df = pd.DataFrame(dict(a=["a", "b", "c"], b=["d", "d", "d"]))
    data_id, column_type = "1", "similarity"
    build_data_inst({data_id: df})

    cfg = {"left": "a", "right": "b", "algo": "levenshtein", "normalized": False}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == 1)

    cfg = {"left": "a", "right": "b", "algo": "levenshtein", "normalized": True}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == 1)

    cfg = {
        "left": "a",
        "right": "b",
        "algo": "damerau-leveneshtein",
        "normalized": False,
    }
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == 1)

    cfg = {
        "left": "a",
        "right": "b",
        "algo": "damerau-leveneshtein",
        "normalized": True,
    }
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == 1)

    cfg = {"left": "a", "right": "b", "algo": "jaro-winkler"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.values[-1] == 1)

    if PY3:
        cfg = {
            "left": "a",
            "right": "b",
            "algo": "jaccard",
            "k": "4",
            "normalized": False,
        }
        builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
        verify_builder(builder, lambda col: col.values[-1] == 1)

        cfg = {
            "left": "a",
            "right": "b",
            "algo": "jaccard",
            "k": "4",
            "normalized": True,
        }
        builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
        verify_builder(builder, lambda col: col.values[-1] == 1)


@pytest.mark.unit
def test_standardize():
    df = pd.DataFrame(dict(a=randn(1000)))
    data_id, column_type = "1", "standardize"
    build_data_inst({data_id: df})

    cfg = {"col": "a", "algo": "power"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.isnull().sum() == 0)

    cfg = {"col": "a", "algo": "quantile"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.isnull().sum() == 0)

    cfg = {"col": "a", "algo": "robust"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.isnull().sum() == 0)


@pytest.mark.unit
def test_encoder():
    df = pd.DataFrame(
        {
            "car": ["Honda", "Benze", "Ford", "Honda", "Benze", "Ford", np.nan],
        }
    )
    data_id, column_type = "1", "encoder"
    build_data_inst({data_id: df})

    cfg = {"col": "car", "algo": "one_hot"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(
        builder,
        lambda col: all(
            [col[c].isnull().sum() == 0 for c in ["car_Ford", "car_Honda"]]
        ),
    )

    cfg = {"col": "car", "algo": "ordinal"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.isnull().sum() == 0)

    cfg = {"col": "car", "algo": "label"}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col.isnull().sum() == 0)

    cfg = {"col": "car", "algo": "feature_hasher", "n": 1}
    builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
    verify_builder(builder, lambda col: col["car_0"].isnull().sum() == 0)


@pytest.mark.unit
def test_diff():
    df = pd.DataFrame({"A": [9, 4, 2, 1]})
    data_id, column_type = "1", "diff"
    build_data_inst({data_id: df})

    cfg = {"col": "A", "periods": "1"}
    builder = ColumnBuilder(data_id, column_type, "dA", cfg)
    verify_builder(
        builder,
        lambda col: col.isnull().sum() == 1 and col.sum() == -8,
    )


@pytest.mark.unit
def test_data_slope():
    df = pd.DataFrame({"entity": [5, 7, 5, 5, 5, 6, 3, 2, 0, 5]})
    data_id, column_type = "1", "data_slope"
    build_data_inst({data_id: df})

    cfg = {"col": "entity"}
    builder = ColumnBuilder(data_id, column_type, "entity_data_slope", cfg)
    verify_builder(
        builder,
        lambda col: col.sum() == 35,
    )


@pytest.mark.unit
def test_rolling(rolling_data):
    import dtale.views as views

    df, _ = views.format_data(rolling_data)
    data_id, column_type = "1", "rolling"
    build_data_inst({data_id: df})

    cfg = {"col": "0", "comp": "mean", "window": "5", "min_periods": 1}
    builder = ColumnBuilder(data_id, column_type, "0_rolling_mean", cfg)
    verify_builder(
        builder,
        lambda col: col.isnull().sum() == 0,
    )

    cfg = {
        "col": "0",
        "comp": "mean",
        "window": "5",
        "min_periods": 1,
        "on": "date",
        "center": True,
    }
    builder = ColumnBuilder(data_id, column_type, "0_rolling_mean", cfg)
    verify_builder(
        builder,
        lambda col: col.isnull().sum() == 0,
    )


@pytest.mark.unit
def test_exponential_smoothing(rolling_data):
    import dtale.views as views

    df, _ = views.format_data(rolling_data)
    data_id, column_type = "1", "exponential_smoothing"
    build_data_inst({data_id: df})

    cfg = {"col": "0", "alpha": 0.3}
    builder = ColumnBuilder(data_id, column_type, "0_exp_smooth", cfg)
    verify_builder(
        builder,
        lambda col: col.isnull().sum() == 0,
    )


@pytest.mark.unit
def test_shift(rolling_data):
    import dtale.views as views

    df, _ = views.format_data(rolling_data)
    data_id, column_type = "1", "shift"
    build_data_inst({data_id: df})

    cfg = {"col": "0", "periods": 3, "fillValue": -1, "dtype": "int64"}
    builder = ColumnBuilder(data_id, column_type, "0_shift", cfg)

    def verify(col):
        assert col.isnull().sum() == 0
        return col.values[2] == -1

    verify_builder(builder, verify)


@pytest.mark.unit
def test_expanding():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame({"B": [0, 1, 2, np.nan, 4]}))
    data_id, column_type = "1", "expanding"
    build_data_inst({data_id: df})

    cfg = {"col": "B", "periods": 2, "agg": "sum"}
    builder = ColumnBuilder(data_id, column_type, "B_expanding", cfg)

    def verify(col):
        assert col.isnull().sum() == 1
        return list(col.dropna().values) == [1.0, 3.0, 3.0, 7.0]

    verify_builder(builder, verify)


@pytest.mark.unit
def test_concatenate():
    df = pd.DataFrame(dict(a=["a"], b=["b"]))

    data_id, column_type = "1", "concatenate"
    build_data_inst({data_id: df})

    cfg = dict(left=dict(col="a"), right=dict(col="b"))
    builder = ColumnBuilder(data_id, column_type, "a_b", cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")

    cfg = dict(left=dict(col="a"), right=dict(val="b"))
    builder = ColumnBuilder(data_id, column_type, "a_b2", cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_replace():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame({"A": ["foo_bar"]}))
    data_id, column_type = "1", "replace"
    build_data_inst({data_id: df})

    cfg = {"col": "A", "search": "_bar", "replacement": "_baz"}
    builder = ColumnBuilder(data_id, column_type, "A_replace", cfg)
    verify_builder(builder, lambda col: col.values[0] == "foo_baz")
