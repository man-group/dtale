import pandas as pd
import pytest
from six import PY3

import dtale.query as query


@pytest.mark.unit
def test_run_query():
    df = pd.DataFrame([dict(a=1, b=2, c=3), dict(a=2, b=3, c=4), dict(a=3, b=4, c=5)])

    with pytest.raises(Exception):
        query.run_query(df, "a == 4")

    assert len(query.run_query(df, "`a` in @a", {"a": [1, 2, 3]})) == 3

    if PY3:
        df = pd.DataFrame(
            [
                {"a.b": 1, "b": 2, "c": 3},
                {"a.b": 2, "b": 3, "c": 4},
                {"a.b": 3, "b": 4, "c": 5},
            ]
        )
        assert len(query.run_query(df, "`a.b` == 1")) == 1


@pytest.mark.unit
def test_build_query():
    import dtale.global_state as global_state

    data_id = global_state.new_data_inst()
    global_state.set_settings(
        data_id, {"columnFilters": {"foo": {"query": "`foo` == 1"}}}
    )
    assert query.build_query(data_id) == "`foo` == 1"
