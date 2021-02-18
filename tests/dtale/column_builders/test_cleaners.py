# coding=utf-8
import pandas as pd
import pytest

from dtale.column_builders import ColumnBuilder
from tests.dtale import build_data_inst
from tests.dtale.column_builders.test_column_builders import verify_builder


@pytest.mark.unit
def test_drop_multispace():
    df = pd.DataFrame(dict(foo=["a  b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_multispace"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "a b")


@pytest.mark.unit
def test_drop_punctuation():
    df = pd.DataFrame(dict(foo=["a'b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_punctuation"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_drop_stopwords():
    df = pd.DataFrame(dict(foo=["foo bar biz"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["stopwords"], "stopwords": ["bar"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "foo biz")


@pytest.mark.unit
def test_nltk_stopwords():
    pytest.importorskip("nltk")
    df = pd.DataFrame(dict(foo=["foo do biz"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["nltk_stopwords"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "foo biz")


@pytest.mark.unit
def test_drop_numbers():
    df = pd.DataFrame(dict(foo=["a999b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_numbers"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_keep_alpha(unittest):
    df = pd.DataFrame(dict(foo=["a999b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["keep_alpha"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_normalize_accents(unittest):
    df = pd.DataFrame(dict(foo=["naive cafe"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["normalize_accents"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)

    def test(col):
        unittest.assertEqual(col.values[0], "naive cafe")
        return True

    verify_builder(builder, test)


@pytest.mark.unit
def test_drop_all_space():
    df = pd.DataFrame(dict(foo=["a b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_all_space"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_drop_repeated_words(unittest):
    df = pd.DataFrame(dict(foo=["foo foo bar"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_repeated_words"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "foo bar")


@pytest.mark.unit
def test_add_word_number_space():
    df = pd.DataFrame(dict(foo=["a999b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["add_word_number_space"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "a 999 b")


@pytest.mark.unit
def test_drop_repeated_chars():
    df = pd.DataFrame(dict(foo=["aab"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})
    cfg = {"col": "foo", "cleaners": ["drop_repeated_chars"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "ab")


@pytest.mark.unit
def test_update_case(unittest):
    df = pd.DataFrame(dict(foo=["a b"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "foo", "cleaners": ["update_case"], "caseType": "upper"}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "A B")


@pytest.mark.unit
def test_space_vals_to_empty():
    df = pd.DataFrame(dict(foo=["  ", "", "a"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "foo", "cleaners": ["space_vals_to_empty"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: sum(col == "") == 2)


@pytest.mark.unit
def test_hidden_chars():
    df = pd.DataFrame(dict(foo=["  ", "", "a"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "foo", "cleaners": ["hidden_chars"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: sum(col.isnull()) == 0)


@pytest.mark.unit
def test_replace_hyphens_w_space():
    df = pd.DataFrame(dict(foo=["a‐b᠆c﹣d－e⁃f−g", "", "a"]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "foo", "cleaners": ["replace_hyphen_w_space"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: col.values[0] == "a b c d e f g")


@pytest.mark.unit
def test_multiple_cleaners(unittest):
    df = pd.DataFrame(dict(foo=["a999b", " "]))
    data_id, column_type = "1", "cleaning"
    i = 0
    build_data_inst({data_id: df})

    cfg = {"col": "foo", "cleaners": ["drop_numbers", "space_vals_to_empty"]}
    builder = ColumnBuilder(data_id, column_type, "Col{}".format(++i), cfg)
    verify_builder(builder, lambda col: sum(col == "") == 1 and col.values[0] == "ab")
