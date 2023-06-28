# D-Tale/ArcticDB Integration

> :warning **Pre-built binaries for ArcticDB only available for Linux and Windows**: MacOS binaries are coming soon!

At long last! There is finally a solution for navigating the underlying data of your ArcticDB databases. Once again, the solution is D-Tale!

[![](https://i.ytimg.com/vi/t-C_9Jw8tjI/maxresdefault.jpg)](https://youtu.be/t-C_9Jw8tjI "")

To get started run

```bash
$ pip install dtale[arcticdb]
```

This will install D-Tale and ArcticDB. From there, you can set up a local database for testing:

```python
import pandas as pd
from arcticdb import Arctic

conn = Arctic('lmdb:///[path to DB]/test_db')
conn.create_library('lib1')
lib1 = conn['lib1']
lib1.write('symbol1', pd.DataFrame([
    {'col1': 1, 'col2': 1.1, 'col3': pd.Timestamp('20230101')}
]))
lib1.write('symbol2', pd.DataFrame([
    {'col1': 2, 'col2': 2.2, 'col3': pd.Timestamp('20230102')}
]))

conn.create_library('lib2')
lib2 = conn['lib2']
lib2.write('symbol3', pd.DataFrame([
    {'col1': 3, 'col2': 3.3, 'col3': pd.Timestamp('20230103')}
]))
lib2.write('symbol4', pd.DataFrame([
    {'col1': 4, 'col2': 4.4, 'col3': pd.Timestamp('20230104')},
    {'col1': 5, 'col2': 5.5, 'col3': pd.Timestamp('20230105')},
    {'col1': 6, 'col2': 6.6, 'col3': pd.Timestamp('20230106')},
    {'col1': 7, 'col2': 7.7, 'col3': pd.Timestamp('20230107')}
]))

conn.create_library('lib3')
lib3 = conn['lib3']
lib3.write('symbol5', pd.DataFrame(
    {'col{}'.format(i): list(range(1000)) for i in range(105)}
))
```

Here is a link to the [source code](https://github.com/man-group/dtale/tree/master/docs/arcticdb/arcticdb_demo.py) which can be run as a script or bundled within gunicorn (`gunicorn --workers=5 --preload arcticdb_demo:app -b 0.0.0.0:9207`)


Once this is complete you can connect D-Tale to this DB and start navigating the data:
```python
import dtale

dtale.show_arcticdb(uri='lmdb:///[path to DB]/test_db', use_store=True)
```

Using `use_store=True` will force the mechanism D-Tale uses for storing/reading/writing data to be ArcticDB. This seems insignificant, but it actually provides a huge enhancement to D-Tale's infrastructure. You can now read dataframes of any size without having any memory constraints.  D-Tale will simply read the rows/columns of your dataframe that need to be displayed in your browser, rather than the entire dataframe into memory.

### Navigation

To start you'll be prompted with a screen where you'll choose your library and symbol. For now, let's just go with `lib1` & `symbol1`. Once you selected those you can click "Load".

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/library_symbol_selector.png)

You'll now see the standard D-Tale grid containing the data in your symbol.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol1.png)

You'll also notice a bar at the top of the screen showing that you're using ArcticDB as well as the current uri, library & symbol. Clicking that will either bring you to a popup where you can choose a different library & symbol.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol1_selector.png)

If your symbol is for a wide dataframe (more than 100 columns) then you'll also have an option to jump to a specific column. By default, any dataframe with more than 100 columns any column after the 100th will be hidden for performance purposes.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5.png)

The need for a popup dedicated to jumping to specific columns is so we can handle the scenario where your dataframe contains over 100 columns. This becomes too taxing on the browser to render all of these columns. Not to mention, it would be too hard to scroll to the column you're looking for. So now you'll be able to type in the name of the column you're looking for and select it.  This will update the grid to display the contents of that column as well as any columns you previously had locked (by default the index columns are locked).

_If you truly want to display all columns you still can using the "Describe" popup and checking all columns._

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5_jump.png)

And now you'll see only the columns you've had locked (we've locked no columns in this example) and the column you chose to jump to.

![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/arcticdb/demo/arcticdb_symbol5_col100.png)

### Differences in Functionality from the Original D-Tale

Unfortunately, since we are leveraging ArcticDB for our data fetching there was some functionality that is available in the standard (in-memory) version of D-Tale:
* Custom Filtering - the ability to specify custom pandas queries
* Column Filters
  * Numeric - range filters (`[]`, `()`) are no longer available
  * String - startswith, endswith, contains, regex, length & case-sensitivity
* Sorting
* Editing (this may eventually be available through a boolean configuration property)
* Data Reshapers
* Dataframe Functions

Functionality that is still available, but for dataframes w/ less-than 1 million rows & less-than-or-equal to 100 columns:
* Unique Count
* Outliers & Outlier Highlighting
* Much of the "Describe" popup initial details

If there is any functionality (which isn't controlled by ArcticDB itself) you want added back in for ArcticDB through the use of configuration flags please submit an issue. Thanks :pray
