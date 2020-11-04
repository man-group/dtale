# How To Embed D-Tale Within Your Own Flask App

One of the nice features of D-Tale is that is it a Flask application.  And because that is the case it makes it easy to embed within your own Flask application.  Here's some sample code for a Flask app that embeds D-Tale inside it:
```python
from flask import redirect

from dtale.app import build_app
from dtale.views import startup

if __name__ == '__main__':
    app = build_app(reaper_on=False)

    @app.route("/create-df")
    def create_df():
        df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6]))
        instance = startup(data=df, ignore_duplicate=True)
        return redirect(f"/dtale/main/{instance._data_id}", code=302)

    @app.route("/")
    def hello_world():
        return 'Hi there, load data using <a href="/create-df">create-df</a>'

    app.run(host="0.0.0.0", port=8080)
```

## Create the D-Tale App

Instantiate the D-Tale application using `build_app(reaper_on=False)` and take care to make sure the reaper is turned off (that way the app isn't killed after 60 minutes of inactivity)

## Add Your Own Flask Routes
In this example we have added the routes `/create-df` and `/`

* Take a second to look at `/create-df` and how it calls `startup()`.  This stores data in the global state of D-Tale so it can be viewed
* We are not setting a `data_id` so this will automatically create one for us and assign that dataframe to it.  By not setting this parameter it will create a new `data_id` each time you call it.
* If you want to just have one continuous piece of data then you specify `data_id`.  Here's an example:
```python
cleanup("1")
startup(data_id="1",data=df)
```
* This will cleanup any data associated with the the data_id `"1"` and then assign the new data `df` in its place
* **Jinja Templates:** if you have additional jinja templates you would like to use in your app then please use the `additional_templates` parameter in `build_app`.  Here is an example:
```python
import os
from dtale.app import build_app

additional_templates = os.path.join(os.path.dirname(__file__), "templates")
app = build_app(reaper_on=False, additional_templates=additional_templates)
```
* **Static Resources:** if you additional static resources that you would like to use with your application please set up an additional route for them like this:
```python
from flask import send_from_directory

@app.route('/cdn/<path:filename>')
def custom_static(filename):
    return send_from_directory(app.config['CUSTOM_STATIC_PATH'], filename)
```
* Reference your custom static path in your jinja templates like this:
```jinja2
{{ url_for('custom_static', filename='foo') }}
```
* Reference them in javascript or CSS using the path `/cdn/[filepath or filename]`

## Start Your App

Navigate to the command-line and running `python [name of your flask module].py`

Here is a link to the [source code](https://github.com/man-group/dtale/tree/master/docs/embedded_dtale) for a little more complex example of embedding D-Tale (the frontend leaves a lot to be desired though :rofl:).

[![](http://img.youtube.com/vi/qOGkpcOSGNA/0.jpg)](http://www.youtube.com/watch?v=qOGkpcOSGNA "Embedded D-Tale")

Hope this leads to lots of new ideas of how D-Tale can be used! Please support open-source by putting your :star: on this repo!
