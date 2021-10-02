from six import PY3

if PY3:
    from dash import dcc  # noqa: F401
    from dash import html  # noqa: F401
else:
    import dash_core_components as dcc  # noqa: F401
    import dash_html_components as html  # noqa: F401
