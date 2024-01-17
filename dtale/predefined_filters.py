import inspect

from six import PY3

PREDEFINED_FILTERS = []


class PredefinedFilter(object):
    def __init__(
        self,
        name=None,
        description=None,
        handler=None,
        column=None,
        input_type=None,
        default=None,
        active=True,
    ):
        assert name is not None
        assert column is not None
        assert handler is not None and callable(handler)
        if PY3:
            assert len(inspect.signature(handler).parameters) == 2
        else:
            assert len(inspect.getargspec(handler).args) == 2
        assert input_type is not None
        assert input_type in ["input", "select", "multiselect"]

        self.name = name
        self.description = description
        self.handler = handler
        self.column = column
        self.input_type = input_type
        self.default = default
        self.active = active

    def asdict(self):
        return {
            "name": self.name,
            "description": self.description,
            "column": self.column,
            "inputType": self.input_type,
            "default": self.default,
            "active": self.active,
        }


def get_filters():
    global PREDEFINED_FILTERS

    return PREDEFINED_FILTERS


def set_filters(filters):
    global PREDEFINED_FILTERS

    PREDEFINED_FILTERS = [PredefinedFilter(**filter_spec) for filter_spec in filters]


def add_filters(filters):
    global PREDEFINED_FILTERS

    valid_filters = []
    for filter_spec in filters:
        new_filter = PredefinedFilter(**filter_spec)
        if next(
            (
                curr_filter
                for curr_filter in PREDEFINED_FILTERS
                if curr_filter.name == new_filter.name
            ),
            None,
        ):
            raise ValueError(
                "A predefined_filters filter already exists for {}".format(
                    new_filter.name
                )
            )
        valid_filters.append(new_filter)
    PREDEFINED_FILTERS += valid_filters


def init_filters():
    global PREDEFINED_FILTERS

    return {
        f.name: (
            dict(value=f.default, active=f.active)
            if f.default is not None
            else dict(active=f.active)
        )
        for f in PREDEFINED_FILTERS
    }
