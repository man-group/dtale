import dtale.global_state as global_state
from six import PY3

if PY3:
    from contextlib import ExitStack as ExitStack3

    ExitStack = ExitStack3
else:
    from contextlib2 import ExitStack as ExitStack2

    ExitStack = ExitStack2


'''
helper functions for tests
'''
def build_data_inst(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_data(data_id, data)


def build_settings(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_settings(data_id, data)


def build_dtypes(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_dtypes(data_id, data)
