import mock
import pytest
import pandas as pd

import dtale.global_state as global_state
import dtale.predefined_filters as predefined_filters
from dtale.query import handle_predefined

from tests import ExitStack


@pytest.mark.unit
def test_set_filters(unittest):
    filters = []
    df = pd.DataFrame(
        ([[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18]]),
        columns=["A", "B", "C", "D", "E", "F"],
    )
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("dtale.predefined_filters.PREDEFINED_FILTERS", filters)
        )
        predefined_filters.set_filters(
            [
                {
                    "name": "A and B > 2",
                    "column": "A",
                    "description": "Filter A with B greater than 2",
                    "handler": lambda df, val: df[(df["A"] == val) & (df["B"] > 2)],
                    "input_type": "input",
                },
                {
                    "name": "A and (B % 2) == 0",
                    "column": "A",
                    "description": "Filter A with B mod 2 equals zero (is even)",
                    "handler": lambda df, val: df[
                        (df["A"] == val) & (df["B"] % 2 == 0)
                    ],
                    "input_type": "select",
                },
                {
                    "name": "A in values and (B % 2) == 0",
                    "column": "A",
                    "description": "A is within a group of values and B mod 2 equals zero (is even)",
                    "handler": lambda df, val: df[
                        df["A"].isin(val) & (df["B"] % 2 == 0)
                    ],
                    "input_type": "multiselect",
                },
            ]
        )

        assert len(predefined_filters.get_filters()[0].handler(df, 1)) == 0
        assert len(predefined_filters.get_filters()[0].handler(df, 7)) == 1
        unittest.assertEqual(
            predefined_filters.get_filters()[0].asdict(),
            {
                "name": "A and B > 2",
                "column": "A",
                "description": "Filter A with B greater than 2",
                "inputType": "input",
                "default": None,
                "active": True,
            },
        )

        assert len(predefined_filters.get_filters()[1].handler(df, 1)) == 1
        assert len(predefined_filters.get_filters()[1].handler(df, 7)) == 1

        assert len(predefined_filters.get_filters()[2].handler(df, [1])) == 1
        assert len(predefined_filters.get_filters()[2].handler(df, [1, 7])) == 2

        global_state.set_data("1", df)
        assert len(handle_predefined("1")) == 3

        global_state.set_settings(
            "1", dict(predefinedFilters={"A and B > 2": {"value": 7, "active": True}})
        )
        assert len(handle_predefined("1")) == 1

        global_state.set_settings(
            "1", dict(predefinedFilters={"A and B > 2": {"value": 7, "active": False}})
        )
        assert len(handle_predefined("1")) == 3


@pytest.mark.unit
def test_add_filters():
    filters = []
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("dtale.predefined_filters.PREDEFINED_FILTERS", filters)
        )
        predefined_filters.set_filters(
            [
                {
                    "name": "A and B > 2",
                    "column": "A",
                    "description": "Filter A with B greater than 2",
                    "handler": lambda df, val: df[(df["A"] == val) & (df["B"] > 2)],
                    "input_type": "input",
                }
            ]
        )
        assert len(predefined_filters.get_filters()) == 1
        predefined_filters.add_filters(
            [
                {
                    "name": "A and (B % 2) == 0",
                    "column": "A",
                    "description": "Filter A with B mod 2 equals zero (is even)",
                    "handler": lambda df, val: df[
                        (df["A"] == val) & (df["B"] % 2 == 0)
                    ],
                    "input_type": "select",
                }
            ]
        )
        assert len(predefined_filters.get_filters()) == 2
        with pytest.raises(ValueError) as error:
            predefined_filters.add_filters(
                [
                    {
                        "name": "A and (B % 2) == 0",
                        "column": "A",
                        "description": "Filter A with B mod 2 equals zero (is even)",
                        "handler": lambda df, val: df[
                            (df["A"] == val) & (df["B"] % 2 == 0)
                        ],
                        "input_type": "select",
                    }
                ]
            )
            assert (
                "A predefined_filters filter already exists for A and (B % 2) == 0"
                in str(error.value)
            )


@pytest.mark.unit
def test_invalid_filters():
    with pytest.raises(AssertionError):
        predefined_filters.set_filters([{}])
    with pytest.raises(AssertionError):
        predefined_filters.set_filters([{"name": "foo"}])
    with pytest.raises(AssertionError):
        predefined_filters.set_filters([{"name": "foo", "column": "bar"}])
    with pytest.raises(AssertionError):
        predefined_filters.set_filters(
            [{"name": "foo", "column": "bar", "handler": lambda x: x}]
        )
    with pytest.raises(AssertionError):
        predefined_filters.set_filters(
            [
                {
                    "name": "foo",
                    "column": "bar",
                    "handler": lambda df, val: df[
                        (df["A"] == val) & (df["B"] % 2 == 0)
                    ],
                }
            ]
        )
    with pytest.raises(AssertionError):
        predefined_filters.set_filters(
            [
                {
                    "name": "foo",
                    "column": "bar",
                    "handler": lambda df, val: df[
                        (df["A"] == val) & (df["B"] % 2 == 0)
                    ],
                    "input_type": "unknown",
                }
            ]
        )


def setup_function(function):
    global_state.cleanup()
    predefined_filters.set_filters([])


def teardown_function(function):
    global_state.cleanup()
    predefined_filters.set_filters([])
