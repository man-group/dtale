# AUTO GENERATED FILE - DO NOT EDIT

from dash.development.base_component import Component, _explicitize_args


class DashColorscales(Component):
    """A DashColorscales component.
    DashColorscales is a Dash wrapper for `react-colorscales`.
    It takes an array of colors, `colorscale`, and
    displays a UI for modifying it or choosing a new scale.

    Keyword arguments:

    - id (string; optional):
        The ID used to identify this compnent in Dash callbacks.

    - colorscale (list; optional):
        Optional: Initial colorscale to display. Default is Viridis.

    - fixSwatches (boolean; optional):
        Optional: Set to `True` to fix the number of colors in the scale.

    - nSwatches (number; optional):
        Optional: Initial number of colors in scale to display."""

    _children_props = []
    _base_nodes = ["children"]
    _namespace = "components"
    _type = "DashColorscales"

    @_explicitize_args
    def __init__(
        self,
        id=Component.REQUIRED,
        colorscale=Component.UNDEFINED,
        nSwatches=Component.UNDEFINED,
        fixSwatches=Component.UNDEFINED,
        **kwargs
    ):
        self._prop_names = ["id", "colorscale", "fixSwatches", "nSwatches"]
        self._valid_wildcard_attributes = []
        self.available_properties = ["id", "colorscale", "fixSwatches", "nSwatches"]
        self.available_wildcard_properties = []
        _explicit_args = kwargs.pop("_explicit_args")
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}

        super(DashColorscales, self).__init__(**args)
