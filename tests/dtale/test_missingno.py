import pandas as pd
import pytest
import sys

from dtale.app import build_app
from tests.dtale.test_views import URL
from tests.dtale import build_data_inst


@pytest.mark.skipif(sys.version_info >= (3, 10), reason="requires python 3.9 or lower")
def test_matrix():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get("/dtale/missingno/matrix/{}".format(c.port))
        assert resp.content_type == "image/png"


@pytest.mark.skipif(sys.version_info >= (3, 10), reason="requires python 3.9 or lower")
def test_bar():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get("/dtale/missingno/bar/{}".format(c.port))
        assert resp.content_type == "image/png"


@pytest.mark.skipif(sys.version_info >= (3, 10), reason="requires python 3.9 or lower")
def test_heatmap():
    import dtale.views as views

    df, _ = views.format_data(pd.DataFrame(dict(a=[1, 2, 3, 4, 5, 6])))
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get("/dtale/missingno/heatmap/{}".format(c.port))
        assert resp.content_type == "image/png"


@pytest.mark.skipif(sys.version_info >= (3, 10), reason="requires python 3.9 or lower")
def test_dendrogram(rolling_data):
    import dtale.views as views

    df, _ = views.format_data(rolling_data)
    with build_app(url=URL).test_client() as c:
        build_data_inst({c.port: df})

        resp = c.get("/dtale/missingno/dendrogram/{}".format(c.port))
        assert resp.content_type == "image/png"
