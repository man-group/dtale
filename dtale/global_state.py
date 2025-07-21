import string
import inspect

from logging import getLogger
from six import PY3

from dtale.utils import dict_merge, format_data

try:
    from collections.abc import MutableMapping
except ImportError:
    from collections import MutableMapping

logger = getLogger(__name__)

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
    "hide_header_editor": False,
    "lock_header_menu": False,
    "hide_header_menu": False,
    "hide_main_menu": False,
    "hide_column_menus": False,
    "enable_custom_filters": False,
    "enable_web_uploads": False,
    "hide_row_expanders": False,
}

AUTH_SETTINGS = {"active": False, "username": None, "password": None}

CHART_SETTINGS = {"scatter_points": 15000, "3d_points": 40000}


class DtaleInstance(object):
    _dataset = None
    _dataset_dim = None
    _dtypes = None
    _metadata = None
    _context_variables = None
    _history = None
    _settings = None
    _name = ""
    _rows = 0

    def __init__(self, data):
        self._data = data
        self._rows = 0 if self._data is None else len(data)

    def load_data(self):
        return self._data

    def rows(self, **kwargs):
        return self._rows

    @property
    def is_large(self):
        return False

    @property
    def data(self):
        return self.load_data()

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


LARGE_ARCTICDB = 1000000


def get_num_rows(lib, symbol):
    try:
        return lib._nvs.get_num_rows(symbol)
    except BaseException:
        read_options = lib._nvs._get_read_options()
        version_query = lib._nvs._get_version_query(None)
        dit = lib._nvs.version_store.read_descriptor(
            symbol, version_query, read_options
        )
        return dit.timeseries_descriptor.total_rows


class DtaleArcticDBInstance(DtaleInstance):
    def __init__(self, data, data_id, parent):
        super(DtaleArcticDBInstance, self).__init__(data)
        self.parent = parent
        data_id_segs = (data_id or "").split("|")
        symbol = data_id_segs[-1]
        if len(data_id_segs) > 1:
            self.lib_name = data_id_segs[0]
            if not parent.lib or self.lib_name != parent.lib.name:
                parent.update_library(self.lib_name)
        else:
            self.lib_name = self.parent.lib.name if self.parent.lib else None

        lib = self.parent.get_library(self.lib_name) if self.lib_name else None
        self.symbol = symbol
        self._rows = 0
        self._cols = 0
        self._base_df = None
        if lib and self.symbol and self.symbol in self.parent._symbols[self.lib_name]:
            self._rows = get_num_rows(lib, self.symbol)
            self._base_df = self.load_data(row_range=[0, 1])
            self._cols = len(format_data(self._base_df)[0].columns)
        elif (
            lib
            and self.symbol
            and self.symbol not in self.parent._symbols[self.lib_name]
        ):
            raise ValueError(
                "Symbol ({}) not in library, {}! Please select another symbol.".format(
                    symbol, self.lib_name
                )
            )

    def load_data(self, **kwargs):
        from arcticdb.version_store._store import VersionedItem

        if self.symbol not in self.parent._symbols[self.lib_name]:
            raise ValueError(
                "{} does not exist in {}!".format(self.symbol, self.lib_name)
            )

        data = self.parent.get_library(self.lib_name)._nvs.read(self.symbol, **kwargs)
        if isinstance(data, VersionedItem):
            return data.data
        return data

    def rows(self, **kwargs):
        if kwargs.get("query_builder"):
            version_query, read_options, read_query = self.parent.get_library(
                self.lib_name
            )._nvs._get_queries(
                None, None, None, None, query_builder=kwargs["query_builder"]
            )
            read_result = self.parent.get_library(self.lib_name)._nvs._read_dataframe(
                self.symbol, version_query, read_query, read_options
            )
            return len(read_result.frame_data.value.data[0])
        return self._rows

    @property
    def base_df(self):
        return self._base_df

    @property
    def is_large(self):
        if self.rows() > LARGE_ARCTICDB:
            return True
        if self._cols > 50:
            return True
        return False

    @property
    def data(self):
        return self.load_data()

    @data.setter
    def data(self, data):
        try:
            self.parent.get_library(self.lib_name).write(self.symbol, data)
        except BaseException:
            pass


class DtaleBaseStore(dict):
    def build_instance(self, data_id, data=None):
        return DtaleInstance(data)


class DtaleArcticDB(DtaleBaseStore):
    """Interface allowing dtale to use 'arcticdb' databases for global data storage."""

    def __init__(self, uri=None, library=None, **kwargs):
        from arcticdb import Arctic

        self._db = dict()
        self.uri = uri
        self.conn = Arctic(self.uri)
        self.lib = None
        self._libraries = []
        self._symbols = {}
        self.load_libraries()
        self.update_library(library)

    def get_library(self, library_name):
        return self.conn[library_name]

    def update_library(self, library=None):
        if self.lib and library == self.lib.name:  # library already selected
            return
        if library in self._libraries:
            self.lib = self.get_library(library)
            if library not in self._symbols:
                self.load_symbols()
        elif library is not None:
            raise ValueError("Library '{}' does not exist!".format(library))

    def load_libraries(self):
        self._libraries = sorted(self.conn.list_libraries())

    @property
    def libraries(self):
        return self._libraries

    def load_symbols(self, library=None):
        self._symbols[library or self.lib.name] = sorted(
            (self.conn[library] if library else self.lib).list_symbols()
        )

    @property
    def symbols(self):
        return self._symbols[self.lib.name]

    def build_instance(self, data_id, data=None):
        if data_id is None:
            return DtaleInstance(data)
        return DtaleArcticDBInstance(data, data_id, self)

    def get(self, key, **kwargs):
        if key is None:
            return self.build_instance(key)
        key = str(key)
        if key not in self._db:
            self._db[key] = self.build_instance(key)
        return self._db[key]

    def __setitem__(self, key, value):
        if key is None:
            return
        key = str(key)
        self._db[key] = value

    def __delitem__(self, key):
        if key is None:
            return
        key = str(key)
        # TODO: should we actually delete from ArcticDB???
        del self._db[key]

    def __contains__(self, key):
        key = str(key)
        return key in self._db

    def clear(self):
        pass

    def to_dict(self):
        return dict(self._db)

    def items(self):
        return self.to_dict().items()

    def keys(self):
        return self.to_dict().keys()

    def __len__(self):
        return len(self.keys())

    def save_db(self):
        raise NotImplementedError


class DefaultStore(object):
    def __init__(self):
        self._data_store = DtaleBaseStore()
        self._data_names = dict()

    # Use int for data_id for easier sorting
    def build_data_id(self):
        if len(self._data_store) == 0:
            return "1"

        def parse_int(x):
            try:
                return int(x)
            except ValueError:
                return None

        ids = list(filter(None, map(parse_int, self._data_store.keys())))
        if not len(ids):
            return "1"
        return str(max(ids) + 1)

    @property
    def is_arcticdb(self):
        return isinstance(self._data_store, DtaleArcticDB)

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
        return str(key) in self._data_store

    # this should be a property but somehow it stays 0 no matter what.
    def size(self):
        return len(self._data_store)

    def get_data_inst(self, data_id):
        # handle non-exist data_id
        if data_id is None:
            return self._data_store.build_instance(data_id)

        if str(data_id) not in self._data_store:
            self._data_store[str(data_id)] = self._data_store.build_instance(data_id)

        return self._data_store.get(str(data_id))

    def new_data_inst(self, data_id=None, instance=None):
        if data_id is None:
            data_id = self.build_data_id()
        data_id = str(data_id)
        new_data = instance or self._data_store.build_instance(data_id)
        self._data_store[data_id] = new_data
        return data_id

    def get_data(self, data_id, **kwargs):
        return self.get_data_inst(data_id).load_data(**kwargs)

    def get_data_id_by_name(self, data_name):
        data_id = next(
            (
                value
                for key, value in self._data_names.items()
                if convert_name_to_url_path(key) == data_name or key == data_name
            ),
            None,
        )
        return data_id

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

    def get_query(self, data_id):
        if load_flag(data_id, "enable_custom_filters", False):
            curr_settings = self.get_settings(data_id) or {}
            return curr_settings.get("query")
        return None

    def get_metadata(self, data_id):
        return self.get_data_inst(data_id).metadata

    def set_data(self, data_id=None, val=None):
        if data_id is None:
            data_id = self.new_data_inst()
        data_id = str(data_id)
        if data_id not in self._data_store.keys():
            data_id = self.new_data_inst(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.data = val
        self._data_store[data_id] = data_inst

    def set_dataset(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dataset = val
        self._data_store[data_id] = data_inst

    def set_dataset_dim(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dataset_dim = val
        self._data_store[data_id] = data_inst

    def set_dtypes(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.dtypes = val
        self._data_store[data_id] = data_inst

    def set_name(self, data_id, val):
        if val in [None, ""]:
            return
        if val in self._data_names:
            raise Exception("Name {} already exists!".format(val))
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        self._data_names[val] = data_id
        data_inst.name = val
        self._data_store[data_id] = data_inst

    def set_context_variables(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.context_variables = val
        self._data_store[data_id] = data_inst

    def set_settings(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.settings = val
        self._data_store[data_id] = data_inst

    def set_metadata(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.metadata = val
        self._data_store[data_id] = data_inst

    def set_history(self, data_id, val):
        data_id = str(data_id)
        data_inst = self.get_data_inst(data_id)
        data_inst.history = val
        self._data_store[data_id] = data_inst

    def delete_instance(self, data_id):
        data_id = str(data_id)
        instance = self._data_store.get(data_id)
        if instance:
            if instance.name:
                try:
                    del self._data_names[instance.name]
                except KeyError:
                    pass
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
    new_store = DtaleBaseStore()
    for k, v in _as_dict(_default_store.store).items():
        new_store[str(k)] = v
    _default_store.store.clear()
    _default_store.store = new_store
    globals()["is_arcticdb"] = getattr(_default_store, "is_arcticdb")
    globals()["store"] = getattr(_default_store, "store")
    pass


def drop_punctuation(val):
    if PY3:
        return val.translate(str.maketrans(dict.fromkeys(string.punctuation)))
    return val.translate(string.maketrans("", ""), string.punctuation)


def convert_name_to_url_path(name):
    if name is None:
        return None
    url_name = drop_punctuation("{}".format(name))
    url_name = url_name.lower()
    return "_".join(url_name.split(" "))


def get_dtype_info(data_id, col):
    dtypes = get_dtypes(data_id)  # noqa: F821
    return next((c for c in dtypes or [] if c["name"] == col), None)


def update_settings(data_id, settings):
    curr_settings = _default_store.get_settings(data_id) or {}
    updated_settings = dict_merge(curr_settings, settings)
    _default_store.set_settings(data_id, updated_settings)


def get_app_settings():
    return APP_SETTINGS


def set_app_settings(settings):
    for prop, val in settings.items():
        APP_SETTINGS[prop] = val

    instance_updates = {}
    if settings.get("hide_shutdown") is not None:
        instance_updates["hide_shutdown"] = settings.get("hide_shutdown")
    if settings.get("hide_header_editor") is not None:
        instance_updates["hide_header_editor"] = settings.get("hide_header_editor")
    if settings.get("lock_header_menu") is not None:
        instance_updates["lock_header_menu"] = settings.get("lock_header_menu")
    if settings.get("hide_header_menu") is not None:
        instance_updates["hide_header_menu"] = settings.get("hide_header_menu")
    if settings.get("hide_main_menu") is not None:
        instance_updates["hide_main_menu"] = settings.get("hide_main_menu")
    if settings.get("hide_column_menus") is not None:
        instance_updates["hide_column_menus"] = settings.get("hide_column_menus")
    if settings.get("hide_row_expanders") is not None:
        instance_updates["hide_row_expanders"] = settings.get("hide_row_expanders")
    if settings.get("theme") is not None:
        instance_updates["theme"] = settings.get("theme")
    if settings.get("enable_custom_filters") is not None:
        instance_updates["enable_custom_filters"] = settings.get(
            "enable_custom_filters"
        )
        if instance_updates["enable_custom_filters"]:
            logger.warning(
                (
                    "Turning on custom filtering. Custom filters are vulnerable to code injection attacks, please only "
                    "use in trusted environments."
                )
            )
    if settings.get("enable_web_uploads") is not None:
        instance_updates["enable_web_uploads"] = settings.get("enable_web_uploads")
        if instance_updates["enable_web_uploads"]:
            logger.warning(
                (
                    "Turning on Web uploads. Web uploads are vulnerable to blind server side request forgery, please "
                    "only use in trusted environments."
                )
            )

    if _default_store.size() > 0 and len(instance_updates):
        for data_id in _default_store.keys():
            update_settings(data_id, instance_updates)


def get_auth_settings():
    return AUTH_SETTINGS


def set_auth_settings(settings):
    for prop, val in settings.items():
        AUTH_SETTINGS[prop] = val


def get_chart_settings():
    return CHART_SETTINGS


def set_chart_settings(settings):
    for prop, val in settings.items():
        CHART_SETTINGS[prop] = val


def cleanup(data_id=None):
    if data_id is None:
        _default_store.clear_store()
    else:
        _default_store.delete_instance(data_id)


def update_id(old_data_id, new_data_id):
    if _default_store.contains(new_data_id):
        raise Exception("Data already exists for id ({})".format(new_data_id))
    curr_data = _default_store.get_data_inst(old_data_id)
    _default_store.delete_instance(old_data_id)
    data_id = str(new_data_id)
    _default_store.new_data_inst(data_id, curr_data)
    return new_data_id


def load_flag(data_id, flag_name, default):
    import dtale

    app_settings = get_app_settings()
    curr_settings = get_settings(data_id) or {}  # noqa: F821
    global_flag = getattr(dtale, flag_name.upper(), default)
    if global_flag != default:
        return global_flag
    if flag_name in app_settings and app_settings[flag_name] != default:
        return app_settings[flag_name]
    return curr_settings.get(flag_name, app_settings.get(flag_name, default))


def _as_dict(store):
    """Return the dict representation of a data store.
    Stores must either be an instance of MutableMapping OR have a to_dict method.

    :param store: data store (dict, redis connection, etc.)
    :return: dict
    """
    return dict(store.items()) if isinstance(store, MutableMapping) else store.to_dict()


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
    globals()["is_arcticdb"] = getattr(_default_store, "is_arcticdb")
    globals()["store"] = getattr(_default_store, "store")


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

    class DtaleShelf(DtaleBaseStore):
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

    class DtaleRedis(DtaleBaseStore, Redis):
        """Wrapper class around Redis() to make it work as a global data store in dtale."""

        def __init__(self, file_path, *args, **kwargs):
            super(Redis, self).__init__(file_path, *args, **kwargs)

        def __setitem__(self, key, value):
            key = str(key)
            self.set(key, value)

        def __delitem__(self, key):
            key = str(key)
            super(Redis, self).__delitem__(str(key))

        def __contains__(self, key):
            key = str(key)
            return super(Redis, self).__contains__(str(key))

        def get(self, name, *args, **kwargs):
            value = super(Redis, self).get(name, *args, **kwargs)
            if value is not None:
                return pickle.loads(value)

        def keys(self):
            return [str(k) for k in super(Redis, self).keys()]

        def set(self, name, value, *args, **kwargs):
            value = pickle.dumps(value)
            return super(Redis, self).set(name, value, *args, **kwargs)

        def clear(self):
            self.flushdb()

        def to_dict(self):
            return {k.decode("utf-8"): self.get(k) for k in super(Redis, self).keys()}

        def items(self):
            return self.to_dict().items()

        def __len__(self):
            return len(self.keys())

    def create_redis(name):
        file_path = join(directory, name + ".db")
        return DtaleRedis(file_path, *args, **kwargs)

    use_store(DtaleRedis, create_redis)


def use_arcticdb_store(*args, **kwargs):
    """
    Configure dtale to use arcticdb for a persistent global data store.

    :param uri: URI that arcticdb will connect to (local file storage: lmdb:///<path>)
    :type uri: str
    :param library: default library to load from arcticdb URI
    :type library: str
    :param symbol: defualt symbol to load from library
    :type symbol: str
    :return: None
    """

    def create_arcticdb(name):
        return DtaleArcticDB(**kwargs)

    use_store(DtaleArcticDB, create_arcticdb)
