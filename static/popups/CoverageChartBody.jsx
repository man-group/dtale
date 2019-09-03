import chroma from "chroma-js";
import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";

function toggleBouncer() {
  $("#chart-bouncer").toggle();
  $("#coveragePopupChart").toggle();
}

const COLOR_PROPS = [
  "borderColor",
  "backgroundColor",
  "pointHoverBackgroundColor",
  "pointBorderColor",
  "pointBackgroundColor",
  "pointHoverBackgroundColor",
  "pointHoverBorderColor",
];

function createChart(ctx, fetchedData, { group, additionalOptions }) {
  const { data } = fetchedData;
  const labels = _.map(fetchedData.labels, l => _.join(_.map(_.filter(group, g => _.has(l, g)), g => l[g]), ","));
  const colors = chroma.scale(["orange", "yellow", "green", "lightblue", "darkblue"]).domain([0, _.size(data)]);
  return chartUtils.createChart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: _.map(_.toPairs(data), ([k, v], i) => {
        const color = colors(i).hex();
        const ptCfg = {
          fill: false,
          lineTension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHitRadius: 5,
          label: k,
          data: v,
          yAxisID: `yAxis-${k}`,
        };
        _.forEach(COLOR_PROPS, cp => (ptCfg[cp] = color));
        return ptCfg;
      }),
    },
    options: _.assignIn(
      {
        responsive: true,
        pan: { enabled: true, mode: "x" },
        zoom: { enabled: true, mode: "x", speed: 0.5 },
        tooltips: {
          mode: "index",
          intersect: false,
        },
        hover: {
          mode: "nearest",
          intersect: true,
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Group",
              },
            },
          ],
          yAxes: _.map(_.toPairs(data), ([col, series], idx) => ({
            id: `yAxis-${col}`,
            scaleLabel: {
              display: true,
              labelString: `${col} Count`,
            },
            ticks: { min: _.min(series), max: _.max(series) },
            position: idx % 2 == 0 ? "left" : "right",
          })),
        },
      },
      additionalOptions
    ),
  });
}

class CoverageChartBody extends React.Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = { chart: null, error: null };
    this.buildChart = this.buildChart.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (this.state.error != newState.error) {
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
    if (prevProps.url === this.props.url) {
      return;
    }
    this.buildChart();
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
    fetchJson(this.props.url, fetchedChartData => {
      toggleBouncer();
      if (this.mounted) {
        if (fetchedChartData.error) {
          this.setState({ error: <RemovableError {...fetchedChartData} />, chart: null });
          return;
        }
        if (_.isEmpty(_.get(fetchedChartData, "data", {}))) {
          this.setState({ error: <RemovableError error="No data found." />, chart: null });
          return;
        }
        const builder = ctx => {
          if (_.isEmpty(_.get(fetchedChartData, "data", {}))) {
            return null;
          }

          return createChart(ctx, fetchedChartData, this.props);
        };
        const chart = chartUtils.chartWrapper("coveragePopupChart", this.state.chart, builder);
        this.setState({ chart, error: null });
      }
    });
  }

  render() {
    return (
      <div>
        <div id="chart-bouncer" style={{ display: "none" }}>
          <Bouncer />
        </div>
        {this.state.error}
        <canvas id="coveragePopupChart" height={this.props.height} />
      </div>
    );
  }
}

CoverageChartBody.displayName = "CoverageChartBody";
CoverageChartBody.propTypes = {
  url: PropTypes.string,
  col: PropTypes.arrayOf(PropTypes.string), // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.arrayOf(PropTypes.string), // eslint-disable-line react/no-unused-prop-types
  visible: PropTypes.bool.isRequired,
  height: PropTypes.number,
  additionalOptions: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
};
CoverageChartBody.defaultProps = { height: 400 };

export default CoverageChartBody;
