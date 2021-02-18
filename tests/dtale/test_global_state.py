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
    _lengths = [
        global_state.size(),
    ]
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
    mutable_mapping_instance = dict(a=1, b=2)
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
    assert global_state.build_data_id() == 1

    df = pd.DataFrame([1, 2, 3, 4, 5])
    data = {str(idx + 1): df for idx in range(10)}
    for k, v in data.items():
        global_state.set_data(k, v)
    assert global_state.build_data_id() == 11
