import dtale.global_state as global_state


def build_data_inst(input_dict):
    for data_id, data in input_dict.items():
        global_state.set_data(data_id, data)
