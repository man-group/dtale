import mock
import numpy as np
import pandas as pd
import pytest
from numpy.random import randn
from six import PY3

from dtale.column_builders import ColumnBuilder, ZERO_STD_ERROR

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


def verify_builder(builder, checker):
    assert checker(builder.build_column())
    assert builder.build_code()


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
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

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
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

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
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), {"col": "i"})
        verify_builder(builder, lambda col: col.sum() == 4.440892098500626e-16)

        with pytest.raises(BaseException) as error:
            builder = ColumnBuilder(
                data_id, column_type, "Col{}".format(++i), {"col": "a"}
            )
            builder.build_column()
            assert ZERO_STD_ERROR in str(error.value)


@pytest.mark.unit
def test_string():
    df = pd.DataFrame(dict(a=[1], b=[2], c=["a"], d=[True]))
    data_id, column_type = "1", "string"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

        cfg = {"cols": list(df.columns), "joinChar": "-"}
        builder = ColumnBuilder(data_id, column_type, "Col1", cfg)
        verify_builder(builder, lambda col: col.values[-1] == "1-2-a-True")


@pytest.mark.unit
def test_similarity():
    df = pd.DataFrame(dict(a=["a", "b", "c"], b=["d", "d", "d"]))
    data_id, column_type = "1", "similarity"
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

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
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

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
    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.global_state.DATA", {data_id: df}))

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
