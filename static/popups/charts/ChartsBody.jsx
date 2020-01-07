/* eslint max-lines: "off" */
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { Bouncer } from "../../Bouncer";
import ConditionalRender from "../../ConditionalRender";
import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import chartUtils from "../../chartUtils";
import { isDateCol } from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import { toggleBouncer } from "../../toggleUtils";
import AxisEditor from "./AxisEditor";
import ChartLabel from "./ChartLabel";
import WordcloudBody from "./WordcloudBody";

function chartType(state) {
  return _.get(state, "chartType.value");
}

function chartTypes({ y }) {
  const types = ["line", "bar", "stacked"];
  const yList = _.concat([], y || []);
  if (_.size(yList) < 2) {
    types.push("scatter");
    types.push("pie");
  }
  types.push("wordcloud");
  return types;
}

function createChartCfg(ctx, data, { columns, x, y, additionalOptions, chartType, configHandler }, funcs = {}) {
  let cfg = null;
  const mainProps = {
    columns,
    x: _.get(x, "value"),
    y: _.map(y || [], "value"),
    additionalOptions,
    configHandler,
  };
  switch (chartType) {
    case "bar":
      cfg = chartUtils.createBarCfg(data, mainProps);
      break;
    case "stacked":
      cfg = chartUtils.createStackedCfg(data, mainProps);
      break;
    case "scatter":
      cfg = chartUtils.createScatterCfg(data, mainProps);
      break;
    case "pie":
      cfg = chartUtils.createPieCfg(data, mainProps);
      break;
    case "line":
    default: {
      if (_.has(funcs, "viewTimeDetails")) {
        mainProps.additionalOptions = _.assignIn(additionalOptions || {}, {
          onClick: funcs.viewTimeDetails,
        });
      }
      cfg = chartUtils.createLineCfg(data, mainProps);
      break;
    }
  }
  return chartUtils.createChart(ctx, cfg);
}

function createCharts(data, props, state, funcs = {}) {
  if (_.isEmpty(_.get(data, "data", {}))) {
    return null;
  }
  const chartTypeVal = chartType(state);
  if (chartTypeVal === "wordcloud") {
    return null;
  }
  if (state.chartPerGroup) {
    return _.map(_.get(data, "data", {}), (series, seriesKey) => {
      const mainProps = _.pick(props, ["columns", "x", "y", "additionalOptions", "configHandler"]);
      mainProps.chartType = chartTypeVal;
      mainProps.additionalOptions = _.assignIn(mainProps.additionalOptions, {
        title: { display: true, text: seriesKey },
      });
      const subData = { data: { all: series }, min: data.min, max: data.max };
      const builder = ctx => createChartCfg(ctx, subData, mainProps, funcs);
      return chartUtils.chartWrapper(`chartCanvas-${seriesKey}`, null, builder);
    });
  }
  const builder = ctx => createChartCfg(ctx, data, _.assignIn({}, props, { chartType: chartTypeVal }), funcs);
  return [chartUtils.chartWrapper("chartCanvas", null, builder)];
}

function sortBars(data, props, state) {
  _.forEach(_.get(data, "data", {}), series => {
    const yProp = _.head(props.y).value;
    const [sortedX, sortedY] = _.unzip(_.sortBy(_.zip(series.x, series[yProp]), "1"));
    series.x = sortedX;
    series[yProp] = sortedY;
  });
  return createCharts(data, props, state);
}

class ChartsBody extends React.Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = {
      chartType: { value: props.chartType || "line" },
      chartPerGroup: props.chartPerGroup === "true",
      charts: null,
      error: null,
      zoomed: null,
    };
    _.forEach(
      ["buildChart", "sortBars", "updateAxis", "viewTimeDetails", "resetZoom", "renderLabel", "renderControls"],
      f => (this[f] = this[f].bind(this))
    );
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (this.state.error != newState.error) {
      return true;
    }

    const selectedState = ["chartType", "chartPerGroup", "data", "zoomed"];
    if (!_.isEqual(_.pick(this.state, selectedState), _.pick(newState, selectedState))) {
      return true;
    }

    if (this.state.charts != newState.charts) {
      // Don't re-render if we've only changed the chart.
      return false;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.visible) {
      return;
    }
    if (prevProps.url !== this.props.url) {
      this.buildChart();
      return;
    }
    const selectedState = ["chartType", "chartPerGroup"];
    if (!_.isEqual(_.pick(this.state, selectedState), _.pick(prevState, selectedState))) {
      if (chartType(this.state) !== chartType({ state: prevState }) && chartType({ state: prevState }) === "scatter") {
        this.buildChart(); //need to reload chart data because scatter charts allow duplicates
      } else {
        _.forEach(this.state.charts || [], c => c.destroy());
        const funcs = _.pick(this, ["viewTimeDetails"]);
        this.setState({
          error: null,
          charts: createCharts(_.get(this.state, "data", {}), this.props, this.state, funcs),
        });
      }
    }
  }

  componentDidMount() {
    this.mounted = true;
    this.buildChart();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  buildChart() {
    if (_.isNil(this.props.url)) {
      return;
    }
    toggleBouncer(["chart-bouncer", "coveragePopup"]);
    _.forEach(this.state.charts || [], c => c.destroy());
    fetchJson(`${this.props.url}${chartType(this.state) === "scatter" ? "&allowDupes=true" : ""}`, fetchedChartData => {
      toggleBouncer(["chart-bouncer", "coveragePopup"]);
      if (this.mounted) {
        if (fetchedChartData.error) {
          this.setState({
            error: <RemovableError {...fetchedChartData} />,
            charts: null,
            data: null,
          });
          return;
        }
        if (_.isEmpty(_.get(fetchedChartData, "data", {}))) {
          this.setState({
            error: <RemovableError error="No data found." />,
            chart: null,
          });
          return;
        }
        this.setState(
          {
            error: null,
            data: fetchedChartData,
            charts: createCharts(fetchedChartData, this.props, this.state, _.pick(this, ["viewTimeDetails"])),
          },
          this.props.dataLoadCallback(fetchedChartData)
        );
      }
    });
  }

  resetZoom() {
    const { charts } = this.state;
    if (charts) {
      _.forEach(charts, c => {
        delete c.options.scales.xAxes[0].ticks;
        c.update();
      });
      this.setState({ zoomed: null });
    }
  }

  viewTimeDetails(evt) {
    const { charts } = this.state;
    if (charts) {
      const selectedChart = _.find(charts, c => !_.isEmpty(c.getElementAtEvent(evt)));
      if (selectedChart) {
        const selectedPoint = _.head(selectedChart.getElementAtEvent(evt));
        if (selectedPoint) {
          const ticks = {
            min: selectedChart.data.labels[_.max([0, selectedPoint._index - 10])],
            max: selectedChart.data.labels[_.min([selectedChart.data.labels.length - 1, selectedPoint._index + 10])],
          };
          _.forEach(charts, c => {
            c.options.scales.xAxes[0].ticks = ticks;
            c.update();
          });
          let zoomed = `${ticks.min} - ${ticks.max}`;
          if (isDateCol(_.find(this.props.columns, { name: this.props.x.value }).dtype)) {
            const buildLabel = x => moment(new Date(x)).format("YYYY-MM-DD");
            zoomed = `${buildLabel(ticks.min)} - ${buildLabel(ticks.max)}`;
          }
          this.setState({ zoomed });
        }
      }
    }
  }

  renderLabel() {
    const { data, error, zoomed } = this.state;
    return (
      <ConditionalRender display={!_.isEmpty(data) && _.isEmpty(error)}>
        <ChartLabel {..._.assign({}, this.props, this.state)} />
        <ConditionalRender display={!_.isEmpty(zoomed)}>
          <div className="coverage-desc">
            <span className="pr-3" style={{ marginLeft: "3em" }}>{`Zoomed: ${zoomed}`}</span>
            <JSAnchor onClick={this.resetZoom}>{"X"}</JSAnchor>
          </div>
        </ConditionalRender>
      </ConditionalRender>
    );
  }

  sortBars() {
    _.forEach(this.state.charts || [], c => c.destroy());
    this.setState({
      charts: sortBars(_.get(this.state, "data", {}), this.props, this.state),
    });
  }

  updateAxis(settings) {
    if (_.isEqual(settings, _.pick(this.state.data, ["min", "max"]))) {
      return;
    }
    _.forEach(this.state.charts || [], c => c.destroy());
    const updatedData = _.assignIn({}, _.get(this.state, "data", {}), settings);
    this.setState({
      data: updatedData,
      charts: createCharts(updatedData, this.props, this.state, _.pick(this, ["viewTimeDetails"])),
    });
  }

  renderControls() {
    if (this.props.showControls) {
      const showBarSort =
        chartType(this.state) === "bar" &&
        _.isNull(this.props.group) &&
        !_.isEmpty(this.state.data) &&
        _.size(this.props.y) < 2;
      return [
        <div key={0} className="row pl-5 pt-3 pb-3 charts-filters">
          <span className="mb-auto mt-auto">Chart:</span>
          <div className="col-auto">
            <div className="input-group mr-3">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={_.map(chartTypes(this.state), ct => ({ value: ct }))}
                getOptionLabel={_.property("value")}
                getOptionValue={_.property("value")}
                value={this.state.chartType}
                onChange={selected => this.setState({ chartType: selected })}
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
          <ConditionalRender display={_.size(this.props.group || []) > 0}>
            <span className="mb-auto mt-auto">Chart per Group:</span>
            <div className="col-auto">
              <input
                type="checkbox"
                checked={this.state.chartPerGroup}
                onChange={e => this.setState({ chartPerGroup: e.target.checked })}
              />
            </div>
          </ConditionalRender>
          <ConditionalRender display={showBarSort}>
            <button
              style={{ whiteSpace: "pre-wrap" }}
              className="btn-sm btn-primary pl-3 pr-3 mr-5"
              onClick={this.sortBars}>
              {"Sort Bars"}
            </button>
          </ConditionalRender>
          <AxisEditor {..._.assignIn({}, this.state, this.props)} data={this.state.data} updateAxis={this.updateAxis} />
        </div>,
        <div key={1} className="row pb-3">
          <div className="col-md-10">{this.renderLabel()}</div>
        </div>,
      ];
    }
    return null;
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    let charts = null;
    if (chartType(this.state) === "wordcloud") {
      charts = <WordcloudBody {..._.assignIn({}, this.props, this.state)} />;
    } else if (this.state.chartPerGroup) {
      charts = (
        <div className="row">
          {_.map(_.get(this.state, "data.data", {}), (_v, k) => (
            <div key={k} className="col-md-6" style={{ height: this.props.height }}>
              <canvas id={`chartCanvas-${k}`} height={this.props.height} />
            </div>
          ))}
        </div>
      );
    } else {
      charts = <canvas id="chartCanvas" height={this.props.height} />;
    }
    return [
      this.renderControls(),
      <div key={2}>
        <div id="chart-bouncer" style={{ display: "none" }}>
          <Bouncer />
        </div>
        {this.state.error}
        {charts}
      </div>,
    ];
  }
}

ChartsBody.displayName = "ChartsBody";
ChartsBody.propTypes = {
  url: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object),
  x: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  y: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  aggregation: PropTypes.string,
  rollingWindow: PropTypes.string,
  rollingComputation: PropTypes.string,
  chartType: PropTypes.string,
  chartPerGroup: PropTypes.bool,
  visible: PropTypes.bool.isRequired,
  height: PropTypes.number,
  additionalOptions: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  configHandler: PropTypes.func,
  showControls: PropTypes.bool,
  dataLoadCallback: PropTypes.func,
};
ChartsBody.defaultProps = {
  height: 400,
  chartPerGroup: false,
  chartType: "line",
  configHandler: config => config,
  showControls: true,
  dataLoadCallback: _.noop,
};

export default ChartsBody;
