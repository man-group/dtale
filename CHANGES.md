## Changelog

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