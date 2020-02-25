import pandas as pd
import pytest

import dtale.charts.utils as chart_utils


@pytest.mark.unit
def test_date_freq_handler():
    df = pd.DataFrame(dict(date=pd.date_range('20200101', '20200131')))
    handler = chart_utils.date_freq_handler(df)
    s = handler('date|WD')
    assert s[0].values[0] == 2
    s = handler('date|H2')
    assert s[0].values[0] == 0
    s = handler('date|D')
    assert s[0].dt.strftime('%Y%m%d').values[0] == '20200101'
    s = handler('date|M')
    assert s[0].dt.strftime('%Y%m%d').values[0] == '20200131'


@pytest.mark.unit
def test_build_agg_data():
    with pytest.raises(NotImplementedError):
        chart_utils.build_agg_data(None, None, None, None, 'rolling', z='z')
    with pytest.raises(NotImplementedError):
        chart_utils.build_agg_data(None, None, None, None, 'corr')


@pytest.mark.unit
def test_weekday_tick_handler(unittest):
    unittest.assertEqual(chart_utils.weekday_tick_handler([1, 2, 3], 'date|WD'), ['Tues', 'Wed', 'Thur'])
    unittest.assertEqual(chart_utils.weekday_tick_handler([1, 2, 3], 'foo'), [1, 2, 3])


@pytest.mark.unit
def test_valid_chart():
    assert not chart_utils.valid_chart(chart_type='line', x='a', y='b', agg='rolling')
    assert not chart_utils.valid_chart(chart_type='line', x='a', y='b', agg='rolling', window=10)
    assert not chart_utils.valid_chart(chart_type='line', x='a', y='b', agg='rolling', rolling_comp='sum')
    assert chart_utils.valid_chart(chart_type='line', x='a', y='b', agg='rolling', window=10, rolling_comp='sum')
