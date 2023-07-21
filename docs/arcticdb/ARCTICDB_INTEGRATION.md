# A match made in-memory ArcticDB :heart: D-Tale

> ⚠️ **Pre-built binaries for ArcticDB only available for Linux and Windows**: MacOS binaries are coming soon!

It's been almost 4 years since the original version of D-Tale was released as a way for Pandas users to navigate their DataFrames.  There have been many new features added and lots of bugs fixed. One aspect of D-Tale's construction that has consistently been a point of contention has been its need to work from DataFrames stored in memory.  For small DataFrames, this is by far the best solution, but users are accustomed to using larger (north of 10 million rows) and wider (sometimes are high as 300K columns) dataframes. So displaying dataframes of these dimensions proved to be unwieldy. Thankfully, a solution to this problem has come in the form of ArcticDB! 

At long last! There is finally a solution for navigating the underlying data of your ArcticDB databases. Once again, the solution is D-Tale!

D-Tale backed by ArcticDB allows you to explore datasets that are much larger than what you can store in memory. 
As you scroll down, D-Tale will page in the additional required data in an on-demand fashion meaning that the data doesn't all have to be stored in memory at the same time.

[![](https://i.ytimg.com/vi/t-C_9Jw8tjI/maxresdefault.jpg)](https://youtu.be/t-C_9Jw8tjI "")

### Getting Started

#### Installation

Run

```bash
$ pip install dtale[arcticdb]
```

This will install D-Tale and ArcticDB. 

#### Set up local database for testing

```python
import pandas as pd
import numpy as np
from datetime import datetime
from arcticdb import Arctic

uri = "lmdb:///tmp/dtale/arcticdb"
conn = Arctic(uri)
conn.create_library('lib1')
lib1 = conn['lib1']

lib1.write('symbol1', pd.DataFrame([
    {'col1': 1, 'col2': 1.1, 'col3': pd.Timestamp('20230101')}
]))

cols = ['COL_%d' % i for i in range(50)]
df = pd.DataFrame(np.random.randint(0, 50, size=(25, 50)), columns=cols)
df.index = pd.date_range(datetime(2000, 1, 1, 5), periods=25, freq="H")

lib1.write('symbol2', df)
lib1.write('symbol3', pd.DataFrame([
    {'col1': 2, 'col2': 2.2, 'col3': pd.Timestamp('20230102')}
]))

conn.create_library('lib2')
lib2 = conn['lib2']

N_COLS = 1000
N_ROWS = 20_000
cols = ['COL_%d' % i for i in range(N_COLS)]
big_df = pd.DataFrame(np.random.normal(loc=10.0, scale=2.5, size=(N_ROWS, N_COLS)), columns=cols)
big_df.index = pd.date_range(datetime(2000, 1, 1, 5), periods=N_ROWS, freq="H")

lib2.write('symbol4', big_df)

conn.create_library('lib3')
lib3 = conn['lib3']
lib3.write('symbol5', pd.DataFrame(
    {'col{}'.format(i): list(range(1000)) for i in range(105)}
))
```

#### Spin up the D-Tale backend

```python
import dtale.global_state as global_state
from dtale.app import build_app

uri = "lmdb:///tmp/dtale/arcticdb"
global_state.use_arcticdb_store(uri=uri)
app = build_app(reaper_on=False)

app.run(host="0.0.0.0", port=9207)
```

#### Connect D-Tale and navigate the data

```python
>>> import dtale
>>> uri = "lmdb:///tmp/dtale/arcticdb"
>>> dtale.show_arcticdb(uri=uri, use_store=True)
<URL to access D-Tale UI>
```

`use_store=True` forces the mechanism D-Tale uses for storing/reading/writing data to be ArcticDB. This seems insignificant, but it actually provides a huge enhancement to D-Tale's infrastructure. You can now read DataFrames of any size without having any memory constraints. D-Tale will simply read the rows/columns of your DataFrame that need to be displayed in your browser, rather than the entire DataFrame into memory.

### Navigation

To start you'll be prompted with a screen where you'll choose your library and symbol. For now, let's just go with `lib1` & `symbol1`. Once you selected those you can click "Load".

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/library_symbol_selector.png)

You'll now see the standard D-Tale grid containing the data in your symbol.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol1.png)

You'll also notice a bar at the top of the screen showing that you're using ArcticDB as well as the current URI, library and symbol. Clicking that will either bring you to a popup where you can choose a different library and symbol.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol1_selector.png)

If your symbol is for a wide dataframe (more than 100 columns) then you'll also have an option to jump to a specific column. By default, any dataframe with more than 100 columns any column after the 100th will be hidden for performance purposes.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5.png)

The need for a popup dedicated to jumping to specific columns is so we can handle the scenario where your dataframe contains over 100 columns. This becomes too taxing on the browser to render all of these columns. Not to mention, it would be too hard to scroll to the column you're looking for. So now you'll be able to type in the name of the column you're looking for and select it.  This will update the grid to display the contents of that column as well as any columns you previously had locked (by default the index columns are locked).

_If you truly want to display all columns you still can using the "Describe" popup and checking all columns._

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5_jump.png)

And now you'll see only the columns you've had locked (we've locked no columns in this example) and the column you chose to jump to.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5_col100.png)

## Going Further with ArcticDB

See the ArcticDB [docs](https://docs.arcticdb.io/) and [website](https://arcticdb.io/) for more information about it. The LMDB backend for ArcticDB is recommended for local testing, but for real workloads we recommend using an S3 backend. You can simply point D-Tale at an S3 backed ArcticDB instance and browse the data being written by processes across your system.

## Differences in Functionality from the Original D-Tale

Unfortunately, since we are leveraging ArcticDB rather than Pandas for our data fetching there is some functionality that is absent compared to the standard (in-memory) version of D-Tale:
* Custom Filtering - the ability to specify custom pandas queries
* Column Filters
  * Numeric - range filters (`[]`, `()`) are no longer available
  * String - startswith, endswith, contains, regex, length & case-sensitivity
* Sorting
* Editing (this may eventually be available through a boolean configuration property)
* Data Reshapers
* Dataframe Functions

Functionality that is still available, but for dataframes with less-than 1 million rows & less-than-or-equal to 100 columns:
* Unique Count
* Outliers & Outlier Highlighting
* Much of the "Describe" popup initial details

If there is any functionality (which isn't controlled by ArcticDB itself) you want added back in for ArcticDB please submit an issue. Thanks :pray:

You can always fall back to the original D-Tale implementation and load entire ArcticDB symbols in to memory, the process for which is documented in the "Connect D-Tale" section above.

To work around these you can load entire ArcticDB symbols in to memory rather than following the code snippet in the "Connect D-Tale" section:

```python
>>> import dtale
>>> uri = "lmdb:///tmp/dtale/arcticdb"
# show one symbol,
>>> dtale.show_arcticdb(uri=uri, library="lib1", symbol="symbol1")
# alternative method to show one symbol
>>> lib = conn['lib1']
>>> df = lib.read('symbol1').data
>>> dtale.show(df)
```

As described above there are serious advantages to paging the data in from ArcticDB, so only follow this alternative if you are hit by one of the "Differences in Functionality" documented here.
