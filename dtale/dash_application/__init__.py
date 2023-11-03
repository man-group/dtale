try:
    from dash import dcc  # noqa: F401
    from dash import html  # noqa: F401

    if not hasattr(html, "Div"):
        import dash_core_components as dcc  # noqa: F811
        import dash_html_components as html  # noqa: F811
except ImportError:
    import dash_core_components as dcc  # noqa: F401
    import dash_html_components as html  # noqa: F401
