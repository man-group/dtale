from dash.development.base_component import Component, _explicitize_args


class Wordcloud(Component):
    """
    A Wordcloud component.
    Wordcloud is a wrapper component for react-wordcloud usage by dash.
    It takes a property, `data`, containing a series of words and a series of weights and displays a wordcloud
    or group of wordclouds depending on whether a `group` value has been specified.

    Keyword arguments:
    - id (string; required): The ID used to identify this component in Dash callbacks.
    - data (dict; optional): Server-side data containing words "data[group].x" and weights "data[group][y-prop]".
    - y (list of strings; optional): List of properties to use as weights.
    - group (list of strings; optional): List of properties to use as groups.
    - height (number; default 400): Height of wordcloud in pixels (default: 400).
    """

    @_explicitize_args
    def __init__(
        self,
        id=Component.REQUIRED,
        data=Component.UNDEFINED,
        y=Component.UNDEFINED,
        group=Component.UNDEFINED,
        height=Component.UNDEFINED,
        **kwargs
    ):
        self._prop_names = ["id", "data", "y", "group", "height"]
        self._type = "Wordcloud"
        self._namespace = "components"
        self._valid_wildcard_attributes = []
        self.available_properties = ["id", "data", "y", "group", "height"]
        self.available_wildcard_properties = []

        _explicit_args = kwargs.pop("_explicit_args")
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs
        args = {k: _locals[k] for k in _explicit_args if k != "children"}

        for k in ["id"]:
            if k not in args:
                raise TypeError("Required argument `" + k + "` was not specified.")
        super(Wordcloud, self).__init__(**args)
