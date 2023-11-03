import pandas as pd
import pytest

import dtale.charts.utils as chart_utils
from dtale.constants import CHART_JOINER_CHAR


def build_col_def(freq, col="date"):
    return "{}{}{}".format(col, CHART_JOINER_CHAR, freq)


@pytest.mark.unit
def test_date_freq_handler():
    df = pd.DataFrame(dict(date=pd.date_range("20200101", "20200131")))
    handler = chart_utils.date_freq_handler(df)
    s = handler(build_col_def("WD"))
    assert s[0].values[0] == 2
    s = handler(build_col_def("H2"))
    assert s[0].values[0] == 0
    s = handler(build_col_def("D"))
    assert s[0].dt.strftime("%Y%m%d").values[0] == "20200101"
    s = handler(build_col_def("M"))
    assert s[0].dt.strftime("%Y%m%d").values[0] == "20200131"


@pytest.mark.unit
def test_group_filter_handler():
    s = chart_utils.group_filter_handler(build_col_def("WD"), 1, "I")
    assert s[1] == "date.dt.dayofweek: 1"
    s = chart_utils.group_filter_handler(build_col_def("WD"), "NaN", "I")
    assert s[1] == "date: NaN"
    s = chart_utils.group_filter_handler(build_col_def("H2"), 1, "I")
    assert s[1] == "date.dt.hour: 1"
    s = chart_utils.group_filter_handler(build_col_def("H"), "20190101", "D")
    assert s[1] == "date.dt.date: 20190101, date.dt.hour: 0"
    s = chart_utils.group_filter_handler(build_col_def("D"), "20190101", "D")
    assert s[1] == "date.dt.date: 20190101"
    s = chart_utils.group_filter_handler(build_col_def("W"), "20190101", "D")
    assert s[1] == "date.dt.year: 2019, date.dt.week: 1"
    s = chart_utils.group_filter_handler(build_col_def("M"), "20191231", "D")
    assert s[1] == "date.dt.year: 2019, date.dt.month: 12"
    s = chart_utils.group_filter_handler(build_col_def("Q"), "20191231", "D")
    assert s[1] == "date.dt.year: 2019, date.dt.quarter: 4"
    s = chart_utils.group_filter_handler(build_col_def("Y"), "20191231", "D")
    assert s[1] == "date.dt.year: 2019"
    s = chart_utils.group_filter_handler("foo", 1, "I")
    assert s[1] == "foo: 1"
    s = chart_utils.group_filter_handler("foo", "bar", "S")
    assert s[1] == "foo: bar"
    s = chart_utils.group_filter_handler("foo", "NaN", "S")
    assert s[1] == "foo: NaN"


@pytest.mark.unit
def test_build_agg_data():
    with pytest.raises(NotImplementedError):
        chart_utils.build_agg_data(None, None, None, None, "rolling", z="z")
    with pytest.raises(NotImplementedError):
        chart_utils.build_agg_data(None, None, None, None, "corr")


@pytest.mark.unit
def test_weekday_tick_handler(unittest):
    unittest.assertEqual(
        chart_utils.weekday_tick_handler([1, 2, 3], "date|WD"), ["Tues", "Wed", "Thur"]
    )
    unittest.assertEqual(chart_utils.weekday_tick_handler([1, 2, 3], "foo"), [1, 2, 3])


@pytest.mark.unit
def test_valid_chart():
    assert not chart_utils.valid_chart(chart_type="line", x="a", y="b", agg="rolling")
    assert not chart_utils.valid_chart(
        chart_type="line", x="a", y="b", agg="rolling", window=10
    )
    assert not chart_utils.valid_chart(
        chart_type="line", x="a", y="b", agg="rolling", rolling_comp="sum"
    )
    assert chart_utils.valid_chart(
        chart_type="line", x="a", y="b", agg="rolling", window=10, rolling_comp="sum"
    )


@pytest.mark.unit
def test_build_spaced_ticks(unittest):
    from dtale.dash_application.charts import build_spaced_ticks

    ticks = list("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef")
    output = build_spaced_ticks(ticks)
    unittest.assertEqual({"tickmode": "auto", "nticks": 17}, output)
    output = build_spaced_ticks(ticks, mode="array")
    expected = {
        "tickmode": "array",
        "tickvals": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 31],
        "ticktext": [
            "A",
            "C",
            "E",
            "G",
            "I",
            "K",
            "M",
            "O",
            "Q",
            "S",
            "U",
            "W",
            "Y",
            "a",
            "c",
            "e",
            "f",
        ],
    }
    unittest.assertEqual(expected, output)
