[![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Title.png)](https://github.com/man-group/dtale)

[Live Demo](http://andrewschonfeld.pythonanywhere.com/dtale/main)

-----------------

[![CircleCI](https://circleci.com/gh/man-group/dtale.svg?style=shield&circle-token=4b67588a87157cc03b484fb96be438f70b5cd151)](https://circleci.com/gh/man-group/dtale)
[![PyPI](https://img.shields.io/pypi/pyversions/dtale.svg)](https://pypi.python.org/pypi/dtale/)
[![ReadTheDocs](https://readthedocs.org/projects/dtale/badge)](https://dtale.readthedocs.io)
[![codecov](https://codecov.io/gh/manahl/dtale/branch/master/graph/badge.svg)](https://codecov.io/gh/manahl/dtale)
[![Downloads](https://pepy.tech/badge/dtale)](https://pepy.tech/project/dtale)

## Getting Started

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/blog/dtale_demo_mini.gif)

Setup/Activate your environment and install the egg

**Python 3**
```bash
# create a virtualenv, if you haven't already created one
$ python3 -m venv ~/pyenvs/dtale
$ source ~/pyenvs/dtale/bin/activate

# install dtale egg (important to use the "--upgrade" every time you install so it will grab the latest version)
$ pip install --upgrade dtale
```
**Python 2**
```bash
# create a virtualenv, if you haven't already created one
$ python -m virtualenv ~/pyenvs/dtale
$ source ~/pyenvs/dtale/bin/activate

# install dtale egg (important to use the "--upgrade" every time you install so it will grab the latest version)
$ pip install --upgrade dtale
```
Now you will have to ability to use D-Tale from the command-line or within a python-enabled terminal

### Command-line
Base CLI options (run `dtale --help` to see all options available)

|Prop|Description|
|:--------:|------|
|`--host`|the name of the host you would like to use (most likely not needed since `socket.gethostname()` should figure this out)|
|`--port`|the port you would like to assign to your D-Tale instance|
|`--debug`|turn on Flask's "debug" mode for your D-Tale instance|
|`--no-reaper`|flag to turn off auto-reaping subprocess (kill D-Tale instances after an hour of inactivity), good for long-running displays |
|`--open-browser`|flag to automatically open up your server's default browser to your D-Tale instance|

Loading data from **arctic**
```bash
dtale --arctic-host mongodb://localhost:27027 --arctic-library jdoe.my_lib --arctic-node my_node --arctic-start 20130101 --arctic-end 20161231
```
Loading data from **CSV**
```bash
dtale --csv-path /home/jdoe/my_csv.csv --csv-parse_dates date
```
Loading data from a **Custom** loader
- Using the DTALE_CLI_LOADERS environment variable, specify a path to a location containing some python modules
- Any python module containing the global variables LOADER_KEY & LOADER_PROPS will be picked up as a custom loader
  - LOADER_KEY: the key that will be associated with your loader.  By default you are given **arctic** & **csv** (if you use one of these are your key it will override these)
  - LOADER_PROPS: the individual props available to be specified.
    - For example, with arctic we have host, library, node, start & end.
    - If you leave this property as an empty list your loader will be treated as a flag.  For example, instead of using all the arctic properties we would simply specify `--arctic` (this wouldn't work well in arctic's case since it depends on all those properties)
- You will also need to specify a function with the following signature `def find_loader(kwargs)` which returns a function that returns a dataframe or `None`
- Here is an example of a custom loader:
```python
from dtale.cli.clickutils import get_loader_options

'''
  IMPORTANT!!! This global variable is required for building any customized CLI loader.
  When find loaders on startup it will search for any modules containing the global variable LOADER_KEY.
'''
LOADER_KEY = 'testdata'
LOADER_PROPS = ['rows', 'columns']


def test_data(rows, columns):
    import pandas as pd
    import numpy as np
    import random
    from past.utils import old_div
    from pandas.tseries.offsets import Day
    from dtale.utils import dict_merge
    import string

    now = pd.Timestamp(pd.Timestamp('now').date())
    dates = pd.date_range(now - Day(364), now)
    num_of_securities = old_div(rows, len(dates))
    securities = [
        dict(security_id=100000 + sec_id, int_val=random.randint(1, 100000000000),
             str_val=random.choice(string.ascii_letters) * 5)
        for sec_id in range(num_of_securities)
    ]
    data = pd.concat([
        pd.DataFrame([dict_merge(dict(date=date), sd) for sd in securities])
        for date in dates
    ], ignore_index=True)[['date', 'security_id', 'int_val', 'str_val']]

    col_names = ['Col{}'.format(c) for c in range(columns)]
    return pd.concat([data, pd.DataFrame(np.random.randn(len(data), columns), columns=col_names)], axis=1)


# IMPORTANT!!! This function is required for building any customized CLI loader.
def find_loader(kwargs):
    test_data_opts = get_loader_options(LOADER_KEY, kwargs)
    if len([f for f in test_data_opts.values() if f]):
        def _testdata_loader():
            return test_data(int(test_data_opts.get('rows', 1000500)), int(test_data_opts.get('columns', 96)))

        return _testdata_loader
    return None
```
In this example we simplying building a dataframe with some dummy data based on dimensions specified on the command-line:
- `--testdata-rows`
- `--testdata-columns`

Here's how you would use this loader:
```bash
DTALE_CLI_LOADERS=./path_to_loaders bash -c 'dtale --testdata-rows 10 --testdata-columns 5'
```


### Python Terminal
This comes courtesy of PyCharm
![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Python_Terminal.png)
Feel free to invoke `python` or `ipython` directly and use the commands in the screenshot above and it should work
#####Additional functions available programatically
```python
import dtale
import pandas as pd

df = pd.DataFrame([dict(a=1,b=2,c=3)])

# Assigning a reference to a running D-Tale process
d = dtale.show(df)

# Accessing data associated with D-Tale process
tmp = d.data.copy()
tmp['d'] = 4

# Altering data associated with D-Tale process
# FYI: this will clear any front-end settings you have at the time for this process (filter, sorts, formatting)
d.data = tmp

# Shutting down D-Tale process
d.kill()

# using Python's `webbrowser` package it will try and open your server's default browser to this process
d.open_browser()

# There is also some helpful metadata about the process
d._port  # the process's port
d._url  # the url to access the process

```

## UI
Once you have kicked off your D-Tale session please copy & paste the link on the last line of output in your browser
![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Browser1.png)

The information in the upper right-hand corner is similar to saslook ![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Info_cell.png)
- lower-left => row count
- upper-right => column count
- clicking the triangle displays the menu of standard functions (click outside menu to close it)
![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Info_menu_small.png)

Selecting/Deselecting Columns
- to select a column, simply click on the column header (to deselect, click the column header again)
  - You'll notice that the columns you've selected will display in the top of your browser
![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Col_select.png)

### Menu functions w/ no columns selected

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Info_menu.png)

- **Describe**: view all the columns & their data types as well as individual details of each column

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Describe.png)

|Data Type|Display|Notes|
|--------|:------:|:------:|
|date|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Describe_date.png)||
|string|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Describe_string.png)|If you have less than or equal to 100 unique values they will be displayed at the bottom of your popup|
|int|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Describe_int.png)|Anything with standard numeric classifications (min, max, 25%, 50%, 75%) will have a nice boxplot with the mean (if it exists) displayed as an outlier if you look closely.|
|float|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Describe_float.png)||

- **Filter**: apply a simple pandas `query` to your data (link to pandas documentation included in popup)

|Editing|Result|
|--------|:------:|
|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Filter_apply.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Post_filter.png)|

- **Coverage**: check for coverage gaps on column(s) by way of other column(s) as group(s)
  - Select column(s) in "Group(s)" & "Col(s)"
    - date-type columns you can also specify a frequency of D, W, M, Q, Y
    - Select multiple values in "Cols(s)" and/or "Groups(s)" by holdings the SHIFT key as you click
  - Click "Load"
  - The output will be the counts of non-nan records in "Col(s)" grouped by your selections in "Group(s)"  

|Daily|Daily Regional|
|-----|:-------------:|
|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Coverage_daily.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Coverage_daily_regions.png)|

- **Correlations**: shows a pearson correlation matrix of all numeric columns against all other numeric columns
  - By deafult, it will show a grid of pearson correlations
  - If you have a date-type column, you can click an individual cell and see a timeseries of pearson correlations for that column combination
    - Currently if you have multiple date-type columns you will have the ability to toggle between them by way of a drop-down
  - Furthermore, you can click on individual points in the timeseries to view the scatter plot of the points going into that correlation

|Matrix|Timeseries|Scatter|
|------|----------|-------|
|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Correlations.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Correlations_ts.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Correlations_scatter.png)|

- **About**: This will give you information about what version of D-Tale you're running as well as if its out of date to whats on PyPi.

|Up To Date|Out Of Date|
|--------|:------:|
|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/About-up-to-date.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/About-out-of-date.png)|

- **Instances**: this will give you information about other D-Tale instances are running under your current Python process.

For example, if you ran the following script:
```python
import pandas as pd
import dtale

dtale.show(pd.DataFrame([dict(foo=1, bar=2, biz=3, baz=4, snoopy_D_O_double_gizzle=5)]))
dtale.show(pd.DataFrame([
    dict(a=1, b=2, c=3, d=4),
    dict(a=2, b=3, c=4, d=5),
    dict(a=3, b=4, c=5, d=6),
    dict(a=4, b=5, c=6, d=7)
]))
dtale.show(pd.DataFrame([range(6), range(6), range(6), range(6), range(6), range(6)]), name="foo")
```
This will make the **Instances** button available in all 3 of these D-Tale instances. Clicking that button while in the first instance invoked above will give you this popup:

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Instances.png)

The grid above contains the following information:
  - Process: timestamp when the process was started along with the name (if specified in `dtale.show()`)
  - Rows: number of rows
  - Columns: number of columns
  - Column Names: comma-separated string of column names (only first 30 characters, hover for full listing)
  - Preview: this button is available any of the non-current instances.  Clicking this will bring up left-most 5X5 grid information for that instance
  - The row highlighted in green signifys the current D-Tale instance
  - Any other row can be clicked to switch to that D-Tale instance

Here is an example of clicking the "Preview" button:

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Instances_preview.png)

- **Resize**: mostly a fail-safe in the event that your columns are no longer lining up. Click this and should fix that
- **Shutdown**: pretty self-explanatory, kills your D-Tale session (there is also an auto-kill process that will kill your D-Tale after an hour of inactivity)

### Menu functions w/ one column is selected

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Menu_one_col.png)

- **Move To Front**: moves your column to the front of the "unlocked" columns
- **Lock**: adds your column to "locked" columns
  - "locked" means that if you scroll horizontally these columns will stay pinned to the right-hand side
  - this is handy when you want to keep track of which date or security_id you're looking at
  - by default, any index columns on the data passed to D-Tale will be locked
- **Unlock**: removed column from "locked" columns
- **Sorting** (Ascending/Descending/Clear): applies/removes sorting to the column selected
  - Important: as you add sorts they sort added will be added to the end of the multi-sort.  For example:

| Action        | Sort           |
| ------------- |:--------------:|
| select "a"    |                |
| sort asc      | a (asc)        |
| deselect "a"  | a (asc)        |
| select "b"    | a (asc)        |
| sort desc     | a (asc), b(desc)|
| select "a"    | a (asc), b(desc)|
| clear sort    | b(desc)|
| sort desc    | b(desc), a(desc)|
| select "b"    | b(desc), a(desc)|
| clear sort   | |
| sort asc     | a (asc), b(asc) | 

- **Formats**: apply simple formats to numeric values in your grid

|Editing|Result|
|--------|:------:|
|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Formatting_apply.png)|![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Post_formatting.png)|

Here's a grid of all the formats available with -123456.789 as input:
  
| Format        | Output         |
| ------------- |:--------------:|
| Precision (6) | -123456.789000 |
| Thousands Sep | -123,456.789   |
| Abbreviate    | -123k          |
| Exponent      | -1e+5          |
| BPS           | -1234567890BPS |
| Red Negatives | <span style="color: red;">-123457</span>|

- **Histogram**: display histograms in bins of 5, 10, 20 or 50 for any numeric column

![](https://raw.githubusercontent.com/man-group/dtale/master/docs/images/Histogram.png)

## For Developers

### Getting Started

Clone the code (git clone ssh://git@github.com:manahl/dtale.git), then start the backend server:

```bash
$ git clone ssh://git@github.com:manahl/dtale.git
# install the dependencies
$ python setup.py develop
# start the server
$ python dtale --csv-path /home/jdoe/my_csv.csv --csv-parse_dates date
```

You can also run dtale from PyDev directly.

You will also want to import javascript dependencies and build the source:

``` bash
$ npm install
# 1) a persistent server that serves the latest JS:
$ npm run watch
# 2) or one-off build:
$ npm run build
```

### Running tests

The usual npm test command works:

```
$ npm test
```

You can run individual test files:

```
$ TEST=static/__tests__/dtale/DataViewer-base-test.jsx npm run test-file
```

### Linting

You can lint all the JS and CSS to confirm there's nothing obviously wrong with
it:

``` bash
$ npm run lint -s
```

You can also lint individual JS files:

``` bash
$ npm run lint-js-file -s -- static/dtale/DataViewer.jsx
```

### Formatting JS

You can auto-format code as follows:

``` bash
$ npm run format
```

### Docker development

You can build python 27-3 & run D-Tale as follows:
```bash
$ yarn run build
$ docker-compose build dtale_2_7
$ docker run -it --network host dtale_2_7:latest
$ python
>>> import pandas as pd
>>> df = pd.DataFrame([dict(a=1,b=2,c=3)])
>>> import dtale
>>> dtale.show(df)
```
Then view your D-Tale instance in your browser using the link that gets printed

You can build python 36-1 & run D-Tale as follows:
```bash
$ yarn run build
$ docker-compose build dtale_3_6
$ docker run -it --network host dtale_3_6:latest
$ python
>>> import pandas as pd
>>> df = pd.DataFrame([dict(a=1,b=2,c=3)])
>>> import dtale
>>> dtale.show(df)
```
Then view your D-Tale instance in your browser using the link that gets printed

## Documentation

Have a look at the [detailed documentation](https://dtale.readthedocs.io).

## Requirements

D-Tale works with:
  
  * Back-end
    * arctic
    * Flask
    * Flask-Caching
    * Flask-Compress
    * flasgger
    * Pandas
    * scipy
    * six
  * Front-end
    * react-virtualized
    * chart.js

## Acknowledgements

D-Tale has been under active development at [Man Numeric](http://www.numeric.com/) since 2019.

Original concept and implementation: [Andrew Schonfeld](https://github.com/aschonfeld)

Contributors:

 * [Wilfred Hughes](https://github.com/Wilfred)
 * [Dominik Christ](https://github.com/DominikMChrist)
 * [Chris Boddy](https://github.com/cboddy)
 * [Jason Holden](https://github.com/jasonkholden)
 * [Youssef Habchi](http://youssef-habchi.com/) - title font
 * ... and many others ...

Contributions welcome!

## License

D-Tale is licensed under the GNU LGPL v2.1.  A copy of which is included in [LICENSE](LICENSE)
