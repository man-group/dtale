## Changelog

### 1.17.0 (2020-10-10)
* [#269](https://github.com/man-group/dtale/issues/269): column based range highlighting
* [#268](https://github.com/man-group/dtale/issues/268): better button labels for inplace vs. new column
* [#283](https://github.com/man-group/dtale/issues/283): triple-quote formatting around queries in code exports
* [#266](https://github.com/man-group/dtale/issues/266): string concatenation string builder
* [#267](https://github.com/man-group/dtale/issues/267): Column discretion UI


### 1.16.0 (2020-10-4)
* [#263](https://github.com/man-group/dtale/issues/263): word value counts
* [#262](https://github.com/man-group/dtale/issues/262): duplicate values
* [#274](https://github.com/man-group/dtale/issues/274): URL linkouts

### 1.15.2 (2020-9-4)
*  hotfix to move HIDE_SHUTDOWN & GITHUB_FORK to `dtale` module

### 1.15.1 (2020-9-3)
*  hotfix to expose HIDE_SHUTDOWN & GITHUB_FORK from `dtale.global_state`

### 1.15.0 (2020-9-3)
* [#248](https://github.com/man-group/dtale/issues/248): Added 'minPeriods' & the rolling means (multi-value per date) dateframes for Correlations popup
* [#254](https://github.com/man-group/dtale/issues/254): Options to hide shutdown and turn off cell editing
* [#244](https://github.com/man-group/dtale/issues/244): Treemap charts

### 1.14.1 (2020-8-20)
* [#252](https://github.com/man-group/dtale/issues/252): Describe shows proper values, but repeats 'Total Rows:' heading instead of proper headings

### 1.14.0 (2020-8-19)
* [#243](https://github.com/man-group/dtale/issues/243): column menu descriptions
* [#247](https://github.com/man-group/dtale/issues/247): code export compilation error fixes
* [#242](https://github.com/man-group/dtale/issues/242): type conversion column menu option & auto-column names on "Build Column"
* [#235](https://github.com/man-group/dtale/issues/235): nan formatting

### 1.13.0 (2020-8-13)
* [#231](https://github.com/man-group/dtale/issues/231): "Lock Zoom" button on 3D Scatter & Surface charts for locking camera on animations
* global & instance-level flag to turn off cell editing
* added the ability to upload CSVs
* upgraded prismjs
* [#234](https://github.com/man-group/dtale/issues/234): update to line animations so that you can lock axes and highlight last point
* [#233](https://github.com/man-group/dtale/issues/233): add candlestick charts
* [#241](https://github.com/man-group/dtale/issues/241): total counts vs. count (non-nan) in describe
* [#240](https://github.com/man-group/dtale/issues/240): force convert to float
* [#239](https://github.com/man-group/dtale/issues/239): converting mixed columns
* [#237](https://github.com/man-group/dtale/issues/237): updated "Pivot" reshaper to always using pivot_table
* [#236](https://github.com/man-group/dtale/issues/236): "inplace" & "drop_index" parameters for memory optimization and parquet loader
* [#229](https://github.com/man-group/dtale/issues/229): added histogram sample chart to bins column builder

### 1.12.1 (2020-8-5)
 * better axis display on heatmaps
 * handling for column filter data on "mixed" type columns
 * "title" parameter added for offline charts
 * heatmap drilldowns on animations
 * bugfix for refreshing custom geojson charts

### 1.12.0 (2020-8-1)
 * added better notification for when users view Category breakdowns in "Column Analysis" & "Describe"
 * fixed code snippets in "Numeric" column builder when no operation is selected
 * fixed code exports for transform, winsorixe & z-score normalize column builders
 * added colorscale option to 3D Scatter charts
 * added "Animate By" to Heatmaps
 * initial chart drilldown functionality (histogram, bar)
 * fixed bug with code exports on transform, winsorize & z-score normalize column builders
 * updated labeling & tooltips on histogram charts
 * npm package upgrades

### 1.11.0 (2020-7-23)
 * updated column filters so that columns with more than 500 unique values are loaded asynchronously as with AsyncSelect
 * added code export to Variance report
 * added z-score normalize column builder

### 1.10.0 (2020-7-21)
 * [#223](https://github.com/man-group/dtale/issues/223): six.collections.abc import errors in Google Colab
 * [#135](https://github.com/man-group/dtale/issues/135): added plotly chart construction to code exports
 * [#192](https://github.com/man-group/dtale/issues/192): Variance Report & flag toggle
 * npm package upgrades
 * added "winsorize" column builder

### 1.9.2 (2020-7-12)
 * [#127](https://github.com/man-group/dtale/issues/127): add "Column Analysis" to "Describe"
 * [#85](https://github.com/man-group/dtale/issues/85): hotkeys

### 1.9.1 (2020-7-3)
 * [#213](https://github.com/man-group/dtale/issues/213): Support for koalas dataframes
 * [#214](https://github.com/man-group/dtale/issues/214): fix for USE_COLAB (colab proxy endpoint injection)


### 1.9.0 (2020-7-3)
 * added the ability to build columns using transform
 * added USE_COLAB for accessing D-Tale within google colab using their proxy
 * [#211](https://github.com/man-group/dtale/issues/211): Code export doesnt work on google colab
 
### 1.8.19 (2020-6-28)
 * backwards compatibility of 'colorscale' URL parameters in charts
 * dropping of NaN locations/groups in choropleth maps

### 1.8.18 (2020-6-28)
 * [#150](https://github.com/man-group/dtale/issues/150): replace colorscale dropdown with component from dash-colorscales
 * added the ability to choose been ols & lowess trendlines in scatter charts
 * [#83](https://github.com/man-group/dtale/issues/83): allow for names to be used in url strings for data_id
 
### 1.8.17 (2020-6-18)
 * [#151](https://github.com/man-group/dtale/issues/151): allow users to load custom topojson into choropleth maps

### 1.8.16 (2020-6-7)
 * [#200](https://github.com/man-group/dtale/issues/200): support for xarray

### 1.8.15 (2020-5-31)
 * [#202](https://github.com/man-group/dtale/issues/202): maximum recursion errors when using Pyzo IDE

### 1.8.14 (2020-5-31)
 * [#168](https://github.com/man-group/dtale/issues/168): updated default colorscale for heatmaps to be Jet
 * [#152](https://github.com/man-group/dtale/issues/152): added scattermapbox as a valid map type
 * [#136](https://github.com/man-group/dtale/issues/136): Fill missing values
 * [#86](https://github.com/man-group/dtale/issues/86): column replacements for values
 * [#87](https://github.com/man-group/dtale/issues/87): highlight ranges of numeric cells

### 1.8.13 (2020-5-20)
 * [#193](https://github.com/man-group/dtale/issues/193): Support for JupyterHub Proxy

### 1.8.12 (2020-5-15)
 * [#196](https://github.com/man-group/dtale/issues/196): dataframes that have datatime indexes without a name
 * Added the ability to apply formats to all columns of same dtype
 
### 1.8.11 (2020-5-3)
 * [#196](https://github.com/man-group/dtale/issues/191): improving outlier filter suggestions
 * [#190](https://github.com/man-group/dtale/issues/190): hide "Animate" inputs when "Percentage Sum" or "Percentage Count" aggregations are used
 * [#189](https://github.com/man-group/dtale/issues/189): hide "Barsort" when grouping is being applied
 * [#187](https://github.com/man-group/dtale/issues/187): missing & outlier tooltip descriptions on column headers
 * [#186](https://github.com/man-group/dtale/issues/186): close "Describe" tab after clicking "Update Grid"
 * [#122](https://github.com/man-group/dtale/issues/122): editable cells
 * npm package upgrades
 * circleci build script refactoring

### 1.8.10 (2020-4-26)
 * [#184](https://github.com/man-group/dtale/issues/184): "nan" not showing up for numeric columns
 * [#181](https://github.com/man-group/dtale/issues/181): percentage sum/count charts
 * [#179](https://github.com/man-group/dtale/issues/179): confirmation for column deletion
 * [#176](https://github.com/man-group/dtale/issues/176): highlight background of outliers/missing values
 * [#175](https://github.com/man-group/dtale/issues/175): column renaming
 * [#174](https://github.com/man-group/dtale/issues/174): moved "Describe" popup to new browser tab
 * [#173](https://github.com/man-group/dtale/issues/173): wider column input box for GroupBy in "Summarize Data" popup
 * [#172](https://github.com/man-group/dtale/issues/172): allowing groups to be specified in 3D scatter
 * [#170](https://github.com/man-group/dtale/issues/170): filter "Value" dropdown for maps to only int or float columns
 * [#164](https://github.com/man-group/dtale/issues/164): show information about missing data in "Describe" popup
 
### 1.8.9 (2020-4-18)
 * updated correlations & "Open Popup" to create new tabs instead
 * test fixes for dash 1.11.0
 * added python 3.7 & 3.8 support

### 1.8.8 (2020-4-9)
 * [#144](https://github.com/man-group/dtale/issues/144): Changing data type

### 1.8.7 (2020-4-8)
 * [#137](https://github.com/man-group/dtale/issues/137): Outliers in the description window
 * [#141](https://github.com/man-group/dtale/issues/141): Currency Symbole for column Format
 * [#156](https://github.com/man-group/dtale/issues/156): heat map
 * [#160](https://github.com/man-group/dtale/issues/160): Option to filter out outliers from charts
 * [#161](https://github.com/man-group/dtale/issues/161): Syntax error in 1.8.6
 * [#162](https://github.com/man-group/dtale/issues/162): chart map animation errors with aggrigations
 * [#163](https://github.com/man-group/dtale/issues/163): Fix scale for animation mode in the chart

### 1.8.6 [hotfix] (2020-4-5)
 * updates to setup.py to include images

### 1.8.5 [hotfix] (2020-4-5)
 * fixed bug with column calculation for map inputs
 * [#149](https://github.com/man-group/dtale/issues/149): Icon for Map charts

### 1.8.4 [hotfix] (2020-4-5)
 * update to setup.py to include missing static topojson files
 * [#145](https://github.com/man-group/dtale/issues/145): Choropleth Map

### 1.8.3 (2020-4-4)
* [#143](https://github.com/man-group/dtale/issues/143): scattergeo map chart UI changes
* updated offline chart generation of maps to work without loading topojson from the web
* fix to allow correlations timeseries to handle when date columns jump between rolling & non-rolling
* added slider to animation and added animation to maps
* fixes for IE 11 compatibility issues
* labeling changes for "Reshape" popup
* added grouping to maps

### 1.8.2 (2020-4-1)
 * [#129](https://github.com/man-group/dtale/issues/129): show dtype when hovering over header in "Highlight Dtypes" mode and description tooltips added to main menu
 * made "No Aggregation" the default aggregation in charts
 * bugfix for line charts with more than 15000 points
 * updated "Value Counts" & "Category Breakdown" to return top on initial load
 * [#118](https://github.com/man-group/dtale/issues/118): added scattergeo & choropleth maps
 * [#121](https://github.com/man-group/dtale/issues/121): added "not equal" toggle to filters
 * [#132](https://github.com/man-group/dtale/issues/132): updated resize button to "Refresh Widths"
 * added "Animate" toggle to scatter, line & bar charts
 * [#131](https://github.com/man-group/dtale/issues/131): changes to "Reshape Data" window
 * [#130](https://github.com/man-group/dtale/issues/130): updates to pivot reshaper
 * [#128](https://github.com/man-group/dtale/issues/128): additional hover display of code snippets for column creation
 * [#112](https://github.com/man-group/dtale/issues/112): updated "Group" selection to give users the ability to select group values

### 1.8.1 (2020-3-29)
 * [#92](https://github.com/man-group/dtale/issues/92): column builders for random data
 * [#84](https://github.com/man-group/dtale/issues/84): highlight columns based on dtype
 * [#111](https://github.com/man-group/dtale/issues/111): fix for syntax error in charts code export
 * [#113](https://github.com/man-group/dtale/issues/113): updates to "Value Counts" chart in "Column Analysis" for number of values and ordinal entry
 * [#114](https://github.com/man-group/dtale/issues/114): export data to CSV/TSV
 * [#116](https://github.com/man-group/dtale/issues/116): upodated styling for github fork link so "Code Export" is partially clickable
 * [#119](https://github.com/man-group/dtale/issues/119): fixed bug with queries not being passed to functions
 * [#120](https://github.com/man-group/dtale/issues/120): fix to allow duplicate x-axis entries in bar charts
 * added "category breakdown" in column analysis popup for float columns
 * fixed bug where previous "show missing only" selection was not being recognized
 
### 1.8.0 (2020-3-22)
 * [#102](https://github.com/man-group/dtale/issues/102): interactive column filtering for string, date, int, float & bool
 * better handling for y-axis management in charts.  Now able to toggle between default, single & multi axis
 * increased maximum groups to 30 in charts and updated error messaging when it surpasses that for easier filter creation
 * bugfix for date string width calculation
 * updated sort/filter/hidden header so that you can now click values which will trigger a tooltip for removing individual values
 * updated Filter popup to be opened as separate window when needed

### 1.7.15 (2020-3-9)
 * [#105](https://github.com/man-group/dtale/issues/105): better error handling for when JS files are missing
 * [#103](https://github.com/man-group/dtale/issues/103): pinned Flask to be >= 1.0.0
 * Updated file exporting to no longer use `flask.send_file` since that doesn't play nice with WSGI
 
### 1.7.14 (2020-3-7)
 * Hotfix for "Reshape" popup when forwarding browser to new data instances

### 1.7.13 (2020-3-7)
 * New data storage mechanisms available: Redis, Shelve
 * [#100](https://github.com/man-group/dtale/issues/100): turned off data limits on charts by using WebGL
 * [#99](https://github.com/man-group/dtale/issues/99): graceful handling of issue calculating min/max information for Describe popup
 * [#91](https://github.com/man-group/dtale/issues/91): reshaping of data through usage of aggregations, pivots or transposes
 * Export chart to HTML
 * Export chart dat to CSV
 * Offline chart display for use within notebooks
 * Removal of data from the Instances popup
 * Updated styling of charts to fit full window dimensions

### 1.7.12 (2020-3-1)
 * added syntax highlighting to code exports with react-syntax-highlighting
 * added arctic integration test
 * updated Histogram popup to "Column Analysis" which allows for the following
   * Histograms -> integers and floats
   * Value Counts -> integers, strings & dates

### 1.7.11 (2020-2-27)
 * hotfix for dash custom.js file missing from production webpack build script

### 1.7.10 (2020-2-27)
 * [#75](https://github.com/man-group/dtale/issues/75): added code snippet functionality to the following:
   * main grid, histogram, correlations, column building & charts
 * exposed CLI loaders through the following functions dtale.show_csv, dtale.show_json, dtale.show_arctic
   * build in such a way that it is easy for custom loaders to be exposed as well
 * [#82](https://github.com/man-group/dtale/issues/82): pinned `future` package to be >= 0.14.0

### 1.7.9 (2020-2-24)
 * support for google colab
 * [#71](https://github.com/man-group/dtale/issues/71): Filter & Formats popups no longer have smooth transition from top of screen
 * [#72](https://github.com/man-group/dtale/issues/72): Column Menu cutoff on last column of wide dataframes
 * [#73](https://github.com/man-group/dtale/issues/73): Describe popup does full refresh when clicking rows in dtype grid

### 1.7.8 (2020-2-22)
 * [#77](https://github.com/man-group/dtale/issues/77): removal of multiprocessed timeouts

### 1.7.7 (2020-2-22)
 * centralized global state

### 1.7.6 (2020-2-21)
 * allowing the usage of context variables within filters
 * [#64](https://github.com/man-group/dtale/issues/64): handling for loading duplicate data to dtale.show
 * updated dtale.instances() to print urls rather than show all instances
 * removal of Dash "Export to png" function
 * passing data grid queries to chart page as default
 * added sys.exit() to the thread that manages the reaper 

### 1.7.5 (2020-2-20)
 * hotfix for KeyError loading metadata for columns with min/max information

### 1.7.4 (2020-2-20)
 * [#63](https://github.com/man-group/dtale/issues/63): filtering columns with special characters in name
 * added json_loader CLI options
 * updated moving/locking of columns to be persisted to back-end as well as front-end
 * added the ability to show/hide columns
 * [#61](https://github.com/man-group/dtale/issues/61): added column builder popup

### 1.7.3 (2020-2-13)
 * added the ability to move columns left or right as well as to the front
 * added formatting capabilities for strings & dates
 * persist formatting settings to popup on reopening
 * bugfix for width-calculation on formatting change

### 1.7.2 (2020-2-12)
 * 60 timeout handling around chart requests
 * pre-loaded charts through URL search strings
 * pandas query examples in Filter popup

### 1.7.1 (2020-2-7)
 * added pie, 3D scatter & surface charts
 * updated popups to be displayed when the browser dimensions are too small to host a modal
 * removed Swagger due to its lack up support for updated dependencies

### 1.7.0 (2020-1-28)
 * redesign of charts popup to use plotly/dash
 * [#55](https://github.com/man-group/dtale/issues/55): raise exception when data contains duplicate column names
 * heatmap integration
 * combination of "_main.jsx" files into one for spacial optimization
 * [#15](https://github.com/man-group/dtale/issues/15): made arctic an "extra" dependency
 
### 1.6.10 (2020-1-12)
 * better front-end handling of dates for charting as to avoid timezone issues
 * the ability to switch between sorting any axis in bar charts

### 1.6.9 (2020-1-9)
 * bugfix for timezone issue around passing date filters to server for scatter charts in correlations popup

### 1.6.8 (2020-1-9)
 * additional information about how to use Correlations popup
 * handling of all-nan data in charts popup
 * styling issues on popups (especially Histogram)
 * removed auto-filtering on correlation popup
 * scatter point color change
 * added chart icon to cell that has been selected in correlation popup
 * responsiveness to scatter charts
 * handling of links to 'main','iframe' & 'popup' missing data_id
 * handling of 'inf' values when getting min/max & describe data
 * added header to window popups (correlations, charts, ...) and a link back to the grid
 * added egg building to cirleci script
 * correlation timeseries chart hover line
 
### 1.6.7 (2020-1-3)

 * [#50](https://github.com/man-group/dtale/issues/50): updates to rolling correlation functionality

### 1.6.6 (2020-1-2)

 * [#47](https://github.com/man-group/dtale/issues/47): selection of multiple columns for y-axis
 * updated histogram bin selection to be an input box for full customization
 * better display of timestamps in axis ticks for charts
 * sorting of bar charts by y-axis
 * [#48](https://github.com/man-group/dtale/issues/48): scatter charts in chart builder
 * "nunique" added to list of aggregations
 * turned on "threaded=True" for app.run to avoid hanging popups
 * [#45](https://github.com/man-group/dtale/issues/45): rolling computations as aggregations
 * Y-Axis editor

### 1.6.5 (2019-12-29)

  * test whether filters entered will return no data and block the user from apply those
  * allow for group values of type int or float to be displayed in charts popup
  * timeseries correlation values which return 'nan' will be replaced by zero for chart purposes
  * update 'distribution' to 'series' on charts so that missing dates will not show up as ticks
  * added "fork on github" flag for demo version & links to github/docs on "About" popup
  * limited lz4 to <= 2.2.1 in python 27-3 since latest version is no longer supported

### 1.6.4 (2019-12-26)

  * testing of hostname returned by `socket.gethostname`, use 'localhost' if it fails
  * removal of flask dev server banner when running in production environments
  * better handling of long strings in wordclouds
  * [#43](https://github.com/man-group/dtale/issues/43): only show timeseries correlations if datetime columns exist with multiple values per date


### 1.6.3 (2019-12-23)
  
  * updated versions of packages in yarn.lock due to issue with chart.js box & whisker plots

### 1.6.2 (2019-12-23)

  * [#40](https://github.com/man-group/dtale/issues/40): loading initial chart as non-line in chart builder
  * [#41](https://github.com/man-group/dtale/issues/41): double clicking cells in correlation grid for scatter will cause chart not to display
  * "Open Popup" button for ipython iframes
  * column width resizing on sorting
  * additional int/float descriptors (sum, median, mode, var, sem, skew, kurt)
  * wordcloud chart type

### 1.6.1 (2019-12-19)

  * bugfix for url display when running from command-line

### 1.6.0 (2019-12-19)

  * charts integration
    * the ability to look at data in line, bar, stacked bar & pie charts
    * the ability to group & aggregate data within the charts
  * direct ipython iframes to correlations & charts pages with pre-selected inputs
  * the ability to access instances from code by data id `dtale.get_instance(data_id)`
  * view all active data instances `dtale.instances()`

### 1.5.1 (2019-12-12)

  * conversion of new flask instance for each `dtale.show` call to serving all data associated with one parent process under the same flask instance unless otherwise specified by the user (the `force` parameter)

### 1.5.0 (2019-12-02)

  * ipython integration
    * ipython output cell adjustment
    * column-wise menu support
    * browser window popups for: Correlations, Coverage, Describe, Histogram & Instances
    
### 1.4.1 (2019-11-20)

  * [#32](https://github.com/man-group/dtale/issues/32): unpin jsonschema by moving flasgger to `extras_require`

### 1.4.0 (2019-11-19)

  * Correlations Pearson Matrix filters
  * "name" display in title tab
  * "Heat Map" toggle
  * dropped unused "Flask-Caching" requirement

### 1.3.7 (2019-11-12)

  * Bug fixes for:
    * [#28](https://github.com/man-group/dtale/issues/28): "Instances" menu option will now be displayed by default
    * [#29](https://github.com/man-group/dtale/issues/29): add hints to how users can navigate the correlations popup
    * add "unicode" as a string classification for column width calculation

### 1.3.6 (2019-11-08)

  * Bug fixes for:
    * choose between `pandas.corr` & `numpy.corrcoef` depending on presence of NaNs
    * hide timeseries correlations when date columns only contain one day

### 1.3.5 (2019-11-07)

  * Bug fixes for:
    * duplicate loading of histogram data
    * string serialization failing when mixing `future.str` & `str` in scatter function

### 1.3.4 (2019-11-07)

  * updated correlation calculation to use `numpy.corrcoef` for performance purposes
  * github rebranding from manahl -> man-group

### 1.3.3 (2019-11-05)

  * hotfix for failing test under certain versions of `future` package

### 1.3.2 (2019-11-05)

  * Bug fixes for:
    * display of histogram column information
    * reload of hidden "processes" input when loading instances data
    * correlations json failures on string conversion

### 1.3.1 (2019-10-29)
  
  * fix for incompatible str types when directly altering state of data in running D-Tale instance

### 1.3.0 (2019-10-29)
  
  * `webbrowser` integration (the ability to automatically open a webbrowser upon calling `dtale.show()`)
  * flag for hiding the "Shutdown" button for long-running demos
  * "Instances" navigator popup for viewing all activate D-Tale instances for the current python process

### 1.2.0 (2019-10-24)

  * [#20](https://github.com/man-group/dtale/issues/13): fix for data being overriden with each new instance
  * [#21](https://github.com/man-group/dtale/issues/13): fix for displaying timestamps if they exist
  * calling `show()` now returns an object which can alter the state of a process
    * accessing/altering state through the `data` property 
    * shutting down a process using the `kill()` function

### 1.1.1 (2019-10-23)

  * [#13](https://github.com/man-group/dtale/issues/13): fix for auto-detection of column widths for strings and floats

### 1.1.0 (2019-10-08)

  * IE support
  * **Describe** & **About** popups
  * Custom CLI support

### 1.0.0 (2019-09-06)

  * Initial public release