import dtale.global_state as global_state


def get_data_id(pathname):
    """
    Parses data ID from query path (ex: 'foo/bar/1' => '1')
    """
    data_id = pathname.split("/")[-1]
    if (global_state.size()) == 0:
        return None
    if global_state.contains(data_id):
        return data_id
    else:
        return sorted(global_state.keys())[0]
