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
