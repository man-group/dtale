# How to update your Flask app for Internationalization

## Create a folder containing your translation files

I ended up adding a folder `translations` to my application

## This folder will contain JSON files for each language you'll support
* The keys will be the same in each file but the values will be in the language of the file
* Examples
  * english (en.json) -> `{"Hello": "Hello"}`
  * spanish (es.json) -> `{"Hello": "Hola"}`

## Within the folder for your translation files I added the following `__init__.py` file

This code will load your JSON translation files and store them in a dictionary with the name of the file as the keys. We'll also have a function `text` for fetching the value for a selected language based on a key parameter and return the key if it doesn't exist in the selected translation file.

```python
import json
import os as _os

_basepath = _os.path.dirname(__file__)
_languages = {}
for filename in _os.listdir(_basepath):
    lang, ext = _os.path.splitext(filename)
    if ext == ".json":
        filepath = _os.path.abspath(_os.path.join(_basepath, filename))
        with open(filepath) as f:
            _languages[lang] = json.load(f)


def text(language, key):
    return _languages.get(language, {}).get(key) or key
``` 

## Add a route for updating the selected language and passing `text` function into jinja rendering

* `update-language`: This is just a simple route to change which language is selected. Chose the front-end mechanism of your choice for choosing (EX: dropdown, radio button, etc...)
* `/main`: This is the route for rendering the HTML landing page for an app.  We'll pass in a lambda wrapping the `text` function from `translations` with the current `SELECTED_LANGUAGE` for ease of use.

```python
from flask import Flask, jsonify, request, render_template
from translations import text

SELECTED_LANGUAGE = 'en'

app = Flask(__name__)

@app.route("/update-language")
def update_language():
    global SELECTED_LANGUAGE

    language = request.args.get("language")
    SELECTED_LANGUAGE = language
    
    return jsonify(dict(success=True))

@app.route('/main')
def render_main():
    return render_template("main.html", text=lambda key: text(SELECTED_LANGUAGE, key))
```

## Update your jinja template to use your `text` function

Here's just a simple example of using the `text` function

```
<!doctype html>
<html>
    <body>
        <h1>{{text("Hello")}}</h1>
    </body>
</html>
```

## Another option for controlling selected language would be an abstracted route

```
@app.route('/main/<language>')
def render_main(language):
    return render_template("main.html", text=lambda key: text(language, key))
```