import pandas as pd

from django.http import HttpResponse
from django.shortcuts import redirect

from dtale.views import startup


def index(request):
    return HttpResponse(
        """
        <h1>Django/Flask Hybrid</h1>
        <span>Generate sample dataframe in D-Tale by clicking this </span><a href="/create-df">link</a>
    """
    )


def create_df(request):
    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6]))
    instance = startup("", data=df, ignore_duplicate=True)

    resp = redirect(f"/flask/dtale/main/{instance._data_id}")
    return resp
