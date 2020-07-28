import dtale.global_state as global_state


def get_data_id(pathname):
    """
    Parses data ID from query path (ex: 'foo/bar/1' => '1')
    """
    return global_state.find_data_id(pathname.split("/")[-1])
