import json
import pandas as pd
import pytest

from dtale.duplicate_checks import (
    DuplicateCheck,
    NoDuplicatesException,
    NoDuplicatesToShowException,
    RemoveAllDataException,
)
from tests.dtale.test_views import app
from tests.dtale import build_data_inst, build_dtypes


def duplicates_data():
    df = pd.DataFrame(
        dict(
            Foo=[1, 2, 3, 4, 5],
            foo=[1, 2, 3, 4, 5],
            fOo=[4, 5, 6, 7, 8],
            foO=[4, 4, 4, 4, 4],
            bar=[5, 5, 5, 6, 6],
        ),
    )
    return df[["Foo", "foo", "fOo", "foO", "bar"]]


def non_duplicate_data():
    return pd.DataFrame(dict(foo=[1, 2, 3], bar=[4, 5, 6]))


@pytest.mark.unit
def test_columns(unittest):
    import dtale.global_state as global_state

    global_state.clear_store()
    data_id, duplicates_type = "1", "columns"

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "first"})
    unittest.assertEqual(builder.test(), {"Foo": ["foo"]})
    new_data_id = builder.execute()
    unittest.assertEqual(
        list(global_state.get_data(new_data_id).columns), ["Foo", "fOo", "foO", "bar"]
    )

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "last"})
    unittest.assertEqual(builder.test(), {"foo": ["Foo"]})
    new_data_id = builder.execute()
    unittest.assertEqual(
        list(global_state.get_data(new_data_id).columns), ["foo", "fOo", "foO", "bar"]
    )

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    unittest.assertEqual(builder.test(), {"Foo": ["foo"]})
    new_data_id = builder.execute()
    unittest.assertEqual(
        list(global_state.get_data(new_data_id).columns), ["fOo", "foO", "bar"]
    )

    data = {data_id: duplicates_data().drop(["fOo", "foO", "bar"], axis=1)}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    with pytest.raises(RemoveAllDataException):
        builder.execute()

    data = {data_id: non_duplicate_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    with pytest.raises(NoDuplicatesException):
        builder.checker.remove(data[data_id])


@pytest.mark.unit
def test_column_names(unittest):
    import dtale.global_state as global_state

    global_state.clear_store()
    data_id, duplicates_type = "1", "column_names"
    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "first"})
    unittest.assertEqual(builder.test(), {"foo": ["Foo", "foo", "fOo", "foO"]})
    new_data_id = builder.execute()
    unittest.assertEqual(
        list(global_state.get_data(new_data_id).columns), ["Foo", "bar"]
    )

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "last"})
    unittest.assertEqual(builder.test(), {"foo": ["Foo", "foo", "fOo", "foO"]})
    new_data_id = builder.execute()
    unittest.assertEqual(
        list(global_state.get_data(new_data_id).columns), ["foO", "bar"]
    )

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    unittest.assertEqual(builder.test(), {"foo": ["Foo", "foo", "fOo", "foO"]})
    new_data_id = builder.execute()
    unittest.assertEqual(list(global_state.get_data(new_data_id).columns), ["bar"])

    data = {data_id: non_duplicate_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    with pytest.raises(NoDuplicatesException):
        builder.checker.remove(data[data_id])

    data = {data_id: duplicates_data().drop("bar", axis=1)}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"keep": "none"})
    with pytest.raises(RemoveAllDataException):
        builder.execute()


@pytest.mark.unit
def test_rows(unittest):
    import dtale.global_state as global_state

    global_state.clear_store()
    data_id, duplicates_type = "1", "rows"
    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(
        data_id, duplicates_type, {"keep": "first", "subset": "foo"}
    )
    unittest.assertEqual(builder.test(), dict(removed=0, total=5, remaining=5))
    pre_length = len(data[data_id])
    new_data_id = builder.execute()
    assert pre_length == len(global_state.get_data(new_data_id))

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(
        data_id, duplicates_type, {"keep": "first", "subset": ["foO", "bar"]}
    )
    unittest.assertEqual(builder.test(), dict(removed=3, total=5, remaining=2))
    new_data_id = builder.execute()
    assert len(global_state.get_data(new_data_id)) == 2
    unittest.assertEqual(global_state.get_data(new_data_id)["Foo"].tolist(), [1, 4])

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(
        data_id, duplicates_type, {"keep": "last", "subset": ["foO", "bar"]}
    )
    unittest.assertEqual(builder.test(), dict(removed=3, total=5, remaining=2))
    new_data_id = builder.execute()
    assert len(global_state.get_data(new_data_id)) == 2
    unittest.assertEqual(global_state.get_data(new_data_id)["Foo"].tolist(), [3, 5])

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(
        data_id, duplicates_type, {"keep": "none", "subset": ["foO", "bar"]}
    )
    unittest.assertEqual(builder.test(), dict(removed=5, total=5, remaining=0))
    with pytest.raises(RemoveAllDataException):
        builder.execute()


@pytest.mark.unit
def test_show_duplicates(unittest):
    import dtale.global_state as global_state

    global_state.clear_store()
    data_id, duplicates_type = "1", "show"
    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"group": ["foo"]})
    unittest.assertEqual(builder.test(), {})
    with pytest.raises(NoDuplicatesToShowException):
        builder.execute()

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(data_id, duplicates_type, {"group": ["foO", "bar"]})
    unittest.assertEqual(
        builder.test(),
        {
            "4, 5": dict(count=3, filter=["4", "5"]),
            "4, 6": dict(count=2, filter=["4", "6"]),
        },
    )
    new_data_id = builder.execute()
    assert new_data_id == 2
    unittest.assertEqual(
        global_state.get_data(new_data_id)["Foo"].tolist(), [1, 2, 3, 4, 5]
    )

    data = {data_id: duplicates_data()}
    build_data_inst(data)

    builder = DuplicateCheck(
        data_id, duplicates_type, {"group": ["foO", "bar"], "filter": ["4", "5"]}
    )
    new_data_id = builder.execute()
    unittest.assertEqual(global_state.get_data(new_data_id)["Foo"].tolist(), [1, 2, 3])


@pytest.mark.unit
def test_view(unittest):
    from dtale.views import build_dtypes_state
    import dtale.global_state as global_state

    global_state.clear_store()
    df = duplicates_data()
    with app.test_client() as c:
        data = {c.port: df}
        dtypes = {c.port: build_dtypes_state(df)}
        build_data_inst(data)
        build_dtypes(dtypes)
        resp = c.get(
            "/dtale/duplicates/{}".format(c.port),
            query_string=dict(
                type="not_implemented", action="execute", cfg=json.dumps({})
            ),
        )
        response_data = resp.json
        assert (
            response_data["error"]
            == "'not_implemented' duplicate check not implemented yet!"
        )

        params = dict(
            type="columns",
            action="test",
            cfg=json.dumps({"keep": "first"}),
        )
        resp = c.get("/dtale/duplicates/{}".format(c.port), query_string=params)
        response_data = resp.json
        unittest.assertEqual(response_data, {"results": {"Foo": ["foo"]}})

        params["action"] = "execute"
        resp = c.get("/dtale/duplicates/{}".format(c.port), query_string=params)
        response_data = resp.json
        assert response_data["data_id"] == c.port
