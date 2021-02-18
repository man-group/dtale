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
