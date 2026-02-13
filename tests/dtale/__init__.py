import dtale.global_state as global_state

"""
helper functions for tests
"""


def build_data_inst(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_data(data_id, data)


def build_settings(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_settings(data_id, data)


def build_dtypes(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_dtypes(data_id, data)


def build_data(data_id, df, settings=None):
    """Set up data, dtypes, and settings in global_state for a test data_id."""
    from dtale.views import build_dtypes_state

    global_state.set_data(data_id, df)
    global_state.set_dtypes(data_id, build_dtypes_state(df))
    global_state.set_settings(data_id, settings or {})
