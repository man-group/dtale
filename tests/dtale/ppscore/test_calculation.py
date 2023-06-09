# # -*- coding: utf-8 -*-

import os
import pytest
import pandas as pd
import numpy as np
import sys

import dtale.ppscore as pps
from dtale.pandas_util import check_pandas_version


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test__normalized_f1_score():
    from dtale.ppscore.calculation import _normalized_f1_score

    assert _normalized_f1_score(0.4, 0.5) == 0
    assert _normalized_f1_score(0.75, 0.5) == 0.5


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test__normalized_mae_score():
    from dtale.ppscore.calculation import _normalized_mae_score

    assert _normalized_mae_score(10, 5) == 0
    assert _normalized_mae_score(5, 10) == 0.5


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test__determine_case_and_prepare_df():
    from dtale.ppscore.calculation import _determine_case_and_prepare_df

    df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "..", "..", "data/titanic.csv")
    )
    df = df.rename(
        columns={
            "Age": "Age_float",
            "Pclass": "Pclass_integer",
            "Survived": "Survived_integer",
            "Ticket": "Ticket_object",
            "Name": "Name_object_id",
        }
    )

    df["x"] = 1  # x is irrelevant for this test
    df["constant"] = 1
    df["Pclass_category"] = df["Pclass_integer"].astype("category")
    df["Pclass_datetime"] = pd.to_datetime(
        df["Pclass_integer"], infer_datetime_format=True
    )
    df["Survived_boolean"] = df["Survived_integer"].astype(bool)
    df["Cabin_string"] = pd.Series(
        df["Cabin"].apply(str),
        dtype="string" if check_pandas_version("1.1.0") else "object",
    )

    # check regression
    assert _determine_case_and_prepare_df(df, "x", "Age_float")[1] == "regression"
    assert _determine_case_and_prepare_df(df, "x", "Pclass_integer")[1] == "regression"

    # check classification
    assert (
        _determine_case_and_prepare_df(df, "x", "Pclass_category")[1]
        == "classification"
    )
    assert (
        _determine_case_and_prepare_df(df, "x", "Survived_boolean")[1]
        == "classification"
    )
    assert (
        _determine_case_and_prepare_df(df, "x", "Ticket_object")[1] == "classification"
    )
    assert (
        _determine_case_and_prepare_df(df, "x", "Cabin_string")[1] == "classification"
    )

    # check special cases
    assert (
        _determine_case_and_prepare_df(df, "Name_object_id", "x")[1] == "feature_is_id"
    )
    assert _determine_case_and_prepare_df(df, "x", "x")[1] == "predict_itself"
    assert (
        _determine_case_and_prepare_df(df, "x", "constant")[1] == "target_is_constant"
    )
    assert (
        _determine_case_and_prepare_df(df, "x", "Name_object_id")[1] == "target_is_id"
    )
    assert (
        _determine_case_and_prepare_df(df, "x", "Pclass_datetime")[1]
        == "target_is_datetime"
    )


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test__maybe_sample():
    from dtale.ppscore.calculation import _maybe_sample

    df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "..", "..", "data/titanic.csv")
    )
    assert len(_maybe_sample(df, 10)) == 10


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test_score():
    df = pd.DataFrame()
    df["x"] = np.random.uniform(-2, 2, 1000)
    df["error"] = np.random.uniform(-0.5, 0.5, 1000)
    df["y"] = df["x"] * df["x"] + df["error"]

    df["constant"] = 1
    df = df.reset_index()
    df["id"] = df["index"].astype(str)

    df["x_greater_0_boolean"] = df["x"] > 0
    # df["x_greater_0_string"] = df["x_greater_0_boolean"].astype(str)
    df["x_greater_0_string"] = pd.Series(
        df["x_greater_0_boolean"].apply(str),
        dtype="string" if check_pandas_version("1.1.0") else "object",
    )
    df["x_greater_0_string_object"] = df["x_greater_0_string"].astype("object")
    df["x_greater_0_string_category"] = df["x_greater_0_string"].astype("category")

    df["x_greater_0_boolean_object"] = df["x_greater_0_boolean"].astype("object")
    df["x_greater_0_boolean_category"] = df["x_greater_0_boolean"].astype("category")

    df["nan"] = np.nan

    duplicate_column_names_df = pd.DataFrame()
    duplicate_column_names_df["x1"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df["x2"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df["unique_column_name"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df.columns = [
        "duplicate_column_name",
        "duplicate_column_name",
        "unique_column_name",
    ]

    dtypes_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "..", "..", "data/titanic.csv")
    )
    dtypes_df = dtypes_df.rename(
        columns={
            "Age": "Age_float",
            "Sex": "Sex_object",
            "Pclass": "Pclass_integer",
            "Survived": "Survived_integer",
            "Ticket": "Ticket_object",
            "Name": "Name_object_id",
        }
    )
    dtypes_df["Survived_Int64"] = dtypes_df["Survived_integer"].astype("Int64")

    # check input types
    with pytest.raises(TypeError):
        numpy_array = np.random.randn(10, 10)  # not a DataFrame
        pps.score(numpy_array, "x", "y")

    with pytest.raises(ValueError):
        pps.score(df, "x_column_that_does_not_exist", "y")

    with pytest.raises(ValueError):
        pps.score(df, "x", "y_column_that_does_not_exist")

    with pytest.raises(AttributeError):
        # the task argument is not supported any more
        pps.score(df, "x", "y", task="classification")

    with pytest.raises(AssertionError):
        # df shall not have duplicate column names
        pps.score(
            duplicate_column_names_df, "duplicate_column_name", "unique_column_name"
        )

    with pytest.raises(AssertionError):
        # df shall not have duplicate column names
        pps.score(
            duplicate_column_names_df, "unique_column_name", "duplicate_column_name"
        )

    if check_pandas_version("1.0.0"):
        # check cross_validation
        # if more folds than data, there is an error
        with pytest.raises(ValueError):
            assert pps.score(df, "x", "y", cross_validation=2000, catch_errors=False)

        # check random_seed
        assert pps.score(df, "x", "y", random_seed=1) == pps.score(
            df, "x", "y", random_seed=1
        )
        assert pps.score(df, "x", "y", random_seed=1) != pps.score(
            df, "x", "y", random_seed=2
        )
        # the random seed that is drawn automatically is smaller than <1000
        assert pps.score(df, "x", "y") != pps.score(df, "x", "y", random_seed=123456)

        # check invalid_score
        invalid_score = -99
        assert (
            pps.score(df, "nan", "y", invalid_score=invalid_score)["ppscore"]
            == invalid_score
        )

        # check catch_errors using the cross_validation error from above
        assert (
            pps.score(
                df,
                "x",
                "y",
                cross_validation=2000,
                invalid_score=invalid_score,
                catch_errors=True,
            )["ppscore"]
            == invalid_score
        )

        # check case discrimination
        assert pps.score(df, "x", "y")["case"] == "regression"
        assert pps.score(df, "x", "x_greater_0_string")["case"] == "classification"
        assert pps.score(df, "x", "constant")["case"] == "target_is_constant"
        assert pps.score(df, "x", "x")["case"] == "predict_itself"
        assert pps.score(df, "x", "id")["case"] == "target_is_id"
        assert pps.score(df, "nan", "y")["case"] == "empty_dataframe_after_dropping_na"

        # check scores
        # feature is id
        assert pps.score(df, "id", "y")["ppscore"] == 0

        # numeric feature and target
        assert pps.score(df, "x", "y")["ppscore"] > 0.5
        assert pps.score(df, "y", "x")["ppscore"] < 0.05

        # boolean feature or target
        assert pps.score(df, "x", "x_greater_0_boolean")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_boolean", "x")["ppscore"] < 0.6

        # string feature or target
        assert pps.score(df, "x", "x_greater_0_string")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_string", "x")["ppscore"] < 0.6

        # object feature or target
        assert pps.score(df, "x", "x_greater_0_string_object")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_string_object", "x")["ppscore"] < 0.6

        # category feature or target
        assert pps.score(df, "x", "x_greater_0_string_category")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_string_category", "x")["ppscore"] < 0.6

        # object feature or target
        assert pps.score(df, "x", "x_greater_0_boolean_object")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_boolean_object", "x")["ppscore"] < 0.6

        # category feature or target
        assert pps.score(df, "x", "x_greater_0_boolean_category")["ppscore"] > 0.6
        assert pps.score(df, "x_greater_0_boolean_category", "x")["ppscore"] < 0.6

        # check special dtypes
        # pd.IntegerArray e.g. Int64, Int8, etc
        assert (
            pps.score(dtypes_df, "Survived_Int64", "Sex_object")["is_valid_score"]
            is True
        )
        assert (
            pps.score(dtypes_df, "Sex_object", "Survived_Int64")["is_valid_score"]
            is True
        )


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test_predictors():
    y = "Survived"
    df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "..", "..", "data/titanic.csv")
    )
    df = df[["Age", y]]

    duplicate_column_names_df = pd.DataFrame()
    duplicate_column_names_df["x1"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df["x2"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df["unique_column_name"] = np.random.uniform(-2, 2, 10)
    duplicate_column_names_df.columns = [
        "duplicate_column_name",
        "duplicate_column_name",
        "unique_column_name",
    ]

    # check input types
    with pytest.raises(TypeError):
        numpy_array = np.random.randn(10, 10)  # not a DataFrame
        pps.predictors(numpy_array, y)

    with pytest.raises(ValueError):
        pps.predictors(df, "y_column_that_does_not_exist")

    with pytest.raises(ValueError):
        pps.predictors(df, y, output="invalid_output_type")

    with pytest.raises(ValueError):
        pps.predictors(df, y, sorted="invalid_value_for_sorted")

    with pytest.raises(AssertionError):
        # df shall not have duplicate column names
        pps.predictors(duplicate_column_names_df, "duplicate_column_name")

    # check return types
    result_df = pps.predictors(df, y)
    assert isinstance(result_df, pd.DataFrame)
    assert y not in result_df.index

    list_of_dicts = pps.predictors(df, y, output="list")
    assert isinstance(list_of_dicts, list)
    assert isinstance(list_of_dicts[0], dict)

    # the underlying calculations are tested as part of test_score


@pytest.mark.skipif(sys.version_info < (3, 6), reason="requires python 3.6 or higher")
def test_matrix():
    df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "..", "..", "data/titanic.csv")
    )
    df = df[["Age", "Survived"]]
    df["Age_datetime"] = pd.to_datetime(df["Age"], infer_datetime_format=True)
    subset_df = df[["Survived", "Age_datetime"]]

    # check input types
    with pytest.raises(TypeError):
        numpy_array = np.random.randn(10, 10)  # not a DataFrame
        pps.matrix(numpy_array)

    with pytest.raises(ValueError):
        pps.matrix(df, output="invalid_output_type")

    # check return types
    assert isinstance(pps.matrix(df), pd.DataFrame)
    assert isinstance(pps.matrix(df, output="list"), list)

    # matrix catches single score errors under the hood
    invalid_score = [
        score
        for score in pps.matrix(subset_df, output="list")
        if (score["x"] == "Survived" and score["y"] == "Age_datetime")
    ][0]
    assert invalid_score["ppscore"] == 0
