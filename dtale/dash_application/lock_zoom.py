import plotly.graph_objs as go
from dash.dependencies import Input, Output, State

from dtale.charts.utils import MAX_GROUPS
from dtale.dash_application.exceptions import DtalePreventUpdate


def init_callbacks(dash_app):
    def lock_zoom(clicks, relayout_data, figure):
        if not clicks:
            raise DtalePreventUpdate
        figure = go.Figure(figure)
        if relayout_data:
            figure.update_layout(scene_camera=relayout_data["scene.camera"])
        return figure

    for i in range(1, MAX_GROUPS + 1):
        dash_app.callback(
            Output("chart-{}".format(i), "figure"),
            [Input("lock-zoom-btn", "n_clicks")],
            [
                State("chart-{}".format(i), "relayoutData"),
                State("chart-{}".format(i), "figure"),
            ],
        )(lock_zoom)
