import mock
import pandas as pd
import pytest

import dtale.global_state as global_state
from dtale.views import build_dtypes_state


def setup_function(function):
    global_state.cleanup()
    global_state.use_default_store()


def teardown_function(function):
    global_state.cleanup()
    global_state.use_default_store()


def initialize_store(test_data):
    """Helper function that sets up a default store with some data in it"""
    global_state.cleanup()
    global_state.use_default_store()
    for data_id in ["1", "2"]:
        global_state.set_data(data_id, test_data)
        global_state.set_dtypes(data_id, build_dtypes_state(test_data))
        global_state.set_settings(data_id, dict(locked=[]))
        global_state.set_name(data_id, "test_name" + data_id)
        global_state.set_context_variables(
            data_id, dict(favorite_words=["foo", "bar", "baz"])
        )
        global_state.set_history(data_id, ["foo", "bar", "baz"])


def get_store_contents():
    """
    Return an ordered tuple of attributes representing the store contents.
    Useful for ensuring key properties stay the same when switching between systems.
    """
    _get_one = [
        serialized_dataframe(global_state.get_data("1")),
        global_state.get_dtypes("1"),
        global_state.get_settings("1"),
        global_state.get_metadata("1"),
        global_state.get_context_variables("1"),
        global_state.get_history("1"),
    ]
    _get_all = [
        {int(k): serialized_dataframe(v.data) for k, v in global_state.items()},
        {int(k): v.dtypes for k, v in global_state.items()},
        {int(k): v.settings for k, v in global_state.items()},
        {int(k): v.metadata for k, v in global_state.items()},
        {int(k): v.context_variables for k, v in global_state.items()},
        {int(k): v.history for k, v in global_state.items()},
    ]
    _lengths = [global_state.size()]
    return (_get_one, _get_all, _lengths)


def serialized_dataframe(df):
    """Handles converting pandas objects to format that can handle equality comparisons"""
    return None if (df is None) else df.to_json()


def get_store_type():
    """Helper function to return the class being used for data storage"""
    return type(global_state._default_store._data_store)


@pytest.mark.unit
def test_cleanup(unittest, test_data):
    initialize_store(test_data)
    base_contents = get_store_contents()

    # should just remove 1 entry, leaving one still in there
    global_state.cleanup(data_id="2")
    without_one = get_store_contents()

    # should remove ALL entries
    initialize_store(test_data)
    global_state.cleanup()
    without_any = get_store_contents()

    unittest.assertNotEqual(base_contents, without_one, "should have removed one")
    unittest.assertNotEqual(base_contents, without_any, "should have removed all")
    unittest.assertNotEqual(
        without_one, without_any, "first should still have some data"
    )


@pytest.mark.unit
def test_load_flag(unittest, test_data):
    initialize_store(test_data)
    global_state.set_settings("1", dict(hide_shutdown=True))
    unittest.assertEqual(global_state.load_flag("1", "hide_shutdown", False), True)
    global_state.set_settings("1", dict(hide_shutdown=False))
    unittest.assertEqual(global_state.load_flag("1", "hide_shutdown", True), False)


@pytest.mark.unit
def test_as_dict(unittest):
    """Should only work if object is an instance of MutableMapping or it implements to_dict"""

    from dtale.global_state import DtaleBaseStore

    mutable_mapping_instance = DtaleBaseStore(a=1, b=2)
    unittest.assertEqual(
        mutable_mapping_instance, global_state._as_dict(mutable_mapping_instance)
    )

    class CustomDataStore:
        def __init__(self, keys, values):
            self.keys = keys
            self.values = values

    custom_store = CustomDataStore(keys=["a", "b"], values=[1, 2])

    # Fails without a to_dict method
    with pytest.raises(AttributeError) as error:
        global_state._as_dict(custom_store)
        assert "has no attribute 'to_dict'" in str(error.value)

    # Works if it does have to_dict method
    custom_store.to_dict = lambda: dict(zip(custom_store.keys, custom_store.values))
    assert isinstance(global_state._as_dict(custom_store), dict)


@pytest.mark.unit
def test_use_store(unittest, test_data):
    class store_class(object):
        __name__ = "store_class"

        def __init__(self):
            self.data = dict()

        def keys(self):
            return self.data.keys()

        def items(self):
            return self.data.items()

    # First argument be a class
    with pytest.raises(BaseException) as error:
        global_state.use_store(None, None)
    assert "Must be a class" in str(error.value)

    # Store class must have the get, keys, items, clear, __setitem__, __delitem__, __contains__, __len__ attributes
    with pytest.raises(BaseException) as error:
        global_state.use_store(store_class, None)
    assert "Missing required methods" in str(error.value)
    setattr(store_class, "get", lambda self, k: self.data.get(k))
    setattr(store_class, "clear", lambda self: self.data.clear())
    setattr(store_class, "__setitem__", lambda self, k, v: self.data.update({k: v}))
    setattr(store_class, "__delitem__", lambda self, k: self.data.pop(k, None))
    setattr(store_class, "__contains__", lambda self, k: k in self.data)
    setattr(store_class, "__len__", lambda self: len(self.data))

    # Store class must have to_dict method if it's not a subclass of MutableMapping
    with pytest.raises(BaseException) as error:
        global_state.use_store(store_class, None)
    assert 'Must subclass MutableMapping or implement "to_dict"' in str(error.value)
    setattr(store_class, "to_dict", lambda self: self.data)

    # Second argument must be a function
    with pytest.raises(BaseException) as error:
        global_state.use_store(store_class, None)
    assert "Must be a function" in str(error.value)

    # Function must take name as only parameter
    with pytest.raises(BaseException) as error:
        global_state.use_store(store_class, lambda: None)
    assert 'Must take "name" as the only parameter' in str(error.value)

    # So now we *should* have a good store class.
    # Verify that it converts from the default to this store correctly
    initialize_store(test_data)
    contents_before, type_before = get_store_contents(), get_store_type()

    global_state.use_store(store_class, lambda name: store_class())
    contents_after = get_store_contents()
    type_after = get_store_type()

    unittest.assertEqual(contents_before, contents_after)
    unittest.assertNotEqual(type_before, type_after)


@pytest.mark.unit
def test_use_default_store(unittest, tmpdir, test_data):
    global_state.clear_store()
    """Make sure flipping back and forth multiple times doesn't corrupt the data"""
    initialize_store(test_data)
    contents_before = get_store_contents()
    type_before = get_store_type()

    directory = tmpdir.mkdir("test_use_default_store").dirname
    global_state.use_shelve_store(directory)

    global_state.use_default_store()
    contents_after = get_store_contents()
    type_after = get_store_type()

    unittest.assertEqual(contents_before[1], contents_after[1])
    unittest.assertEqual(type_before, type_after)


@pytest.mark.unit
def test_use_shelve_store(unittest, tmpdir, test_data):
    initialize_store(test_data)
    contents_before = get_store_contents()
    type_before = get_store_type()

    directory = tmpdir.mkdir("test_use_shelve_store").dirname
    global_state.use_shelve_store(directory)
    contents_after = get_store_contents()
    type_after = get_store_type()

    unittest.assertEqual(contents_before, contents_after)
    unittest.assertNotEqual(type_before, type_after)

    global_state.cleanup(data_id="1")
    unittest.assertNotEqual(contents_after, get_store_contents())


@pytest.mark.unit
def test_redis_requirement(builtin_pkg, tmpdir):
    orig_import = __import__

    def import_that_fails(name, *args):
        if name == "redislite":
            raise ImportError
        return orig_import(name, *args)

    with mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_that_fails):
        directory = tmpdir.mkdir("test_use_redis_store").dirname
        with pytest.raises(BaseException) as error:
            global_state.use_redis_store(directory)
        assert "redislite must be installed" in str(error.value)


@pytest.mark.unit
def test_use_redis_store(unittest, tmpdir, test_data):
    pytest.importorskip("redislite")

    initialize_store(test_data)
    contents_before = get_store_contents()
    type_before = get_store_type()

    directory = tmpdir.mkdir("test_use_redis_store").dirname
    global_state.use_redis_store(directory)
    contents_after = get_store_contents()
    type_after = get_store_type()

    unittest.assertEqual(contents_before, contents_after)
    unittest.assertNotEqual(type_before, type_after)

    global_state.cleanup(data_id="1")
    unittest.assertNotEqual(contents_after, get_store_contents())


@pytest.mark.unit
def test_build_data_id():
    import dtale.global_state as global_state

    global_state.cleanup()
    assert global_state.build_data_id() == "1"

    df = pd.DataFrame([1, 2, 3, 4, 5])
    data = {str(idx + 1): df for idx in range(10)}
    for k, v in data.items():
        global_state.set_data(k, v)
    assert global_state.build_data_id() == "11"


@pytest.mark.unit
def test_build_data_id_with_non_int_keys():
    global_state.cleanup()
    df = pd.DataFrame([1, 2, 3])
    global_state.set_data("abc", df)
    # Non-int keys should be filtered out, resulting in "1"
    assert global_state.build_data_id() == "1"


@pytest.mark.unit
def test_dtale_instance():
    from dtale.global_state import DtaleInstance

    df = pd.DataFrame({"a": [1, 2, 3]})
    inst = DtaleInstance(df)

    # Test basic properties
    assert inst.rows() == 3
    assert inst.is_large is False
    assert inst.data is not None
    assert len(inst.data) == 3
    assert inst.name == ""
    assert inst.dataset is None
    assert inst.dataset_dim is None
    assert inst.dtypes is None
    assert inst.metadata is None
    assert inst.context_variables is None
    assert inst.history is None
    assert inst.settings is None
    assert inst.is_xarray_dataset is False

    # Test setters
    inst.data = pd.DataFrame({"b": [4, 5]})
    assert len(inst.data) == 2

    inst.name = "test_name"
    assert inst.name == "test_name"

    inst.dataset = {"key": "value"}
    assert inst.dataset == {"key": "value"}
    assert inst.is_xarray_dataset is True

    inst.dataset_dim = {"dim": 1}
    assert inst.dataset_dim == {"dim": 1}

    inst.dtypes = [{"name": "a", "dtype": "int64"}]
    assert inst.dtypes == [{"name": "a", "dtype": "int64"}]

    inst.context_variables = {"var1": "val1"}
    assert inst.context_variables == {"var1": "val1"}

    inst.metadata = {"meta": "data"}
    assert inst.metadata == {"meta": "data"}

    inst.history = ["action1", "action2"]
    assert inst.history == ["action1", "action2"]

    inst.settings = {"locked": []}
    assert inst.settings == {"locked": []}


@pytest.mark.unit
def test_dtale_instance_none_data():
    from dtale.global_state import DtaleInstance

    inst = DtaleInstance(None)
    assert inst.rows() == 0
    assert inst.load_data() is None


@pytest.mark.unit
def test_dtale_base_store():
    from dtale.global_state import DtaleBaseStore

    store = DtaleBaseStore()
    inst = store.build_instance("1")
    assert inst is not None
    assert inst.rows() == 0


@pytest.mark.unit
def test_default_store_contains():
    assert global_state.contains(None) is False
    global_state.set_data("1", pd.DataFrame({"a": [1]}))
    assert global_state.contains("1") is True
    assert global_state.contains("999") is False


@pytest.mark.unit
def test_default_store_get_data_inst():
    # None data_id should return a new instance
    inst = global_state.get_data_inst(None)
    assert inst is not None

    # Non-existent data_id should create a new one
    inst = global_state.get_data_inst("999")
    assert inst is not None


@pytest.mark.unit
def test_default_store_new_data_inst():
    # Auto-generated ID
    data_id = global_state.new_data_inst()
    assert data_id == "1"

    # Explicit ID
    data_id = global_state.new_data_inst("42")
    assert data_id == "42"


@pytest.mark.unit
def test_set_data_creates_instance():
    df = pd.DataFrame({"a": [1, 2, 3]})
    global_state.set_data(val=df)
    assert global_state.size() > 0


@pytest.mark.unit
def test_set_name_operations(test_data):
    initialize_store(test_data)

    # Setting None/empty name should be a no-op
    global_state.set_name("1", None)
    global_state.set_name("1", "")

    # Duplicate name should raise
    with pytest.raises(Exception, match="already exists"):
        global_state.set_name("2", "test_name1")


@pytest.mark.unit
def test_get_data_id_by_name(test_data):
    initialize_store(test_data)
    data_id = global_state.get_data_id_by_name("test_name1")
    assert data_id == "1"

    # Non-existent name
    data_id = global_state.get_data_id_by_name("nonexistent")
    assert data_id is None


@pytest.mark.unit
def test_update_id(test_data):
    initialize_store(test_data)
    new_id = global_state.update_id("1", "100")
    assert new_id == "100"
    assert global_state.contains("100")
    assert not global_state.contains("1")

    # Duplicate ID should raise
    with pytest.raises(Exception, match="Data already exists"):
        global_state.update_id("2", "100")


@pytest.mark.unit
def test_get_dtype_info(test_data):
    initialize_store(test_data)
    # Existing column
    dtype_info = global_state.get_dtype_info("1", "foo")
    assert dtype_info is not None
    assert dtype_info["name"] == "foo"

    # Non-existent column
    dtype_info = global_state.get_dtype_info("1", "nonexistent")
    assert dtype_info is None


@pytest.mark.unit
def test_update_settings(test_data):
    initialize_store(test_data)
    global_state.update_settings("1", {"new_key": "new_value"})
    settings = global_state.get_settings("1")
    assert settings["new_key"] == "new_value"
    assert settings["locked"] == []  # Original setting preserved


@pytest.mark.unit
def test_set_app_settings():
    original = dict(global_state.APP_SETTINGS)

    # Basic setting
    global_state.set_app_settings({"theme": "dark"})
    assert global_state.get_app_settings()["theme"] == "dark"

    # Test with instances that should propagate
    df = pd.DataFrame({"a": [1, 2, 3]})
    global_state.set_data("1", df)
    global_state.set_settings("1", {})
    global_state.set_app_settings(
        {
            "hide_shutdown": True,
            "hide_header_editor": True,
            "lock_header_menu": True,
            "hide_header_menu": True,
            "hide_main_menu": True,
            "hide_column_menus": True,
            "hide_row_expanders": True,
            "theme": "dark",
            "enable_custom_filters": True,
            "enable_web_uploads": True,
        }
    )
    settings = global_state.get_settings("1")
    assert settings.get("hide_shutdown") is True
    assert settings.get("hide_header_editor") is True
    assert settings.get("theme") == "dark"

    # Reset
    for prop, val in original.items():
        global_state.APP_SETTINGS[prop] = val


@pytest.mark.unit
def test_auth_settings():
    global_state.set_auth_settings({"active": True, "username": "admin"})
    settings = global_state.get_auth_settings()
    assert settings["active"] is True
    assert settings["username"] == "admin"

    # Reset
    global_state.set_auth_settings(
        {"active": False, "username": None, "password": None}
    )


@pytest.mark.unit
def test_chart_settings():
    global_state.set_chart_settings({"scatter_points": 20000})
    settings = global_state.get_chart_settings()
    assert settings["scatter_points"] == 20000

    # Reset
    global_state.set_chart_settings({"scatter_points": 15000, "3d_points": 40000})


@pytest.mark.unit
def test_drop_punctuation():
    result = global_state.drop_punctuation("hello, world!")
    assert result == "hello world"
    result = global_state.drop_punctuation("no_punct")
    assert "nopunct" == result


@pytest.mark.unit
def test_convert_name_to_url_path():
    assert global_state.convert_name_to_url_path(None) is None
    assert global_state.convert_name_to_url_path("Hello World") == "hello_world"
    assert global_state.convert_name_to_url_path("Test!Data") == "testdata"


@pytest.mark.unit
def test_get_query(test_data):
    initialize_store(test_data)

    # Without enable_custom_filters, query should be None
    result = global_state.get_query("1")
    assert result is None

    # With enable_custom_filters and a query
    global_state.set_settings("1", {"query": "`foo` == 1"})
    global_state.set_app_settings({"enable_custom_filters": True})
    result = global_state.get_query("1")
    assert result == "`foo` == 1"

    # Reset
    global_state.set_app_settings({"enable_custom_filters": False})


@pytest.mark.unit
def test_set_dataset(test_data):
    initialize_store(test_data)
    global_state.set_dataset("1", {"xarray": True})
    assert global_state.get_dataset("1") == {"xarray": True}


@pytest.mark.unit
def test_set_dataset_dim(test_data):
    initialize_store(test_data)
    global_state.set_dataset_dim("1", {"dim1": 10})
    assert global_state.get_dataset_dim("1") == {"dim1": 10}


@pytest.mark.unit
def test_set_metadata(test_data):
    initialize_store(test_data)
    global_state.set_metadata("1", {"info": "test"})
    assert global_state.get_metadata("1") == {"info": "test"}


@pytest.mark.unit
def test_delete_instance_nonexistent():
    # Deleting non-existent instance should not raise
    global_state.delete_instance("999")


@pytest.mark.unit
def test_load_flag_app_settings(test_data):
    initialize_store(test_data)
    # Test with app_settings having the flag
    global_state.set_app_settings({"hide_shutdown": True})
    global_state.set_settings("1", {})
    result = global_state.load_flag("1", "hide_shutdown", False)
    assert result is True
    # Reset
    global_state.set_app_settings({"hide_shutdown": False})
