import numpy as np

from sklearn import tree
from sklearn import preprocessing
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, f1_score

import pandas as pd
from pandas.api.types import (
    is_numeric_dtype,
    is_bool_dtype,
    is_object_dtype,
    is_categorical_dtype,
    is_string_dtype,
    is_datetime64_any_dtype,
    is_timedelta64_dtype,
)


NOT_SUPPORTED_ANYMORE = "NOT_SUPPORTED_ANYMORE"
TO_BE_CALCULATED = -1


def _calculate_model_cv_score_(
    df, target, feature, task, cross_validation, random_seed, **kwargs
):
    "Calculates the mean model score based on cross-validation"
    # Sources about the used methods:
    # https://scikit-learn.org/stable/modules/tree.html
    # https://scikit-learn.org/stable/modules/cross_validation.html
    # https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_score.html
    metric = task["metric_key"]
    model = task["model"]
    # shuffle the rows - this is important for cross-validation
    # because the cross-validation just takes the first n lines
    # if there is a strong pattern in the rows eg 0,0,0,0,1,1,1,1
    # then this will lead to problems because the first cv sees mostly 0 and the later 1
    # this approach might be wrong for timeseries because it might leak information
    df = df.sample(frac=1, random_state=random_seed, replace=False)

    # preprocess target
    if task["type"] == "classification":
        label_encoder = preprocessing.LabelEncoder()
        df[target] = label_encoder.fit_transform(df[target])
        target_series = df[target]
    else:
        target_series = df[target]

    # preprocess feature
    if _dtype_represents_categories(df[feature]):
        one_hot_encoder = preprocessing.OneHotEncoder()
        array = df[feature].__array__()
        sparse_matrix = one_hot_encoder.fit_transform(array.reshape(-1, 1))
        feature_input = sparse_matrix
    else:
        # reshaping needed because there is only 1 feature
        array = df[feature].values
        if not isinstance(array, np.ndarray):  # e.g Int64 IntegerArray
            array = array.to_numpy()
        feature_input = array.reshape(-1, 1)

    # Cross-validation is stratifiedKFold for classification, KFold for regression
    # CV on one core (n_job=1; default) has shown to be fastest
    scores = cross_val_score(
        model,
        feature_input,
        target_series.to_numpy(),
        cv=cross_validation,
        scoring=metric,
    )

    return scores.mean()


def _normalized_mae_score(model_mae, naive_mae):
    "Normalizes the model MAE score, given the baseline score"
    # # Value range of MAE is [0, infinity), 0 is best
    # 10, 5 ==> 0 because worse than naive
    # 10, 20 ==> 0.5
    # 5, 20 ==> 0.75 = 1 - (mae/base_mae)
    if model_mae > naive_mae:
        return 0
    else:
        return 1 - (model_mae / naive_mae)


def _mae_normalizer(df, y, model_score, **kwargs):
    "In case of MAE, calculates the baseline score for y and derives the PPS."
    df["naive"] = df[y].median()
    baseline_score = mean_absolute_error(
        df[y].to_numpy(), df["naive"].to_numpy()
    )  # true, pred

    ppscore = _normalized_mae_score(abs(model_score), baseline_score)
    return ppscore, baseline_score


def _normalized_f1_score(model_f1, baseline_f1):
    "Normalizes the model F1 score, given the baseline score"
    # # F1 ranges from 0 to 1
    # # 1 is best
    # 0.5, 0.7 ==> 0 because model is worse than naive baseline
    # 0.75, 0.5 ==> 0.5
    #
    if model_f1 < baseline_f1:
        return 0
    else:
        scale_range = 1.0 - baseline_f1  # eg 0.3
        f1_diff = model_f1 - baseline_f1  # eg 0.1
        return f1_diff / scale_range  # 0.1/0.3 = 0.33


def _f1_normalizer(df, y, model_score, random_seed):
    "In case of F1, calculates the baseline score for y and derives the PPS."
    label_encoder = preprocessing.LabelEncoder()
    df["truth"] = label_encoder.fit_transform(df[y])
    df["most_common_value"] = df["truth"].value_counts().index[0]
    random = df["truth"].sample(frac=1, random_state=random_seed)

    baseline_score = max(
        f1_score(df["truth"], df["most_common_value"], average="weighted"),
        f1_score(df["truth"], random, average="weighted"),
    )

    ppscore = _normalized_f1_score(model_score, baseline_score)
    return ppscore, baseline_score


VALID_CALCULATIONS = {
    "regression": {
        "type": "regression",
        "is_valid_score": True,
        "model_score": TO_BE_CALCULATED,
        "baseline_score": TO_BE_CALCULATED,
        "ppscore": TO_BE_CALCULATED,
        "metric_name": "mean absolute error",
        "metric_key": "neg_mean_absolute_error",
        "model": tree.DecisionTreeRegressor(),
        "score_normalizer": _mae_normalizer,
    },
    "classification": {
        "type": "classification",
        "is_valid_score": True,
        "model_score": TO_BE_CALCULATED,
        "baseline_score": TO_BE_CALCULATED,
        "ppscore": TO_BE_CALCULATED,
        "metric_name": "weighted F1",
        "metric_key": "f1_weighted",
        "model": tree.DecisionTreeClassifier(),
        "score_normalizer": _f1_normalizer,
    },
    "predict_itself": {
        "type": "predict_itself",
        "is_valid_score": True,
        "model_score": 1,
        "baseline_score": 0,
        "ppscore": 1,
        "metric_name": None,
        "metric_key": None,
        "model": None,
        "score_normalizer": None,
    },
    "target_is_constant": {
        "type": "target_is_constant",
        "is_valid_score": True,
        "model_score": 1,
        "baseline_score": 1,
        "ppscore": 0,
        "metric_name": None,
        "metric_key": None,
        "model": None,
        "score_normalizer": None,
    },
    "target_is_id": {
        "type": "target_is_id",
        "is_valid_score": True,
        "model_score": 0,
        "baseline_score": 0,
        "ppscore": 0,
        "metric_name": None,
        "metric_key": None,
        "model": None,
        "score_normalizer": None,
    },
    "feature_is_id": {
        "type": "feature_is_id",
        "is_valid_score": True,
        "model_score": 0,
        "baseline_score": 0,
        "ppscore": 0,
        "metric_name": None,
        "metric_key": None,
        "model": None,
        "score_normalizer": None,
    },
}

INVALID_CALCULATIONS = [
    "target_is_datetime",
    "target_data_type_not_supported",
    "empty_dataframe_after_dropping_na",
    "unknown_error",
]


def _dtype_represents_categories(series):
    "Determines if the dtype of the series represents categorical values"
    return (
        is_bool_dtype(series)
        or is_object_dtype(series)
        or is_string_dtype(series)
        or is_categorical_dtype(series)
    )


def _determine_case_and_prepare_df(df, x, y, sample=5000, random_seed=123):
    "Returns str with the name of the determined case based on the columns x and y"
    if x == y:
        return df, "predict_itself"

    df = df[[x, y]]
    # IDEA: log.warning when values have been dropped
    df = df.dropna()

    if len(df) == 0:
        return df, "empty_dataframe_after_dropping_na"
        # IDEA: show warning
        # raise Exception(
        #     "After dropping missing values, there are no valid rows left"
        # )

    df = _maybe_sample(df, sample, random_seed=random_seed)

    if _feature_is_id(df, x):
        return df, "feature_is_id"

    category_count = df[y].value_counts().count()
    if category_count == 1:
        # it is helpful to separate this case in order to save unnecessary calculation time
        return df, "target_is_constant"
    if _dtype_represents_categories(df[y]) and (category_count == len(df[y])):
        # it is important to separate this case in order to save unnecessary calculation time
        return df, "target_is_id"

    if _dtype_represents_categories(df[y]):
        return df, "classification"
    if is_numeric_dtype(df[y]):
        # this check needs to be after is_bool_dtype (which is part of _dtype_represents_categories) because bool
        # is considered numeric by pandas
        return df, "regression"

    if is_datetime64_any_dtype(df[y]) or is_timedelta64_dtype(df[y]):
        # IDEA: show warning
        # raise TypeError((
        #     f"The target column {y} has the dtype {df[y].dtype} which is not supported. "
        #     f"A possible solution might be to convert {y} to a string column"
        # ))
        return df, "target_is_datetime"

    # IDEA: show warning
    # raise Exception(
    #     f"Could not infer a valid task based on the target {y}. The dtype {df[y].dtype} is not yet supported"
    # )  # pragma: no cover
    return df, "target_data_type_not_supported"


def _feature_is_id(df, x):
    "Returns Boolean if the feature column x is an ID"
    if not _dtype_represents_categories(df[x]):
        return False

    category_count = df[x].value_counts().count()
    return category_count == len(df[x])


def _maybe_sample(df, sample, random_seed=None):
    """
    Maybe samples the rows of the given df to have at most `sample` rows
    If sample is `None` or falsy, there will be no sampling.
    If the df has fewer rows than the sample, there will be no sampling.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe that might be sampled
    sample : int or `None`
        Number of rows to be sampled
    random_seed : int or `None`
        Random seed that is forwarded to pandas.DataFrame.sample as `random_state`

    Returns
    -------
    pandas.DataFrame
        DataFrame after potential sampling
    """
    if sample and len(df) > sample:
        # this is a problem if x or y have more than sample=5000 categories
        # TODO: dont sample when the problem occurs and show warning
        df = df.sample(sample, random_state=random_seed, replace=False)
    return df


def _is_column_in_df(column, df):
    try:
        return column in df.columns
    except BaseException:
        return False


def _score(
    df, x, y, task, sample, cross_validation, random_seed, invalid_score, catch_errors
):
    df, case_type = _determine_case_and_prepare_df(
        df, x, y, sample=sample, random_seed=random_seed
    )
    task = _get_task(case_type, invalid_score)

    if case_type in ["classification", "regression"]:
        model_score = _calculate_model_cv_score_(
            df,
            target=y,
            feature=x,
            task=task,
            cross_validation=cross_validation,
            random_seed=random_seed,
        )
        # IDEA: the baseline_scores do sometimes change significantly, e.g. for F1 and thus change the PPS
        # we might want to calculate the baseline_score 10 times and use the mean in order to have less variance
        ppscore, baseline_score = task["score_normalizer"](
            df, y, model_score, random_seed=random_seed
        )
    else:
        model_score = task["model_score"]
        baseline_score = task["baseline_score"]
        ppscore = task["ppscore"]

    return {
        "x": x,
        "y": y,
        "ppscore": ppscore,
        "case": case_type,
        "is_valid_score": task["is_valid_score"],
        "metric": task["metric_name"],
        "baseline_score": baseline_score,
        "model_score": abs(model_score),  # sklearn returns negative mae
        "model": task["model"],
    }


def score(
    df,
    x,
    y,
    task=NOT_SUPPORTED_ANYMORE,
    sample=5000,
    cross_validation=4,
    random_seed=123,
    invalid_score=0,
    catch_errors=True,
):
    """
    Calculate the Predictive Power Score (PPS) for "x predicts y"
    The score always ranges from 0 to 1 and is data-type agnostic.

    A score of 0 means that the column x cannot predict the column y better than a naive baseline model.
    A score of 1 means that the column x can perfectly predict the column y given the model.
    A score between 0 and 1 states the ratio of how much potential predictive power the model achieved compared
    to the baseline model.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataframe that contains the columns x and y
    x : str
        Name of the column x which acts as the feature
    y : str
        Name of the column y which acts as the target
    sample : int or `None`
        Number of rows for sampling. The sampling decreases the calculation time of the PPS.
        If `None` there will be no sampling.
    cross_validation : int
        Number of iterations during cross-validation. This has the following implications:
        For example, if the number is 4, then it is possible to detect patterns when there are at least 4 times the same
        observation. If the limit is increased, the required minimum observations also increase. This is important,
        because this is the limit when sklearn will throw an error and the PPS cannot be calculated
    random_seed : int or `None`
        Random seed for the parts of the calculation that require random numbers, e.g. shuffling or sampling.
        If the value is set, the results will be reproducible. If the value is `None` a new random number is drawn at
        the start of each calculation.
    invalid_score : any
        The score that is returned when a calculation is invalid, e.g. because the data type was not supported.
    catch_errors : bool
        If `True` all errors will be catched and reported as `unknown_error` which ensures convenience. If `False`
        errors will be raised. This is helpful for inspecting and debugging errors.

    Returns
    -------
    Dict
        A dict that contains multiple fields about the resulting PPS.
        The dict enables introspection into the calculations that have been performed under the hood
    """

    if not isinstance(df, pd.DataFrame):
        raise TypeError(
            (
                "The 'df' argument should be a pandas.DataFrame but you passed a {}\n"
                "Please convert your input to a pandas.DataFrame"
            ).format(type(df))
        )
    if not _is_column_in_df(x, df):
        raise ValueError(
            (
                "The 'x' argument should be the name of a dataframe column but the variable that you passed is not "
                "a column in the given dataframe.\nPlease review the column name or your dataframe"
            )
        )
    if len(df[[x]].columns) >= 2:
        raise AssertionError(
            (
                "The dataframe has {} columns with the same column name {}\n"
                "Please adjust the dataframe and make sure that only 1 column has the name {}"
            ).format(len(df[[x]].columns), x, x)
        )
    if not _is_column_in_df(y, df):
        raise ValueError(
            (
                "The 'y' argument should be the name of a dataframe column but the variable that you passed is not a "
                "column in the given dataframe.\nPlease review the column name or your dataframe"
            )
        )
    if len(df[[y]].columns) >= 2:
        raise AssertionError(
            (
                "The dataframe has {} columns with the same column name {}\n"
                "Please adjust the dataframe and make sure that only 1 column has the name {}"
            ).format(len(df[[y]].columns), y, y)
        )
    if task is not NOT_SUPPORTED_ANYMORE:
        raise AttributeError(
            (
                "The attribute 'task' is no longer supported because it led to confusion and inconsistencies.\n"
                "The task of the model is now determined based on the data types of the columns. "
                "If you want to change the task please adjust the data type of the column.\n"
                "For more details, please refer to the README"
            )
        )

    if random_seed is None:
        from random import random

        random_seed = int(random() * 1000)

    try:
        return _score(
            df,
            x,
            y,
            task,
            sample,
            cross_validation,
            random_seed,
            invalid_score,
            catch_errors,
        )
    except Exception as exception:
        if catch_errors:
            case_type = "unknown_error"
            task = _get_task(case_type, invalid_score)
            return {
                "x": x,
                "y": y,
                "ppscore": task["ppscore"],
                "case": case_type,
                "is_valid_score": task["is_valid_score"],
                "metric": task["metric_name"],
                "baseline_score": task["baseline_score"],
                "model_score": task["model_score"],  # sklearn returns negative mae
                "model": task["model"],
            }
        else:
            raise exception


def _get_task(case_type, invalid_score):
    if case_type in VALID_CALCULATIONS.keys():
        return VALID_CALCULATIONS[case_type]
    elif case_type in INVALID_CALCULATIONS:
        return {
            "type": case_type,
            "is_valid_score": False,
            "model_score": invalid_score,
            "baseline_score": invalid_score,
            "ppscore": invalid_score,
            "metric_name": None,
            "metric_key": None,
            "model": None,
            "score_normalizer": None,
        }
    raise Exception("case_type {} is not supported".format(case_type))


def _format_list_of_dicts(scores, output, sorted):
    """
    Format list of score dicts `scores`
    - maybe sort by ppscore
    - maybe return pandas.Dataframe
    - output can be one of ["df", "list"]
    """
    if sorted:
        scores.sort(key=lambda item: item["ppscore"], reverse=True)

    if output == "df":
        df_columns = [
            "x",
            "y",
            "ppscore",
            "case",
            "is_valid_score",
            "metric",
            "baseline_score",
            "model_score",
            "model",
        ]
        data = {column: [score[column] for score in scores] for column in df_columns}
        scores = pd.DataFrame.from_dict(data)

    return scores


def predictors(df, y, output="df", sorted=True, **kwargs):
    """
    Calculate the Predictive Power Score (PPS) of all the features in the dataframe
    against a target column

    Parameters
    ----------
    df : pandas.DataFrame
        The dataframe that contains the data
    y : str
        Name of the column y which acts as the target
    output: str - potential values: "df", "list"
        Control the type of the output. Either return a pandas.DataFrame (df) or a list with the score dicts
    sorted: bool
        Whether or not to sort the output dataframe/list by the ppscore
    kwargs:
        Other key-word arguments that shall be forwarded to the pps.score method,
        e.g. `sample, `cross_validation, `random_seed, `invalid_score`, `catch_errors`

    Returns
    -------
    pandas.DataFrame or list of Dict
        Either returns a tidy dataframe or a list of all the PPS dicts. This can be influenced
        by the output argument
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError(
            (
                "The 'df' argument should be a pandas.DataFrame but you passed a {}\n"
                "Please convert your input to a pandas.DataFrame"
            ).format(type(df))
        )
    if not _is_column_in_df(y, df):
        raise ValueError(
            (
                "The 'y' argument should be the name of a dataframe column but the variable that you passed is not "
                "a column in the given dataframe.\nPlease review the column name or your dataframe"
            )
        )
    if len(df[[y]].columns) >= 2:
        raise AssertionError(
            (
                "The dataframe has {} columns with the same column name {}\n"
                "Please adjust the dataframe and make sure that only 1 column has the name {}"
            ).format(len(df[[y]].columns), y, y)
        )
    if output not in ["df", "list"]:
        raise ValueError(
            (
                """The 'output' argument should be one of ["df", "list"] but you passed: {}\n"""
                "Please adjust your input to one of the valid values"
            ).format(output)
        )
    if sorted not in [True, False]:
        raise ValueError(
            (
                """The 'sorted' argument should be one of [True, False] but you passed: {}\n"""
                "Please adjust your input to one of the valid values"
            ).format(sorted)
        )

    scores = [score(df, column, y, **kwargs) for column in df if column != y]

    return _format_list_of_dicts(scores=scores, output=output, sorted=sorted)


def matrix(df, output="df", sorted=False, **kwargs):
    """
    Calculate the Predictive Power Score (PPS) matrix for all columns in the dataframe

    Parameters
    ----------
    df : pandas.DataFrame
        The dataframe that contains the data
    output: str - potential values: "df", "list"
        Control the type of the output. Either return a pandas.DataFrame (df) or a list with the score dicts
    sorted: bool
        Whether or not to sort the output dataframe/list by the ppscore
    kwargs:
        Other key-word arguments that shall be forwarded to the pps.score method,
        e.g. `sample, `cross_validation, `random_seed, `invalid_score`, `catch_errors`

    Returns
    -------
    pandas.DataFrame or list of Dict
        Either returns a tidy dataframe or a list of all the PPS dicts. This can be influenced
        by the output argument
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError(
            (
                "The 'df' argument should be a pandas.DataFrame but you passed a {}\n"
                "Please convert your input to a pandas.DataFrame"
            ).format(type(df))
        )
    if output not in ["df", "list"]:
        raise ValueError(
            (
                """The 'output' argument should be one of ["df", "list"] but you passed: {}\n"""
                "Please adjust your input to one of the valid values"
            ).format(output)
        )
    if sorted not in [True, False]:
        raise ValueError(
            (
                """The 'sorted' argument should be one of [True, False] but you passed: {}\n"""
                "Please adjust your input to one of the valid values"
            ).format(sorted)
        )

    scores = [score(df, x, y, **kwargs) for x in df for y in df]

    return _format_list_of_dicts(scores=scores, output=output, sorted=sorted)
