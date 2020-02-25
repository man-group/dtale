# Data Storage and managing Global State
D-Tale's default protocol for storing data is to simply use global variables, and this is typically optimal because it's in-memory and doesn't require any serialization/deserialization.  However, it can be problematic in certain scenarios.  For example, suppose D-Tale is running on a web server that has multiple workers ([gunicorn](https://github.com/benoitc/gunicorn)) for handling requests; each of those workers will have a separate python process and a separate set of globals.

To mitigate these issues, D-Tale has functions which allow users to configure what system is used for storing data.  These functions should be invoked immediately after dtale is imported.  The current options are:

## Redis
[Redis](https://redislite.readthedocs.io/en/latest/) is ideal for situations in which there are multiple python processes *but* you still want the speed benefits of an in-memory data store. Some things to note are:
* You must have redislite installed

Here is an example of configuring D-Tale to use redis:
```python
import dtale

dtale.global_state.use_redis_store('/home/jdoe/dtale_data')
```

## Shelve
[Shelve](https://docs.python.org/3/library/shelve.html) is a standard module for persistent storage of python objects. It is useful if for whatever reason you don't want all of D-Tale's data in memory simultaneously. Some things to note are:
* The current implementation does not leave connections opens, so for large datasets it can be quite laggy.

Here is an example of configuring D-Tale to use shelve:
```python
import dtale

dtale.global_state.use_shelve_store('/home/jdoe/dtale_data')
```

## Custom
Users can also have D-Tale use *any* system for data storage.  All that's required are:
1. A class that will essentially function as a dictionary.  It must implement the 'get', 'clear', '\_\_setitem\_\_', '\_\_delitem\_\_', '\_\_len\_\_', and '\_\_contains\_\_' methods, and it must either be a subclass of 'MutableMapping' *or* implement a 'to_dict' method.
2. A factory function that takes 'name' (string) as a parameter and returns an instance of the store class.

Here is an example of configuring D-Tale to use a custom store:
```python
import dtale


class CustomStore:
    """Contrived example of building a custom store for D-Tale"""
    def __init__(self):
        self.data = dict()

    def get(self, key):
        return self.data.get(key)

    def clear(self):
        self.data.clear()

    def __setitem__(self, key, value):
        self.data[key] = value

    def __delitem__(self, key):
        if key in self.data:
            del self.data[key]

    def __len__(self):
        return len(self.data)

    def __contains__(self, key):
        return key in self.data

    def to_dict(self):
        return self.data


def create_custom_store(name):
    return CustomStore()


dtale.global_state.use_store(CustomStore, create_custom_store)
```
