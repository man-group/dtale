[![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/Title.png)](https://github.com/man-group/dtale)

* [Live Demo](http://alphatechadmin.pythonanywhere.com)

-----------------

[![CircleCI](https://circleci.com/gh/man-group/dtale.svg?style=shield&circle-token=4b67588a87157cc03b484fb96be438f70b5cd151)](https://circleci.com/gh/man-group/dtale)
[![PyPI Python Versions](https://img.shields.io/pypi/pyversions/dtale.svg)](https://pypi.python.org/pypi/dtale/)
[![PyPI](https://img.shields.io/pypi/v/dtale)](https://pypi.org/project/dtale/)
[![Conda](https://img.shields.io/conda/v/conda-forge/dtale)](https://anaconda.org/conda-forge/dtale)
[![ReadTheDocs](https://readthedocs.org/projects/dtale/badge)](https://dtale.readthedocs.io)
[![codecov](https://codecov.io/gh/man-group/dtale/branch/master/graph/badge.svg)](https://codecov.io/gh/man-group/dtale)
[![Downloads](https://pepy.tech/badge/dtale)](https://pepy.tech/project/dtale)
[![Open in VS Code](https://img.shields.io/badge/Visual_Studio_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)](https://open.vscode.dev/man-group/dtale)

## What is it?

D-Tale is the combination of a Flask back-end and a React front-end to bring you an easy way to view & analyze Pandas data structures.  It integrates seamlessly with ipython notebooks & python/ipython terminals.  Currently this tool supports such Pandas objects as DataFrame, Series, MultiIndex, DatetimeIndex & RangeIndex.

## Origins

D-Tale was the product of a SAS to Python conversion.  What was originally a perl script wrapper on top of SAS's `insight` function is now a lightweight web client on top of Pandas data structures.

## In The News

 - [4 Libraries that can perform EDA in one line of python code](https://towardsdatascience.com/4-libraries-that-can-perform-eda-in-one-line-of-python-code-b13938a06ae)
 - [React Status](https://react.statuscode.com/issues/204)
 - [KDNuggets](https://www.kdnuggets.com/2020/08/bring-pandas-dataframes-life-d-tale.html)
 - [Man Institute](https://www.man.com/maninstitute/d-tale) (warning: contains deprecated functionality)
 - [Python Bytes](https://pythonbytes.fm/episodes/show/169/jupyter-notebooks-natively-on-your-ipad)
 - [FlaskCon 2020](https://www.youtube.com/watch?v=BNgolmUWBp4&t=33s)
 - [San Diego Python](https://www.youtube.com/watch?v=fLsGur5YqeE&t=29s)
 - [Medium: towards data science](https://towardsdatascience.com/introduction-to-d-tale-5eddd81abe3f)
 - [Medium: Exploratory Data Analysis – Using D-Tale](https://medium.com/da-tum/exploratory-data-analysis-1-4-using-d-tale-99a2c267db79)
 - [EOD Notes: Using python and dtale to analyze correlations](https://www.google.com/amp/s/eod-notes.com/2020/05/07/using-python-and-dtale-to-analyze-correlations/amp/)
 - [Data Exploration is Now Super Easy w/ D-Tale](https://dibyendudeb.com/d-tale-data-exploration-tool/)
 - [Practical Business Python](https://pbpython.com/dataframe-gui-overview.html)

## Tutorials

 - [Pip Install Python YouTube Channel](https://m.youtube.com/watch?v=0RihZNdQc7k&feature=youtu.be)
 - [machine_learning_2019](https://www.youtube.com/watch?v=-egtEUVBy9c)
 - [D-Tale The Best Library To Perform Exploratory Data Analysis Using Single Line Of Code🔥🔥🔥🔥](https://www.youtube.com/watch?v=xSXGcuiEzUc)
 - [Explore and Analyze Pandas Data Structures w/ D-Tale](https://m.youtube.com/watch?v=JUu5IYVGqCg)
 - [Data Preprocessing simplest method 🔥](https://www.youtube.com/watch?v=Q2kMNPKgN4g)

 ## Related Resources

 - [Adventures In Flask While Developing D-Tale](https://github.com/man-group/dtale/blob/master/docs/FlaskCon/FlaskAdventures.md)
 - [Adding Range Selection to react-virtualized](https://github.com/man-group/dtale/blob/master/docs/RANGE_SELECTION.md)
 - [Building Draggable/Resizable Modals](https://github.com/man-group/dtale/blob/master/docs/DRAGGABLE_RESIZABLE_MODALS.md)
 - [Embedding Flask Apps within Streamlit](https://github.com/man-group/dtale/blob/master/docs/EMBEDDED_STREAMLIT.md)


## Where To get It
The source code is currently hosted on GitHub at:
https://github.com/man-group/dtale

Binary installers for the latest released version are available at the [Python
package index](https://pypi.org/project/dtale) and on conda using [conda-forge](https://github.com/conda-forge/dtale-feedstock).

```sh
# conda
conda install dtale -c conda-forge
# if you want to also use "Export to PNG" for charts
conda install -c plotly python-kaleido
```

```sh
# or PyPI
pip install dtale
```

## Getting Started

|PyCharm|jupyter|
|:------:|:------:|
|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/gifs/dtale_demo_mini.gif)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/gifs/dtale_ipython.gif)|

### Python Terminal
This comes courtesy of PyCharm
![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/Python_Terminal.png)
Feel free to invoke `python` or `ipython` directly and use the commands in the screenshot above and it should work

#### Issues With Windows Firewall

If you run into issues with viewing D-Tale in your browser on Windows please try making Python public under "Allowed Apps" in your Firewall configuration.  Here is a nice article:
[How to Allow Apps to Communicate Through the Windows Firewall](https://www.howtogeek.com/howto/uncategorized/how-to-create-exceptions-in-windows-vista-firewall/)

#### Additional functions available programmatically
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
d._data_id  # the process's data identifier
d._url  # the url to access the process

d2 = dtale.get_instance(d._data_id)  # returns a new reference to the instance running at that data_id

dtale.instances()  # prints a list of all ids & urls of running D-Tale sessions

```

## License

D-Tale is licensed under the GNU LGPL v2.1.  A copy of which is included in [LICENSE](https://github.com/man-group/dtale/blob/master/LICENSE.md)

## Additional Documentation

Located on the main [github repo](https://github.com/man-group/dtale)
