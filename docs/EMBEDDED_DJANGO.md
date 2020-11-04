# How to Embed D-Tale Within a Django App

## Install Dependencies & Create Django Sample App

To start off run the following commands within your virtual environment:
```console
home:~ pip install dtale
home:~ pip install Django
home:~ django-admin startproject dtale_test
```

## Add `dispatcher.py`

The Django project should have created the following folder: `dtale_test/dtale_test`

Navigate to that folder and add create a file `dispatcher.py` containing the following code:
```python
from threading import Lock
from werkzeug.wsgi import pop_path_info, peek_path_info

class PathDispatcher(object):

    def __init__(self, default_app, create_app):
        self.default_app = default_app
        self.create_app = create_app
        self.lock = Lock()
        self.instances = {}

    def get_application(self, prefix):
        with self.lock:
            app = self.instances.get(prefix)
            if app is None:
                app = self.create_app(prefix)
                if app is not None:
                    self.instances[prefix] = app
            return app

    def __call__(self, environ, start_response):
        app = self.get_application(peek_path_info(environ))
        if app is not None:
            pop_path_info(environ)
        else:
            app = self.default_app
        return app(environ, start_response)
```
This will allow wsgi to route between your Django application and D-Tale's Flask application.

## Adding Your Views
Go go `dtale_test/dtale_test/views.py` and update it to contain the following:
```python
import pandas as pd

from django.http import HttpResponse
from django.shortcuts import redirect

from dtale.views import startup


def index(request):
    return HttpResponse("""
        <h1>Django/Flask Hybrid</h1>
        <span>Generate sample dataframe in D-Tale by clicking this </span><a href="/create-df">link</a>
    """)


def create_df(request):
    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6]))
    instance = startup(data=df, ignore_duplicate=True)

    resp = redirect(f"/flask/dtale/main/{instance._data_id}")
    return resp
```

* **create_df**: by hitting this view you will create a simple pandas dataframe and store it in D-Tale.
   * Using the `dtale.views.startup` function will store your dataframe in D-Tale and assign it an auto-generated id, `'1'`
   * Once `startup` completes this dataframe should be available to be viewed from the D-Tale Flask process at the route, `/dtale/main/1`
   * We'll jump to it by using `redirect`. _Please take a second to note the prefix `/flask` on our route to D-Tale, that will come into play later_.
* **index**: just a simple main view which includes some HTML with a link to the `create-df` route which we'll map later to our `create_df` view function

## Mapping views to routes

Navigate to `dtale_test/dtale_test/urls.py` and add the following:
```python
from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create-df/', views.create_df, name='create-df'),
    path('admin/', admin.site.urls),
]
```
This code will map our Django views to routes available from your browser.  We will leave the route to the `index` view as an empty string so that way when you hit the host & port of your Django app it will default to that view.

## Update `wsgi.py` To Use the Dispatcher
Navigate to `dtale_test/dtale_test/wsgi.py` and add the following code:
```python
import os

from django.core.wsgi import get_wsgi_application
from dtale.app import build_app

from .dispatcher import PathDispatcher

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dtale_test.settings')


def make_app(prefix):
    if prefix == 'flask':
        return build_app(app_root='/flask', reaper_on=False)


application = PathDispatcher(get_wsgi_application(), make_app)
```
What this code will do is use the `PathDispatcher` class we created earlier to check any incoming requests to see if their route starts with the prefix `/flask` and if it does re-route them to D-Tale using it's `build_app` function.  Anything else will be routed to the Django views we created (`create_df` & `index`)

**Couple Things To Take Note Of**
* `build_app` will only be called once because each prefix that comes into `PathDispatcher` will be store app associated to it in a dictionary so that we won't continually creating Flask apps.
* Any routes you've seen D-Tale previously will now, for the purposes of this application, will be prefixed with `/flask`.  The `app_root` parameter to the `build_app` function will handle this for us.  Also, you can name set your prefix to whatever you'd like it doesn't have to be `/flask`.

### Putting It All Together
It's now time to run this thing. :)
* Go to your command-line and navigate to the first `dtale_test` folder containing the `manage.py` file and run the following command:
```commandline
python manage.py runserver
```
* Once you see this output: `Starting development server at http://127.0.0.1:8000/`
* Go to any browser and hit the url: `http://127.0.0.1:8000`
* This should bring you to the output of the `index` view function we defined earlier.
![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/django_app/index.png)
* Click the `link` and it will fire the contents of the `create_df` function and then re-route you to D-Tale
![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/django_app/dtale.png)
* Look at the location in your browser and you'll see that it's pointing at `/flask/dtale/main/1`
* It's using the `/flask` prefix as we expected!

You're now running a Django application & a Flask application together.  The world is your oyster!

Hope this helps and support open-source by putting your :star: on this repo!
