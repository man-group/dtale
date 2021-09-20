import string
import inspect


from six import PY3

try:
    from collections.abc import MutableMapping
except ImportError:
    from collections import MutableMapping


APP_SETTINGS = {
    "theme": "light",
    "pin_menu": False,
    "language": "en",
    "github_fork": False,
    "hide_shutdown": False,
    "max_column_width": None,
    "max_row_height": None,
    "main_title": None,
    "main_title_font": None,
    "query_engine": "python",
    "open_custom_filter_on_startup": False,
    "open_predefined_filters_on_startup": False,
    "hide_drop_rows": False,
}

AUTH_SETTINGS = {
    "active": False,
    "username": None,
    "password": None,
}

CHART_SETTINGS = {
    "scatter_points": 15000,
    "3d_points": 40000,
}


class DtaleInstance(object):

    _dataset = None
    _dataset_dim = None
    _dtypes = None
    _metadata = None
    _context_variables = None
    _history = None
    _settings = None
    _name = ""

    def __init__(self, data):
        self._data = data

    @property
    def data(self):
        return self._data

    @property
    def name(self):
        return self._name

    @property
    def dataset(self):
        return self._dataset

    @property
    def dataset_dim(self):
        return self._dataset_dim

    @property
    def dtypes(self):
        return self._dtypes

    @property
    def metadata(self):
        return self._metadata

    @property
    def context_variables(self):
        return self._context_variables

    @property
    def history(self):
        return self._history

    @property
    def settings(self):
        return self._settings

    @property
    def is_xarray_dataset(self):
        if self._dataset is not None:
            return True
        return False

    @data.setter
    def data(self, data):
        self._data = data

    @name.setter
    def name(self, name):
        self._name = name

    @dataset.setter
    def dataset(self, dataset):
        self._dataset = dataset

    @dataset_dim.setter
    def dataset_dim(self, dataset_dim):
        self._dataset_dim = dataset_dim

    @dtypes.setter
    def dtypes(self, dtypes):
        self._dtypes = dtypes

    @context_variables.setter
    def context_variables(self, context_variables):
        self._context_variables = context_variables

    @metadata.setter
    def metadata(self, metadata):
        self._metadata = metadata

    @history.setter
    def history(self, history):
        self._history = history

    @settings.setter
    def settings(self, settings):
        self._settings = settings


class DefaultStore(object):
    def __init__(self):
        self._data_store = dict()
        self._data_names = dict()

    # Use int for data_id for easier sorting
    def build_data_id(self):
        if len(self._data_store) == 0:
            return 1
        return max(list(map(lambda x: int(x), self._data_store.keys()))) + 1

    # exposing  _data_store for custom data store plugins.
    @property
    def store(self):
        return self._data_store

    @store.setter
    def store(self, new_store):
        self._data_store = new_store

    def keys(self):
        return list(self._data_store.keys())

    def items(self):
        return self._data_store.items()

    def contains(self, key):
        if key is None:
            return False
        return int(key) in self._data_store

    # this should be a property but somehow it stays 0 no matter what.
    def size(self):
        return len(self._data_store)

    def get_data_inst(self, data_id):
        # handle non-exist data_id
        if data_id is None or int(data_id) not in self._data_store:
            return DtaleInstance(None)

        # force convert data_id to int
        data_id = int(data_id)
        return self._data_store.get(data_id)

    def new_data_inst(self, data_id=None):
        if data_id is None:
            data_id = self.build_data_id()
        new_data = DtaleInstance(None)
        data_id = int(data_id)
        self._data_store[data_id] = new_data
        return data_id

    def get_data(self, data_id):
        return self.get_data_inst(data_id).data

    def get_data_id_by_name(self, data_name):
        if data_name not in self._data_names:
            return None
        return self._data_names[data_name]

    def get_dataset(self, data_id):
        return self.get_data_inst(data_id).dataset

    def get_dataset_dim(self, data_id):
        return self.get_data_inst(data_id).dataset_dim

    def get_dtypes(self, data_id):
        return self.get_data_inst(data_id).dtypes

    def get_context_variables(self, data_id):
        return self.get_data_inst(data_id).context_variables

    def get_history(self, data_id):
        return self.get_data_inst(data_id).history

    def get_name(self, data_id):
        return self.get_data_inst(data_id).name

    def get_settings(self, data_id):
        return self.get_data_inst(data_id).settings

    def get_metadata(self, data_id):
        return self.get_data_inst(data_id).metadata

    def set_data(self, data_id=None, val=None):
        if data_id is None:
            data_id = self.new_data_inst()
        data_id = int(data_id)
        if data_id not in self._data_store.keys():
            data_id = self.new_data_inst(int(data_id))
        data_inst = self.get_data_inst(data_id)
        data_inst.data = val
        self._data_store[data_id] = data_inst

    def set_dataset(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dataset = val
        self._data_store[data_id] = data_inst

    def set_dataset_dim(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dataset_dim = val
        self._data_store[data_id] = data_inst

    def set_dtypes(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dtypes = val
        self._data_store[data_id] = data_inst

    def set_name(self, data_id, val):
        if val in [None, ""]:
            return
        if val in self._data_names:
            raise Exception("Name {} already exists!".format(val))
        data_inst = self.get_data_inst(data_id)
        data_id = int(data_id)
        self._data_names[val] = data_id
        data_inst.name = val
        self._data_store[data_id] = data_inst

    def set_context_variables(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.context_variables = val
        self._data_store[data_id] = data_inst

    def set_settings(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.settings = val
        self._data_store[data_id] = data_inst

    def set_metadata(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.metadata = val
        self._data_store[data_id] = data_inst

    def set_history(self, data_id, val):
        data_id = int(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.history = val
        self._data_store[data_id] = data_inst

    def delete_instance(self, data_id):
        data_id = int(data_id)
        try:
            del self._data_store[data_id]
        except KeyError:
            pass

    def clear_store(self):
        self._data_store.clear()
        self._data_names.clear()


"""
This block dynamically exports functions from DefaultStore class.
It's here for backward compatibility reasons.
It may trigger linter errors in other py files because functions are not statically exported.
"""
_default_store = DefaultStore()
fn_list = list(
    filter(
        lambda x: not x.startswith("_"),
        [x[0] for x in inspect.getmembers(DefaultStore)],
    )
)
for fn_name in fn_list:
    globals()[fn_name] = getattr(_default_store, fn_name)


# for tests. default_store is always initialized.
def use_default_store():
    new_store = dict()
    for k, v in _as_dict(_default_store.store).items():
        new_store[int(k)] = v
    _default_store.store.clear()
    _default_store.store = new_store
    pass


def drop_punctuation(val):
    if PY3:
        return val.translate(str.maketrans(dict.fromkeys(string.punctuation)))
    return val.translate(string.maketrans("", ""), string.punctuation)


def convert_name_to_url_path(name):
    if name is None:
        return None
    url_name = drop_punctuation(name)
    url_name = url_name.lower()
    return "_".join(url_name.split(" "))


def get_dtype_info(data_id, col):
    dtypes = get_dtypes(data_id)  # noqa: F821
    return next((c for c in dtypes or [] if c["name"] == col), None)


def get_app_settings():
    global APP_SETTINGS
    return APP_SETTINGS


def set_app_settings(settings):
    global APP_SETTINGS

    for prop, val in settings.items():
        APP_SETTINGS[prop] = val


def get_auth_settings():
    global AUTH_SETTINGS
    return AUTH_SETTINGS


def set_auth_settings(settings):
    global AUTH_SETTINGS

    for prop, val in settings.items():
        AUTH_SETTINGS[prop] = val


def get_chart_settings():
    global CHART_SETTINGS
    return CHART_SETTINGS


def set_chart_settings(settings):
    global CHART_SETTINGS

    for prop, val in settings.items():
        CHART_SETTINGS[prop] = val


def cleanup(data_id=None):
    if data_id is None:
        _default_store.clear_store()
    else:
        _default_store.delete_instance(data_id)


def load_flag(data_id, flag_name, default):
    import dtale

    curr_settings = get_settings(data_id) or {}  # noqa: F821
    global_flag = getattr(dtale, flag_name.upper())
    if global_flag != default:
        return global_flag
    return curr_settings.get(flag_name, default)


def _as_dict(store):
    """Return the dict representation of a data store.
    Stores must either be an instance of MutableMapping OR have a to_dict method.

    :param store: data store (dict, redis connection, etc.)
    :return: dict
    """
    return dict(store) if isinstance(store, MutableMapping) else store.to_dict()


def use_store(store_class, create_store):
    """
    Customize how dtale stores and retrieves global data.
    By default it uses global dictionaries, but this can be problematic if
    there are memory limitations or multiple python processes are running.
    Ex: a web server with multiple workers (processes) for processing requests.

    :param store_class: Class providing an interface to the data store. To be valid, it must:
                        1. Implement get, keys, items clear, __setitem__, __delitem__, __iter__, __len__, __contains__.
                        2. Either be a subclass of MutableMapping or implement the 'to_dict' method.
    :param create_store: Factory function for producing instances of <store_class>.
                         Must take 'name' as the only parameter.
    :return: None
    """

    assert inspect.isclass(store_class), "Must be a class"
    assert all(
        hasattr(store_class, a)
        for a in (
            "get",
            "clear",
            "keys",
            "items",
            "__setitem__",
            "__delitem__",
            "__len__",
            "__contains__",
        )
    ), "Missing required methods"
    assert issubclass(store_class, MutableMapping) or hasattr(
        store_class, "to_dict"
    ), 'Must subclass MutableMapping or implement "to_dict"'

    assert inspect.isfunction(create_store), "Must be a function"
    if PY3:
        assert list(inspect.signature(create_store).parameters) == [
            "name"
        ], 'Must take "name" as the only parameter'
    else:
        assert inspect.getargspec(create_store).args == [
            "name"
        ], 'Must take "name" as the only parameter'

    def convert(old_store, name):
        """Convert a data store to the new type
        :param old_store: old data store
        :param name: name associated with this data store
        :return: new data store
        """
        new_store = create_store(name)
        assert isinstance(new_store, store_class)
        new_store.clear()
        for k, v in _as_dict(old_store).items():
            new_store[k] = v
        old_store.clear()
        return new_store

    _default_store.store = convert(_default_store.store, "default_store")


def use_shelve_store(directory):
    """
    Configure dtale to use python's standard 'shelve' library for a persistent global data store.

    :param directory: directory that the shelve db files will be stored in
    :type directory: str
    :return: None
    """
    import shelve
    import time
    from os.path import join
    from threading import Thread

    class DtaleShelf(object):
        """Interface allowing dtale to use 'shelf' databases for global data storage."""

        def __init__(self, filename):
            self.filename = filename
            self.db = shelve.open(self.filename, flag="c", writeback=True)
            # super hacky autosave
            t = Thread(target=self.save_db)
            t.daemon = True
            t.start()

        def get(self, key):
            # using str here because shelve doesn't support int keys
            key = str(key)
            return self.db.get(key)

        def __setitem__(self, key, value):
            key = str(key)
            self.db[key] = value
            self.db.sync()

        def __delitem__(self, key):
            key = str(key)
            del self.db[key]
            self.db.sync()

        def __contains__(self, key):
            key = str(key)
            return key in self.db

        def clear(self):
            self.db.clear()
            self.db.sync()

        def to_dict(self):
            return dict(self.db)

        def items(self):
            return self.to_dict().items()

        def keys(self):
            return self.to_dict().keys()

        def __len__(self):
            return len(self.db)

        def save_db(self):
            while True:
                self.db.sync()
                time.sleep(5)

    def create_shelf(name):
        file_path = join(directory, name)
        return DtaleShelf(file_path)

    use_store(DtaleShelf, create_shelf)


def use_redis_store(directory, *args, **kwargs):
    """Configure dtale to use redis for the global data store. Useful for web servers.

    :param db_folder: folder that db files will be stored in
    :type db_folder: str
    :param args: All other arguments supported by the redislite.Redis() class
    :param kwargs: All other keyword arguments supported by the redislite.Redis() class
    :return: None
    """
    import pickle
    from os.path import join

    try:
        from redislite import Redis
    except ImportError:
        raise Exception("redislite must be installed")

    class DtaleRedis(Redis):
        """Wrapper class around Redis() to make it work as a global data store in dtale."""

        def get(self, name, *args, **kwargs):
            value = super(DtaleRedis, self).get(name, *args, **kwargs)
            if value is not None:
                return pickle.loads(value)

        def keys(self):
            return [int(k) for k in super(DtaleRedis, self).keys()]

        def set(self, name, value, *args, **kwargs):
            value = pickle.dumps(value)
            return super(DtaleRedis, self).set(name, value, *args, **kwargs)

        def clear(self):
            self.flushdb()

        def to_dict(self):
            return {
                k.decode("utf-8"): self.get(k) for k in super(DtaleRedis, self).keys()
            }

        def items(self):
            return self.to_dict().items()

        def __len__(self):
            return len(self.keys())

    def create_redis(name):
        file_path = join(directory, name + ".db")
        return DtaleRedis(file_path, *args, **kwargs)

    use_store(DtaleRedis, create_redis)
