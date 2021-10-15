## Changelog

### 1.59.0 (2021-10-15)
* [#581](https://github.com/man-group/dtale/issues/581): Binder proxy handling updates
* [#583](https://github.com/man-group/dtale/issues/583): vertical column headers
* front-end package upgrades

### 1.58.3 (2021-10-4)
* updated dash-bio to an optional dependency

### 1.58.2 (2021-10-3)
* fix for `background_mode` in `dtale.show`

### 1.58.1 (2021-10-2)
* re-pinned dash to 2.0.0

### 1.58.0 (2021-10-2)
* [#568](https://github.com/man-group/dtale/issues/568): range highlight updates
* [#566](https://github.com/man-group/dtale/issues/566): clustergram charts
* [#578](https://github.com/man-group/dtale/issues/578): dataset correlations error
* [#576](https://github.com/man-group/dtale/issues/576): dash_core_components and dash_html_component import updates
* [#579](https://github.com/man-group/dtale/issues/579): fix for pandas.Series.between FutureWarning
* [#577](https://github.com/man-group/dtale/issues/577): specifying backgrounds programmatically

### 1.57.0 (2021-9-22)
* [#565](https://github.com/man-group/dtale/issues/565): allow "chart per group" display in scatter charts
* [#564](https://github.com/man-group/dtale/issues/564): geometric mean aggregation in "Summarize Data"
* [#559](https://github.com/man-group/dtale/issues/559): lock columns from config, highlight rows, move filters to custom filter, nan display
* [#560](https://github.com/man-group/dtale/issues/560): Add "Gage R&R" computation
* [#558](https://github.com/man-group/dtale/issues/558): added "Filtered" toggle to "Variance Report"
* [#561](https://github.com/man-group/dtale/issues/561): Modify behaviour for finding free port

### 1.56.0 (2021-8-31)
* [#557](https://github.com/man-group/dtale/issues/557): allow filters to be applied to the "Describe" page
* [#555](https://github.com/man-group/dtale/issues/555)
  * added option to specify default sort in config/show/CLI
  * predefined filter updates
* [#552](https://github.com/man-group/dtale/issues/552): added query engine toggle
* [#553](https://github.com/man-group/dtale/issues/553): boolean chart axis ticks
* [#554](https://github.com/man-group/dtale/issues/554): dash callback input update

### 1.55.0 (2021-8-17)
* [#553](https://github.com/man-group/dtale/issues/553): charts with boolean values as y or z axes
* [#552](https://github.com/man-group/dtale/issues/552): exceptions with unsigned integers and NA values
* [#548](https://github.com/man-group/dtale/issues/548): updated popups to redirects when in vscode
* fixed client-side bug with "rename" function

### 1.54.1 (2021-8-11)
* [#549](https://github.com/man-group/dtale/issues/549): fix for grouping charts by multiple columns

### 1.54.0 (2021-8-6)
* [#545](https://github.com/man-group/dtale/issues/545): added "concatenate" & "replace" string column builders
* updated lodash loading to use tree-shaking
* [#544](https://github.com/man-group/dtale/issues/544): fixed issue with loading missingno plots
* used plotly.js partial distribution to lower egg size

### 1.53.0 (2021-7-28)
* updated "Charts" page to handle dark-mode
* [#539](https://github.com/man-group/dtale/issues/539): "Substring" & "Split By Character" column builders
* [#542](https://github.com/man-group/dtale/issues/542): fixed bug with finding missings in categorical data
* [#543](https://github.com/man-group/dtale/issues/543): added "group by" to cumulative sum builder
* Portuguese translation
* Fixes for long string tooltips

### 1.52.0 (2021-7-10)
* [#529](https://github.com/man-group/dtale/issues/529): resample timeseries
* [#532](https://github.com/man-group/dtale/issues/532): shift and expanding builders
* [#525](https://github.com/man-group/dtale/issues/525): bin range on x-axis
* [#526](https://github.com/man-group/dtale/issues/526): targeted histogram tooltip
* updated simpsons dataset to make use of image display

### 1.51.0 (2021-7-5)
* [#531](https://github.com/man-group/dtale/issues/531): re-organizing column builder buttons
* [#530](https://github.com/man-group/dtale/issues/530): typo in rolling code snippet
* [#528](https://github.com/man-group/dtale/issues/528): feature analysis
* [#534](https://github.com/man-group/dtale/issues/534): pinned missingno less than or equal to 0.4.2
* [#523](https://github.com/man-group/dtale/issues/523): upgraded to plotly 5
* Row height resize functionality
* [#522](https://github.com/man-group/dtale/issues/522): sorting target values in histogram tooltip

### 1.50.1 (2021-6-24)
* [#520](https://github.com/man-group/dtale/issues/520): additional code export update

### 1.50.0 (2021-6-23)
* [#515](https://github.com/man-group/dtale/issues/515): adding dataframe.index() to chart axis
* [#520](https://github.com/man-group/dtale/issues/520): wrong indent in chart code export
* [#519](https://github.com/man-group/dtale/issues/519): display raw HTML
* [#518](https://github.com/man-group/dtale/issues/518): cumulative sum builder
* [#517](https://github.com/man-group/dtale/issues/517): keep less correlated columns
* [#514](https://github.com/man-group/dtale/issues/514): targeted histogram fixes
* [#493](https://github.com/man-group/dtale/issues/493): Correlations grid sorting
* [#505](https://github.com/man-group/dtale/issues/505): Filtering enhancements
* [#484](https://github.com/man-group/dtale/issues/484): renamed "Percentage Count" to "Count (Percentage)"
* [#503](https://github.com/man-group/dtale/issues/503): add separate option for "Clean Column" to main menu

### 1.49.0 (2021-6-9)
* bump css-what from 5.0.0 to 5.0.1
* added the ability to toggle the display of all columns when heatmap is turned on
* [#491](https://github.com/man-group/dtale/issues/491): overlapping histogram chart
* bump ws from 7.4.5 to 7.4.6
* Updates
  * [#509](https://github.com/man-group/dtale/issues/509): resizable side panel width
  * [#495](https://github.com/man-group/dtale/issues/495): CSV loading dialog
  * height of "Exponential Smoothing" in column builders
  * code snippet fixes
  * cleaner updates

### 1.48.0 (2021-5-28)
* [#504](https://github.com/man-group/dtale/issues/504): fix for toggling between unique row & word values
* [#502](https://github.com/man-group/dtale/issues/502): updated "cleaning" column builder to allow for inplace updates
* [#501](https://github.com/man-group/dtale/issues/501): updates to describe window labels
* [#500](https://github.com/man-group/dtale/issues/500): cleaning "Remove Numbers" code snippet fix
* [#488](https://github.com/man-group/dtale/issues/488): string encoding for correlations
* [#484](https://github.com/man-group/dtale/issues/484): fixed for percentage count chart aggregation
* Correlation Scatter Updates:
  * [#486](https://github.com/man-group/dtale/issues/486): make 15K point limitation correlations scatter an editable setting
  * [#487](https://github.com/man-group/dtale/issues/487): fix for non-unique column exception in correlation scatter
* [#480](https://github.com/man-group/dtale/issues/480): flexible branding
* [#485](https://github.com/man-group/dtale/issues/485): Adjustable height on Correlation grid

### 1.47.0 (2021-5-21)
* [#477](https://github.com/man-group/dtale/issues/477): Excel-style cell editing at top of screen
  * UI input for "Maximum Column Width"
* JS package upgrades
* refactored how sphinx documentation is built

### 1.46.0 (2021-5-11)
* [#475](https://github.com/man-group/dtale/issues/475): fixes for DtaleRedis issues
* [#140](https://github.com/man-group/dtale/issues/140): additional string column filters
* refactored draggable column resizing to be more performant
* added dependency on nbformat
* updated Sphinx documentation building to only run on master builds of python3.9
  * Also pinned jinja2 to 2.11.3 when building

### 1.45.0 (2021-5-5)
* [#472](https://github.com/man-group/dtale/issues/472): maximum column width
* [#471](https://github.com/man-group/dtale/issues/471): predefined filters
    * [#473](https://github.com/man-group/dtale/issues/473): fixed column filters
    * refactored settings (sortInfo, columnFilters, outlierFilters, predefinedFilters) to be stored in redux
    * fixed issues with pinned main menu

### 1.44.1 (2021-4-27)
* [#470](https://github.com/man-group/dtale/issues/470): editing cells for column names with special characters

### 1.44.0 (2021-4-26)
* [#465](https://github.com/man-group/dtale/issues/465): optional authentication
* [#467](https://github.com/man-group/dtale/issues/467): fixed column menu issues when name has special characters
* [#466](https://github.com/man-group/dtale/issues/466): convert complex data to strings
* added "head" & "tail" load types for chart data sampling

### 1.43.0 (2021-4-18)
* [#463](https://github.com/man-group/dtale/issues/463): skew & kurtosis on filtered data
* Moved Correlations & PPS to side panel
* Added "Show/Hide Columns" side-panel
* [#462](https://github.com/man-group/dtale/issues/462): Graphs slow with big data

### 1.42.1 (2021-4-12)
* added ESC button handler for closing the side panel

### 1.42.0 (2021-4-11)
* Added missingno chart display
* added new side panel for viewing describe data
  * updated how requirements files are loaded in setup.py
  * added cleanup function to instance object
  * added animation for display of hidden/filter/sort info row
* [#306](https://github.com/man-group/dtale/issues/306): ribbon menu

### 1.41.1 (2021-3-30)
* [#458](https://github.com/man-group/dtale/issues/458): fix for killing D-Tale sessions in jupyter_server_proxy
* [#378](https://github.com/man-group/dtale/issues/378): add cleaning functions to chart inputs


### 1.41.0 (2021-3-26)
* [#390](https://github.com/man-group/dtale/issues/390): funnel charts
* [#255](https://github.com/man-group/dtale/issues/255): extended chart aggregations

### 1.40.2 (2021-3-21)
* [#454](https://github.com/man-group/dtale/issues/454): fixed issue with parenthesis & percent symbols in column names

### 1.40.1 (2021-3-16)
* hotfix for chart code exports of category column analysis

### 1.40.0 (2021-3-16)
* moved "Open In New Tab" button
* [#135](https://github.com/man-group/dtale/issues/135): refactored column analysis code and updated code exports to include plotly charts

### 1.39.0 (2021-3-14)
* resizable columns
* updated how click loader options are found
* Added loader for r datasets (`*.rda` files)
* updating the language menu option to list options dynamically

### 1.38.0 (2021-3-10)
* [#452](https://github.com/man-group/dtale/issues/452): handling of column names with periods & spaces as well as long names
* updated styling of windows to match that of Charts
* [#448](https://github.com/man-group/dtale/issues/448): set default value of "ignore_duplicate" to True
* [#442](https://github.com/man-group/dtale/issues/442): Dash Updates
  * Split charts by y-axis values if there are multiple
  * Saving charts off and building new ones
  * Toggling which piece of data you're viewing
  * Toggling language nav menu
* Instances popup changes
  * updated preview to use DataPreview
  * updated display of "memory usage" to numeral.js

### 1.37.1 (2021-3-6)
* Updated MANIFEST.in to include requirements.txt

### 1.37.0 (2021-3-5)
* [#445](https://github.com/man-group/dtale/issues/445): updated URL paths to handle when D-Tale is running with jupyter server proxy
* [#315](https://github.com/man-group/dtale/issues/315): Internationalization (supports english & chinese currently)
* [#441](https://github.com/man-group/dtale/pull/441): Add option to 'pin' the menu to the screen as a fixed side panel
* [#434](https://github.com/man-group/dtale/issues/434)
  * updated scatter plot date header to be generated server-side 
  * updated scatter plot generation in correlations to use date index rather than date value for filtering
* update setup.py to load dependencies from requirements.txt
* [#437](https://github.com/man-group/dtale/pull/437): optional memory usage optimization and show mem usage

### 1.36.0 (2021-2-18)
* [#428](https://github.com/man-group/dtale/pull/428): Turn global_state into interfaces
* [#434](https://github.com/man-group/dtale/issues/434): Additional PPS formatting
* [#433](https://github.com/man-group/dtale/issues/433): fixed exception message display in merge UI
* [#432](https://github.com/man-group/dtale/issues/432): updated calls to "get_instance" in merge code snippets
* [#431](https://github.com/man-group/dtale/issues/431): fixed stacking code example
* [#430](https://github.com/man-group/dtale/issues/430): replace empty strings with nans when converting dates to timestamp floats

### 1.35.0 (2021-2-14)
* [#261](https://github.com/man-group/dtale/issues/261): Merging & Stacking UI

### 1.34.0 (2021-2-7)
* [#423](https://github.com/man-group/dtale/issues/423): y-axis scale toggle
* [#422](https://github.com/man-group/dtale/issues/422): sheet selection on excel uploads
* [#421](https://github.com/man-group/dtale/issues/421): replacements not replacing zeroes

### 1.33.1 (2021-2-1)
* [#420](https://github.com/man-group/dtale/issues/420): Added python2.7 support back
* [#416](https://github.com/man-group/dtale/issues/416): aggregating charts by "first" or "last"
* [#415](https://github.com/man-group/dtale/issues/415): fix display of heatmap option on main menu when column heatap on

### 1.33.0 (2021-1-31)
* Excel Uploads
* Removed python2.7 support from code
* CI Updates:
  * updated JS workflow to use latest node image
  * dropped support for python 2.7 and added support for python 3.9
* Jest test refactoring
* [#415](https://github.com/man-group/dtale/issues/415): single column heatmap
* [#414](https://github.com/man-group/dtale/issues/414): exporting charts using "top_bars"
* [#413](https://github.com/man-group/dtale/issues/413): Q-Q Plot
* [#411](https://github.com/man-group/dtale/issues/411): updates for column analysis warnings
* [#412](https://github.com/man-group/dtale/issues/412): histogram for date columns
* [#404](https://github.com/man-group/dtale/issues/404): fixes for group input display on floats and data frequencies

### 1.32.1 (2021-1-25)
* [#408](https://github.com/man-group/dtale/issues/408): modifications to exponential smoothing column builder UI
* [#405](https://github.com/man-group/dtale/issues/405): removed cleaners from non-string columns)
* [#404](https://github.com/man-group/dtale/issues/404): fixed bug with missing group selection dropdown on strings)
* [#406](https://github.com/man-group/dtale/issues/406): handling for duplicate bins

### 1.32.0 (2021-1-24)
* [#396](https://github.com/man-group/dtale/issues/396): added kurtosis to date column descriptions and fixed issue with sequential diffs hanging around for previous columns
* [#397](https://github.com/man-group/dtale/issues/397): group type & bin type (frequency/width) options for charts
* Updated pandas query building to use backticks for extreme column names
* Node tooltips and URL history building for Network Viewer
* [#399](https://github.com/man-group/dtale/issues/399): better titles for groups in charts
* [#393](https://github.com/man-group/dtale/issues/393): rolling & exponential smoothing column builders
* [#401](https://github.com/man-group/dtale/issues/401): option to show top values in bar charts

### 1.31.0 (2021-1-16)
* [#387](https://github.com/man-group/dtale/issues/387): calculate skew on date columns converted to millisecond integers
* [#386](https://github.com/man-group/dtale/issues/386): bugfixes with "Rows w/ numeric" & "Rows w/ hidden"
* [#389](https://github.com/man-group/dtale/issues/389): added more precision to KDE values
* update Network Viewer to allow for URL parameter passing of to, from, group & weight
* [#343](https://github.com/man-group/dtale/issues/343): buttons to load sequential diffs for different sorts
* [#376](https://github.com/man-group/dtale/issues/376): added bins option to charts for float column groupings
* [#345](https://github.com/man-group/dtale/issues/345): geolocation analysis
* [#370](https://github.com/man-group/dtale/issues/370): toggle to turn off auto-loading of charts
* [#330](https://github.com/man-group/dtale/issues/330): data slope column builder
* additional documentation

### 1.30.0 (2021-1-3)
* fixed dependency issues with 27-3 build and pandas 1.2.0 test failures
* [#379](https://github.com/man-group/dtale/issues/379): issue with skew description
* [#346](https://github.com/man-group/dtale/issues/346): updated mapbox description
* [#381](https://github.com/man-group/dtale/issues/381): Network Analysis sub-page
* [#361](https://github.com/man-group/dtale/issues/361): Network Display
* fixed styling of Dash modals

### 1.29.1 (2020-12-24)
* [#228](https://github.com/man-group/dtale/issues/228): additional documentation on how to run in docker
* [#344](https://github.com/man-group/dtale/issues/344): Updates to sorting of unique values as well as display of word value count raw values
* [#374](https://github.com/man-group/dtale/issues/374): fixed issue displaying "NaN" string values in chart group options
* [#373](https://github.com/man-group/dtale/issues/373): only use group values in mapbox if mapbox group column(s) has been specified
* [#367](https://github.com/man-group/dtale/issues/367): rows with hidden characters
* [#372](https://github.com/man-group/dtale/issues/372): updated labels for First/Last aggregations and added "Remove Duplicates" option
* [#368](https://github.com/man-group/dtale/issues/368): updated "No Aggregation" to be default aggregationfor charts
* [#369](https://github.com/man-group/dtale/issues/369): x-axis count wordclouds
* [#366](https://github.com/man-group/dtale/issues/366): additional hyphen added to "Replace Hyphens w/ Space" cleaner
* [#365](https://github.com/man-group/dtale/issues/365): fixed display issues with KDE

### 1.29.0 (2020-12-22)
* [#363](https://github.com/man-group/dtale/issues/363): show/hide columns on load
* [#348](https://github.com/man-group/dtale/issues/348): sub-date map animation fix
* [#347](https://github.com/man-group/dtale/issues/347): display items loaded in "Load" slider
* [#349](https://github.com/man-group/dtale/issues/349): additional duplicates handling in chart builders
* node-notifier depdabot alert
* [#351](https://github.com/man-group/dtale/issues/351): added KDE to histograms in column analysis
* package upgrades
* [#350](https://github.com/man-group/dtale/issues/350): x-axis column selection no longer required for charts
  * if there is no selection then the default index of (1, 2, ..., N) will be used in its place
* [#356](https://github.com/man-group/dtale/issues/356): "replace hyphens" cleaner and cleaners added to "Value Counts" analysis
* [#358](https://github.com/man-group/dtale/issues/358): addition skew/kurtosis display
* [#357](https://github.com/man-group/dtale/issues/357): cleaner for hidden characters
* [#359](https://github.com/man-group/dtale/issues/358): repositioned skew/kurt in describe
* [#359](https://github.com/man-group/dtale/issues/359): moved "Variance Report" option up in column menu
* [#360](https://github.com/man-group/dtale/issues/360): updates to string describe labels
* fixed issues with draggable/resizable modals

### 1.28.1 (2020-12-16)
* updated modals to be resizable (re-resizable)

### 1.28.0 (2020-12-14)
* [#354](https://github.com/man-group/dtale/issues/354): fix for building data ids greater than 10
* [#343](https://github.com/man-group/dtale/issues/343): remove nan & nat values from sequential diff analysis
* [#342](https://github.com/man-group/dtale/issues/342): column cleaner descriptions
* [#340](https://github.com/man-group/dtale/issues/340): add column cleaners to "Word Value Counts" analysis chart
* [#341](https://github.com/man-group/dtale/issues/341): NLTK stopword cleaner updates
* [#338](https://github.com/man-group/dtale/issues/338): removing nan values from string metrics
* [#334](https://github.com/man-group/dtale/issues/334): skew/kurtosis summary
* Updated modals to be movable (react-draggable)
* build(deps): bump ini from 1.3.5 to 1.3.7
* Notify iframe parent of updates


### 1.27.0 (2020-12-9)
* fixed bug with bar chart animations
* [#335](https://github.com/man-group/dtale/issues/336): addition string metrics for Describe popup
* [#336](https://github.com/man-group/dtale/issues/336): sqlite loader
* [#333](https://github.com/man-group/dtale/issues/333): sequential diffs in describe popup
* [#332](https://github.com/man-group/dtale/issues/332): adding "word counts" to Describe popup]
* [#329](https://github.com/man-group/dtale/issues/329): diff() column builder
* added highlight.js & upgraded react-syntax-highlighter

### 1.26.0 (2020-12-5)
* [#325](https://github.com/man-group/dtale/issues/325): Plotly export chart colors
* fixed highlight.js dependabot warning
* [#326](https://github.com/man-group/dtale/issues/326): trendline with datetime data
* [#327](https://github.com/man-group/dtale/issues/327): fixed issues with cleaner deselection
* [#273](https://github.com/man-group/dtale/issues/273): Predictive Power Score

### 1.25.0 (2020-11-30)
* [#323](https://github.com/man-group/dtale/issues/323): precision setting for all float columns
* [#265](https://github.com/man-group/dtale/issues/265): column cleaners
* [#322](https://github.com/man-group/dtale/issues/322): colorscales not being included in chart exports and colorscales added to surface charts
* [#148](https://github.com/man-group/dtale/issues/148): random sampling in charts

### 1.24.0 (2020-11-23)
* [#295](https://github.com/man-group/dtale/issues/295): check for swifter when executing apply functions
* Reworked the display of the "Instances" popup
* fixed issue with serving static assets when using "app_root"

### 1.23.0 (2020-11-21)
* Added better handling for `open_browser`
* [#319](https://github.com/man-group/dtale/issues/319): fix for loading xarray dimensions
* Added support for embedding D-Tale within Streamlit

### 1.22.1 (2020-11-15)
* additional updates to how int/float hex conversions work

### 1.22.0 (2020-11-14)
* [#317](https://github.com/man-group/dtale/issues/317): convert int/float to hexadecimal
* Copy Columns/Rows to clipboard using Shift+Click & Ctrl+Click
* Added "items" function to global state mechanisms
* [#296](https://github.com/man-group/dtale/issues/296): heatmap doesn't respect current filters

### 1.21.1 (2020-11-8)
* Additional fixes for #313 & #302
  * Handling for partial `.ini` files
  * Handling for dictionary inputs w/ non-iterable values

### 1.21.0 (2020-11-6)
* [#313](https://github.com/man-group/dtale/issues/313): support for numpy.array, lists & dictionaries
* [#302](https://github.com/man-group/dtale/issues/302): configuration file for default options
* Removal of legacy charting code & updating flask route to plotly dash charts from `/charts` to `/dtale/charts`
* Update to how routes are overriden so it will work with gunicorn
* Documentation
  * running within gunicorn
  * embedding in another Flask or Django app
  * configuration settings

### 1.20.0 (2020-11-1)
* [#311](https://github.com/man-group/dtale/issues/311): png chart exports and fix for trandlines in exports
* Added the option to switch grid to "Dark Mode"

### 1.19.2 (2020-10-25)
* Documentation updates & better formatting of sample dataset buttons
* bugfixes for loading empty dtale in a notebook and chart display in embedded app demo

### 1.19.1 (2020-10-24)
* Load CSV/TSV/JSON from the web as well as some sample datasets
* [#310](https://github.com/man-group/dtale/issues/310): handling for nan in ordinal & label encoders

### 1.19.0 (2020-10-23)
* [#123](https://github.com/man-group/dtale/issues/123): selecting a range of cells to paste into excel
* Documentation on embedding D-Tale in another Flask app
* bugfix for altering single y-axis ranges when x-axis is non-numeric
* [#272](https://github.com/man-group/dtale/issues/272): encoders for categorical columns

### 1.18.2 (2020-10-17)
* [#305](https://github.com/man-group/dtale/issues/305): Show Duplicates column(s) label
* [#304](https://github.com/man-group/dtale/issues/304): Link to Custom Filter from Column Menu
* [#301](https://github.com/man-group/dtale/issues/301): Normalized Similarity
* [#289](https://github.com/man-group/dtale/issues/289): Show Duplicates query bug & scrollable duplicate groups


### 1.18.1 (2020-10-16)
* [#299](https://github.com/man-group/dtale/issues/299): Value counts not matching top unique values in Column Analysis
* [#298](https://github.com/man-group/dtale/issues/298): Standardize column builder bug
* [#297](https://github.com/man-group/dtale/issues/297): Similarity bugs
* [#290](https://github.com/man-group/dtale/issues/290): show top 5 values with highest frequency in describe details
* [#288](https://github.com/man-group/dtale/issues/288): Add Duplicates popup to Column Menu

### 1.18.0 (2020-10-15)
* [#282](https://github.com/man-group/dtale/issues/282): additional exception handling for overriding routes
* [#271](https://github.com/man-group/dtale/issues/271): standardized column builder
* [#282](https://github.com/man-group/dtale/issues/282): better support for using D-Tale within another Flask application
* [#270](https://github.com/man-group/dtale/issues/270): filter outliers from column menu
* allow users to start D-Tale without loading data
* [#264](https://github.com/man-group/dtale/issues/264): similarity column builder
* [#286](https://github.com/man-group/dtale/issues/286): column description lag after type conversion

### 1.17.0 (2020-10-10)
* [#269](https://github.com/man-group/dtale/issues/269): column based range highlighting
* [#268](https://github.com/man-group/dtale/issues/268): better button labels for inplace vs. new column
* [#283](https://github.com/man-group/dtale/issues/283): triple-quote formatting around queries in code exports
* [#266](https://github.com/man-group/dtale/issues/266): string concatenation string builder
* [#267](https://github.com/man-group/dtale/issues/267): Column discretion UI
* Fix: Pandas throws error when converting numeric column names to string.

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
