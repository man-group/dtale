from collections import MutableMapping

from six import PY3

DATA = {}
DTYPES = {}
SETTINGS = {}
METADATA = {}
CONTEXT_VARIABLES = {}
HISTORY = {}


def get_data(data_id=None):
    global DATA

    if data_id is None:
        return _as_dict(DATA)
    return DATA.get(data_id)


def get_dtypes(data_id=None):
    global DTYPES

    if data_id is None:
        return _as_dict(DTYPES)
    return DTYPES.get(data_id)


def get_settings(data_id=None):
    global SETTINGS

    if data_id is None:
        return _as_dict(SETTINGS)
    return SETTINGS.get(data_id)


def get_metadata(data_id=None):
    global METADATA

    if data_id is None:
        return _as_dict(METADATA)
    return METADATA.get(data_id)


def get_context_variables(data_id=None):
    global CONTEXT_VARIABLES

    if data_id is None:
        return _as_dict(CONTEXT_VARIABLES)
    return CONTEXT_VARIABLES.get(data_id)


def get_history(data_id=None):
    global HISTORY

    if data_id is None:
        return _as_dict(HISTORY)
    return HISTORY.get(data_id)


def set_data(data_id, val):
    global DATA

    DATA[data_id] = val


def set_dtypes(data_id, val):
    global DTYPES

    DTYPES[data_id] = val


def set_settings(data_id, val):
    global SETTINGS

    SETTINGS[data_id] = val


def set_metadata(data_id, val):
    global METADATA

    METADATA[data_id] = val


def set_context_variables(data_id, val):
    global CONTEXT_VARIABLES

    CONTEXT_VARIABLES[data_id] = val


def set_history(data_id, val):
    global HISTORY

    HISTORY[data_id] = val


def cleanup(data_id=None):
    """
    Helper function for cleanup up state related to a D-Tale process with a specific port

    :param port: integer string for a D-Tale process's port
    :type port: str
    """
    global DATA, DTYPES, SETTINGS, METADATA, CONTEXT_VARIABLES, HISTORY

    if data_id is None:
        DATA.clear()
        SETTINGS.clear()
        DTYPES.clear()
        METADATA.clear()
        CONTEXT_VARIABLES.clear()
        HISTORY.clear()
    else:
        for store in [DATA, DTYPES, SETTINGS, METADATA, CONTEXT_VARIABLES, HISTORY]:
            if data_id in store:
                del store[data_id]


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
                        1. Implement get, clear, __setitem__, __delitem__, __iter__, __len__, __contains__.
                        2. Either be a subclass of MutableMapping or implement the 'to_dict' method.
    :param create_store: Factory function for producing instances of <store_class>.
                         Must take 'name' as the only parameter.
    :return: None
    """
    import inspect

    assert inspect.isclass(store_class), 'Must be a class'
    assert all(hasattr(store_class, a) for a in (
        'get', 'clear', '__setitem__', '__delitem__', '__len__', '__contains__')), 'Missing required methods'
    assert (issubclass(store_class, MutableMapping)
            or hasattr(store_class, 'to_dict')), 'Must subclass MutableMapping or implement "to_dict"'

    assert inspect.isfunction(create_store), 'Must be a function'
    if PY3:
        assert list(inspect.signature(create_store).parameters) == ['name'], 'Must take "name" as the only parameter'
    else:
        assert inspect.getargspec(create_store).args == ['name'], 'Must take "name" as the only parameter'

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

    global DATA, DTYPES, SETTINGS, METADATA, CONTEXT_VARIABLES, HISTORY

    DATA = convert(DATA, 'DATA')
    DTYPES = convert(DTYPES, 'DTYPES')
    SETTINGS = convert(SETTINGS, 'SETTINGS')
    METADATA = convert(METADATA, 'METADATA')
    CONTEXT_VARIABLES = convert(CONTEXT_VARIABLES, 'CONTEXT_VARIABLES')
    HISTORY = convert(HISTORY, 'HISTORY')


def use_default_store():
    """Use the default global data store, which is dictionaries in memory."""
    def create_dict(name):
        return dict()

    use_store(dict, create_dict)


def use_shelve_store(directory):
    """
    Configure dtale to use python's standard 'shelve' library for a persistent global data store.

    :param directory: directory that the shelve db files will be stored in
    :type directory: str
    :return: None
    """
    import shelve
    from os.path import join
    from functools import wraps

    def with_db_access(flag):
        """
        Factory for creating decorators that will handle opening the database file
        with the given access and then close it after executing the method.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                self.db = shelve.open(self.filename, flag=flag)
                result = func(self, *args, **kwargs)
                self.db.close()
                return result
            return wrapper
        return decorator

    read = with_db_access('r')
    write = with_db_access('w')

    class DtaleShelf:
        """Interface allowing dtale to use 'shelf' databases for global data storage."""
        def __init__(self, filename):
            self.filename = filename
            self.db = shelve.open(self.filename, flag='n')
            self.db.close()

        @read
        def get(self, key):
            return self.db.get(key)

        @write
        def __setitem__(self, key, value):
            self.db[key] = value

        @write
        def __delitem__(self, key):
            del self.db[key]

        @read
        def __contains__(self, key):
            return key in self.db

        @write
        def clear(self):
            self.db.clear()

        @read
        def to_dict(self):
            return dict(self.db)

        @read
        def __len__(self):
            return len(self.db)

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
        raise Exception('redislite must be installed')

    class DtaleRedis(Redis):
        """Wrapper class around Redis() to make it work as a global data store in dtale."""
        def get(self, name, *args, **kwargs):
            value = super(DtaleRedis, self).get(name, *args, **kwargs)
            if value is not None:
                return pickle.loads(value)

        def set(self, name, value, *args, **kwargs):
            value = pickle.dumps(value)
            return super(DtaleRedis, self).set(name, value, *args, **kwargs)

        def clear(self):
            self.flushdb()

        def to_dict(self):
            return {k.decode('utf-8'): self.get(k) for k in self.keys()}

        def __len__(self):
            return len(self.keys())

    def create_redis(name):
        file_path = join(directory, name + '.db')
        return DtaleRedis(file_path, *args, **kwargs)

    use_store(DtaleRedis, create_redis)
