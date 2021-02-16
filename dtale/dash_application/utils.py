def get_data_id(pathname):
    """
    Parses data ID from query path (ex: 'foo/bar/1' => '1')
    """
    return pathname.split("/")[-1]
