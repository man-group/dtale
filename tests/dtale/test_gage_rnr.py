import json
import pandas as pd
import pytest

from dtale.app import build_app
from tests.dtale.test_views import URL
from tests.dtale import build_data_inst


@pytest.mark.unit
def test_report():
    import dtale.views as views

    df, _ = views.format_data(
        pd.DataFrame(
            [
                [1, 1, 3.29, 3.41, 3.64],
                [1, 2, 2.44, 2.32, 2.42],
                [1, 3, 4.34, 4.17, 4.27],
                [1, 4, 3.47, 3.5, 3.64],
                [1, 5, 2.2, 2.08, 2.16],
                [2, 1, 3.08, 3.25, 3.07],
                [2, 2, 2.53, 1.78, 2.32],
                [2, 3, 4.19, 3.94, 4.34],
                [2, 4, 3.01, 4.03, 3.2],
                [2, 5, 2.44, 1.8, 1.72],
                [3, 1, 3.04, 2.89, 2.85],
                [3, 2, 1.62, 1.87, 2.04],
                [3, 3, 3.88, 4.09, 3.67],
                [3, 4, 3.14, 3.2, 3.11],
                [3, 5, 1.54, 1.93, 1.55],
            ],
            columns=["o", "p", "m1", "m2", "m3"],
        )
    )
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/gage-rnr/{}".format(c.port),
            query_string=dict(operator=json.dumps(["o"])),
        )
        resp = resp.json
        assert len(resp["results"]) == 6


@pytest.mark.unit
def test_statistics_class():
    """Test Statistics class directly for labels, calculate, std, data_to_parts/operators
    (covers gage_rnr.py lines 66, 97-100, 103-105, 108-109, 112)."""
    import numpy as np
    from dtale.gage_rnr import Statistics, Component, Result

    # 3D array: 2 operators x 3 parts x 2 measurements
    data = np.array(
        [
            [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]],
            [[7.0, 8.0], [9.0, 10.0], [11.0, 12.0]],
        ]
    )

    # Test with labels provided (covers line 66)
    labels = {"Operator": ["Op1", "Op2"], "Part": ["P1", "P2", "P3"]}
    s = Statistics(data, labels=labels)
    assert s.labels["Operator"] == ["Op1", "Op2"]
    assert s.labels["Part"] == ["P1", "P2", "P3"]

    # Test calculate (covers lines 103-105)
    s.calculate()
    assert Result.Mean in s.result
    assert Result.Std in s.result

    # Test calculate_std (covers lines 97-100)
    std_result = s.calculate_std()
    assert Component.TOTAL in std_result
    assert Component.OPERATOR in std_result
    assert Component.PART in std_result

    # Test data_to_parts (covers lines 108-109)
    parts = s.data_to_parts()
    assert parts.shape == (3, 4)  # 3 parts x (2 measurements * 2 operators)

    # Test data_to_operators (covers line 112)
    operators = s.data_to_operators()
    assert operators.shape == (2, 6)  # 2 operators x (2 measurements * 3 parts)


@pytest.mark.unit
def test_failure():
    import dtale.views as views

    df, _ = views.format_data(
        pd.DataFrame(
            [
                [1, 1, 3.29, 3.41, 3.64],
                [1, 2, 2.44, 2.32, 2.42],
                [1, 3, 4.34, 4.17, 4.27],
                [2, 1, 3.08, 3.25, 3.07],
                [2, 2, 2.53, 1.78, 2.32],
                [2, 3, 4.19, 3.94, 4.34],
                [2, 4, 3.01, 4.03, 3.2],
                [2, 5, 2.44, 1.8, 1.72],
                [3, 1, 3.04, 2.89, 2.85],
                [3, 2, 1.62, 1.87, 2.04],
                [3, 3, 3.88, 4.09, 3.67],
                [3, 4, 3.14, 3.2, 3.11],
                [3, 5, 1.54, 1.93, 1.55],
            ],
            columns=["o", "p", "m1", "m2", "m3"],
        )
    )
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get(
            "/dtale/gage-rnr/{}".format(c.port),
            query_string=dict(operator=json.dumps(["o"])),
        )
        resp = resp.json
        assert "error" in resp
