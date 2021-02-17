import json
import os as _os

import dtale.global_state as global_state

_basepath = _os.path.dirname(__file__)
_languages = {}
for filename in _os.listdir(_basepath):
    lang, ext = _os.path.splitext(filename)
    if ext == ".json":
        filepath = _os.path.abspath(_os.path.join(_basepath, filename))
        with open(filepath) as f:
            _languages[lang] = json.load(f)


def text(key):
    curr_lang = global_state.get_app_settings()["language"]
    return _languages.get(curr_lang, {}).get(key) or key
