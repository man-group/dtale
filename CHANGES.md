## Changelog

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