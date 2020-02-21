#### Charts (legacy)
Build custom charts based off your data.

 - To build a chart you must pick a value for X & Y inputs which effectively drive what data is along the X & Y axes
 - If your data along the x-axis has duplicates you have three options:
   - specify a group, which will create series for each group
   - specify an aggregation, you can choose from one of the following: Count, First, Last, Mean, Median, Minimum, MAximum, Standard Deviation, Variance, Mean Absolute Deviation, Product of All Items, Sum, Rolling
     - Specifying a "Rolling" aggregation will also require a Window & a Computation (Correlation, Coiunt, Covariance, Kurtosis, Maximum, Mean, Median, Minimum, Skew, Standard Deviation, Sum or Variance)
   - specify both a group & an aggregation
 - Click the "Load" button which will load the data and display the default cahrt type "line"
 - You now have the ability to toggle between different chart types: line, bar, stacked bar, pie & wordcloud
 - If you have specified a group then you have the ability between showing all series in one chart and breaking each series out into its own chart "Chart per Group"

Here are some examples with the following inputs: X: date, Y: Col0, Group: security_id, Aggregation: Mean, Query: `security_id in (100000, 100001) and date >= '20181220' and date <= '20181231'`

|Chart Type|Chart|Chart per Group|
|:------:|:------:|:------:|
|line|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/line.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/line_pg.png)|
|bar|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/bar.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/bar_pg.png)|
|stacked|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/stacked.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/stacked_pg.png)|
|pie|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/pie.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/pie_pg.png)|
|wordcloud|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/wordcloud.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/wordcloud_pg.png)|

Selecting multiple columns for the Y-Axis will produce similar results to grouping in the sense that the chart will contain multiple series, but the difference is that for each column there will be a different Y-Axis associated with it in case the values contained within each column are on different scales.

|Multi Y-Axis|Editing Axis Ranges|
|:------:|:------:|
|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/multi_col.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/editing_axis.png)|

With a bar chart that only has a single Y-Axis you have the ability to sort the bars based on the values for the Y-Axis

|Pre-sort|Post-sort|
|:------:|:------:|
|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/bar_presort.png)|![](https://raw.githubusercontent.com/aschonfeld/dtale-media/master/images/legacy_charts/bar_postsort.png)|