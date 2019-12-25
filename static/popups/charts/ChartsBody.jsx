import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../../Bouncer";
import { RemovableError } from "../../RemovableError";
import chartUtils from "../../chartUtils";
import { fetchJson } from "../../fetcher";
import WordcloudBody from "./WordcloudBody";

function toggleBouncer() {
  $("#chart-bouncer").toggle();
  $("#coveragePopup").toggle();
}

function createChartCfg(ctx, { data }, { columns, x, y, additionalOptions, chartType, configHandler }) {
  let cfg = null;
  switch (chartType) {
    case "bar":
      cfg = chartUtils.createBarCfg({ data }, { columns, x, y, additionalOptions, configHandler });
      break;
    case "stacked":
      cfg = chartUtils.createStackedCfg({ data }, { columns, x, y, additionalOptions, configHandler });
      break;
    case "pie":
      cfg = chartUtils.createPieCfg({ data }, { columns, x, y, additionalOptions, configHandler });
      break;
    case "line":
    default:
      cfg = chartUtils.createLineCfg({ data }, { columns, x, y, additionalOptions, configHandler });
      break;
  }
  return chartUtils.createChart(ctx, cfg);
}

function createCharts(data, props) {
  if (_.isEmpty(_.get(data, "data", {}))) {
    return null;
  }
  if (props.chartType === "wordcloud") {
    return null;
  }
  if (props.chartPerGroup) {
    return _.map(_.get(data, "data", {}), (series, seriesKey) => {
      const mainProps = _.pick(props, ["columns", "x", "y", "additionalOptions", "chartType", "configHandler"]);
      mainProps.additionalOptions = _.assignIn(mainProps.additionalOptions, {
        title: { display: true, text: seriesKey },
      });
      const builder = ctx => createChartCfg(ctx, { data: { all: series } }, mainProps);
      return chartUtils.chartWrapper(`chartCanvas-${seriesKey}`, null, builder);
    });
  }
  const builder = ctx => createChartCfg(ctx, data, props);
  return [chartUtils.chartWrapper("chartCanvas", null, builder)];
}

class ChartsBody extends React.Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = { charts: null, error: null };
    this.buildChart = this.buildChart.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (this.state.error != newState.error) {
      return true;
    }

    if (this.props.chartType == "wordcloud" && !_.isEqual(this.state.data, newState.data)) {
      return true;
    }

    if (this.state.chart != newState.chart) {
      // Don't re-render if we've only changed the chart.
      return false;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  componentDidUpdate(prevProps) {
    if (!this.props.visible) {
      return;
    }
    if (prevProps.url !== this.props.url) {
      this.buildChart();
      return;
    }
    const selectedProps = ["chartType", "chartPerGroup"];
    if (!_.isEqual(_.pick(this.props, selectedProps), _.pick(prevProps, selectedProps))) {
      _.forEach(this.state.charts || [], c => c.destroy());
      this.setState({
        error: null,
        charts: createCharts(_.get(this.state, "data", {}), this.props),
      });
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
    toggleBouncer();
    _.forEach(this.state.charts || [], c => c.destroy());
    fetchJson(this.props.url, fetchedChartData => {
      toggleBouncer();
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
        this.setState({
          error: null,
          data: fetchedChartData,
          charts: createCharts(fetchedChartData, this.props),
        });
      }
    });
  }

  render() {
    let charts = null;
    if (this.props.chartPerGroup || (this.props.chartType === "wordcloud" && this.props.group)) {
      charts = (
        <div className="row">
          {_.map(_.keys(_.get(this.state, "data.data", {})), k => (
            <div key={k} className="col-md-6" style={{ height: this.props.height }}>
              {this.props.chartType !== "wordcloud" && <canvas id={`chartCanvas-${k}`} height={this.props.height} />}
              {this.props.chartType === "wordcloud" && (
                <WordcloudBody {...this.props} data={this.state.data} seriesKey={k} height={this.props.height} />
              )}
            </div>
          ))}
        </div>
      );
    } else if (this.props.chartType === "wordcloud") {
      charts = <WordcloudBody {...this.props} data={this.state.data} seriesKey="all" height={this.props.height} />;
    } else {
      charts = <canvas id="chartCanvas" height={this.props.height} />;
    }
    return (
      <div>
        <div id="chart-bouncer" style={{ display: "none" }}>
          <Bouncer />
        </div>
        {this.state.error}
        {charts}
      </div>
    );
  }
}

ChartsBody.displayName = "ChartsBody";
ChartsBody.propTypes = {
  url: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object),
  x: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  y: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  chartType: PropTypes.string,
  chartPerGroup: PropTypes.bool,
  visible: PropTypes.bool.isRequired,
  height: PropTypes.number,
  additionalOptions: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  configHandler: PropTypes.func,
};
ChartsBody.defaultProps = {
  height: 400,
  chartPerGroup: false,
  chartType: "line",
  configHandler: config => config,
};

export default ChartsBody;
