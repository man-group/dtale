import mock
import pytest
from six import PY3

import dtale.charts.utils as chart_utils

if PY3:
    from contextlib import ExitStack
else:
    from contextlib2 import ExitStack


@pytest.mark.unit
def test_set_mapbox_token():

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.charts.utils.MAPBOX_TOKEN", None))

        chart_utils.set_mapbox_token("test")
        assert chart_utils.MAPBOX_TOKEN == "test"


@pytest.mark.unit
def test_valid_chart_w_invalid_map_chart():
    assert not chart_utils.valid_chart(
        "maps", map_type="choropleth", loc_mode="geojson-id", geojson=None
    )


@pytest.mark.unit
def test_valid_chart_w_invalid_candlestick_chart():
    assert not chart_utils.valid_chart("candlestick", cs_x=None)
    assert chart_utils.valid_chart(
        "candlestick",
        cs_x="x",
        cs_open="open",
        cs_close="close",
        cs_high="high",
        cs_low="low",
    )


@pytest.mark.unit
def test_valid_chart_w_invalid_treemap_chart():
    assert not chart_utils.valid_chart("treemap", treemap_value=None)
    assert not chart_utils.valid_chart("treemap", treemap_value="a", treemap_label=None)
    assert chart_utils.valid_chart("treemap", treemap_value="x", treemap_label="open")


@pytest.mark.unit
def test_convert_date_val_to_date():
    assert (
        chart_utils.convert_date_val_to_date("2020-01-01").strftime("%Y%m%d")
        == "20200101"
    )
    assert (
        chart_utils.convert_date_val_to_date(1577854800000).strftime("%Y%m%d")
        == "20200101"
    )


@pytest.mark.unit
def test_group_filter_handler():
    assert (
        chart_utils.group_filter_handler("date", "2020-01-01", "D")
        == "date == '20200101'"
    )
    assert (
        chart_utils.group_filter_handler("date", 1577854800000, "D")
        == "date == '20200101'"
    )
