# How To Run D-Tale On Gunicorn

One question that is continually raised with regards to running D-Tale is can it be run with multiple workers sharing the data you've passed into it?

The answer is yes! It is possible using a combination of gunicorn & redis.  Here is some sample code running D-Tale embedded within a Flask application (`redis_test.py`):

```python
import dtale
import pandas as pd

from dtale.app import build_app

from dtale.views import startup
from flask import redirect, jsonify

app = build_app(reaper_on=False)

dtale.global_state.use_redis_store('/home/johndoe/dtale_data')


@app.route("/create-df")
def create_df():
    df = pd.DataFrame(dict(a=[1, 2, 3], b=[4, 5, 6]))
    instance = startup(data=df, ignore_duplicate=True)

    return redirect(f"/dtale/main/{instance._data_id}", code=302)


@app.route("/")
@app.route("/active-instances")
def get_all_dtale_servers():
    instances = []
    for data_id in dtale.global_state.keys():
        data_obj = dtale.get_instance(data_id)
        metadata = dtale.global_state.get_name(data_id)
        name = dtale.global_state.get_data_inst(data_id).name
        # convert pandas timestamp to python dateTime
        time = pd.Timestamp(metadata.get("start"), tz=None).to_pydatetime()
        datetime = time.strftime("%Y-%m-%d %H:%M:%S")
        instances.append(
            {
                'id': data_id,
                'name': name,
                'url': data_obj.main_url(),
                'datetime': datetime
            }
        )
    return jsonify(instances)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)

```

As you can see we are setting the mechanism that manages our global state (dataframes): `dtale.global_state.use_redis_store('/home/johndoe/dtale_data')`

The next important step in getting this to work is how gunicorn is invoked:
```console
gunicorn --workers=10 --preload redis_test:app
```

When invoking gunicorn it's essential that you use the `--preload` parameter so that the application code is loaded before the workers are forked. With this being true, redis is created before workers forked which is important because otherwise the redis DB will be recreated everytime a worker is forked.

Hope this leads to lots of new ideas of how D-Tale can be used and please submit any issues on the repo. Support open-source by putting your :star: on this repo!
