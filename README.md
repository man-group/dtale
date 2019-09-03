# [![D-Tale](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Title.png)](https://github.com/manahl/dtale)

[![CircleCI](https://circleci.com/gh/manahl/dtale.svg?style=shield&circle-token=4b67588a87157cc03b484fb96be438f70b5cd151)](https://circleci.com/gh/manahl/dtale)
[![PyPI](https://img.shields.io/pypi/pyversions/dtale.svg)](https://pypi.python.org/pypi/dtale/)
[![ReadTheDocs](https://readthedocs.org/projects/dtale/badge)](https://dtale.readthedocs.io)
[![Coverage Status](https://coveralls.io/repos/github/manahl/dtale/badge.svg?branch=master)](https://coveralls.io/github/manahl/dtale?branch=master)

## Getting Started

Setup/Activate your environment and install the egg

```bash
# create a vritualenv (if you haven't already created one) 
$ python3 -m venv ~/pyenvs/dtale
$ source ~/pyenvs/dtale/bin/activate
# install dtale egg (important to use the "-U" every time you install so it will grab the latest version)
$ pip install --upgrade dtale
```


Now you will have to ability to use D-Tale from the command-line or within a python-enabled terminal

### Command-line
Loading data from **arctic**
```bash
dtale --arctic-host mongodb://localhost:27027 --arctic-library jdoe.my_lib --arctic-node my_node --arctic-start 20130101 --arctic-end 20161231
```
Loading data from **CSV**
```bash
dtale --csv-path /home/jdoe/my_csv.csv --csv-parse_dates date
```

### Python Terminal
This comes courtesy of PyCharm
![Python Terminal](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Python_Terminal.png "Python_Terminal")
Feel free to invoke `python` or `ipython` directly and use the commands in the screenshot above and it should work

## UI
Once you have kicked off your D-Tale session please copy & paste the link on the last line of output in your browser
![Chrome #1](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Browser1.png "Chrome #1")

The information in the upper right-hand corner is similar to saslook  ![Info](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Info_cell.png "Info")
- lower-left => row count
- upper-right => column count
- clicking the triangle displays the menu of standard functions (click outside menu to close it)
![Menu](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Info_menu_small.png "Menu")

Selecting/Deselecting Columns
- to select a column, simply click on the column header (to deselect, click the column header again)
  - You'll notice that the columns you've selected will display in the top of your browser
![Column Select](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Col_select.png "Column Select")

### Menu functions w/ no columns selected

![Menu](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Info_menu.png "Menu")

- **Filter**: apply a simple pandas `query` to your data (link to pandas documentation included in popup)

|Editing|Result|
|--------|:------:|
|![Filter Apply](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Filter_apply.png "Filter Apply")|![Filter Applied](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Post_filter.png "Filter Applied")|

- **Coverage**: check for coverage gaps on column(s) by way of other column(s) as group(s)
  - Select column(s) in "Group(s)" & "Col(s)"
    - date-type columns you can also specify a frequency of D, W, M, Q, Y
    - Select multiple values in "Cols(s)" and/or "Groups(s)" by holdings the SHIFT key as you click
  - Click "Load"
  - The output will be the counts of non-nan records in "Col(s)" grouped by your selections in "Group(s)"  

|Daily|Daily Regional|
|-----|:-------------:|
|![Coverage Daily](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Coverage_daily.png "Coverage Daily")|![Coverage Daily Regions](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Coverage_daily_regions.png "Coverage Daily Regions")|

- **Correlations**: shows a pearson correlation matrix of all numeric columns against all other numeric columns
  - By deafult, it will show a grid of pearson correlations
  - If you have a date-type column, you can click an individual cell and see a timeseries of pearson correlations for that column combination
    - Currently if you have multiple date-type columns you will have the ability to toggle between them by way of a drop-down
  - Furthermore, you can click on individual points in the timeseries to view the scatter plot of the points going into that correlation

|Matrix|Timeseries|Scatter|
|------|----------|-------|
|![Correlations](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Correlations.png "Correlations")|![Timeseries](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Correlations_ts.png "Timeseries")|![Scatter](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Correlations_scatter.png "Scatter")|

- Resize: mostly a fail-safe in the event that your columns are no longer lining up. Click this and should fix that
- Shutdown: pretty self-explanatory, kills your D-Tale session (there is also an auto-kill process that will kill your D-Tale after an hour of inactivity)

### Menu functions w/ one column is selected

![Menu Single-Column](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Menu_one_col.png "Menu Single-Column")

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
  |![Formatting Apply](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Formatting_apply.png "Formatting Apply")|![Formatting Applied](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Post_formatting.png "Formatting Applied")|
  - Here's a grid of all the formats available with -123456.789 as input:
  
| Format        | Output         |
| ------------- |:--------------:|
| Precision (6) | -123456.789000 |
| Thousands Sep | -123,456.789   |
| Abbreviate    | -123k          |
| Exponent      | -1e+5          |
| BPS           | -1234567890BPS |
| Red Negatives | <span style="color: red;">-123457</span>|

- **Histogram**: display histograms in bins of 5, 10, 20 or 50 for any numeric column
![Histogram](https://raw.githubusercontent.com/manahl/dtale/master/docs/images/Histogram.png "Histogram")

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
 * ... and many others ...

Contributions welcome!

## License

D-Tale is licensed under the GNU LGPL v2.1.  A copy of which is included in [LICENSE](LICENSE)