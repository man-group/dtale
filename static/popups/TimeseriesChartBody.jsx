import qs from "querystring";

import $ from "jquery";
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";

function toggleBouncer(id) {
  $("#" + id + "-bouncer").toggle();
  $("#" + id).toggle();
}

function defaultDatasetHandler(key, data, idx) {
  const [security, node, col, yAxisID] = key.split(":");
  const secDesc = security ? `Security: ${security}, ` : "";
  const dataset = {
    label: `(${secDesc}Node: ${node}, Column: ${col})`,
    fill: false,
    lineTension: 0.1,
    borderColor: chartUtils.TS_COLORS[idx],
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 5,
    data: _.map(data, row => ({ x: new Date(row.date), y: row[col] })),
  };
  if (yAxisID) {
    dataset.yAxisID = yAxisID;
  }
  return dataset;
}

function getCols(url) {
  const params = qs.parse(url.split("?")[1]);
  return _.flatMap(_.values(JSON.parse(_.get(params, "ts_columns", "{}"))));
}

class TimeseriesChartBody extends React.Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = { chart: {}, error: null };
    this.buildChart = this.buildChart.bind(this);
    this.buildTimeseries = this.buildTimeseries.bind(this);
    this.renderCharts = this.renderCharts.bind(this);
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
    this.buildTimeseries();
  }

  componentDidMount() {
    this.mounted = true;
    this.buildTimeseries();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  buildChart(chartId, chartData) {
    const ctx = document.getElementById(chartId);
    if (ctx) {
      if (_.get(this.state.chart, chartId)) {
        this.state.chart[chartId].destroy();
      }
      chartUtils.fitToContainer(ctx);
      let i = 0;
      const yAxises = [];
      let datasets = _.map(chartData, (tsData, key) => {
        const dataset = this.props.datasetHandler(key, tsData.data, i++);
        if (dataset.yAxisID && !_.find(yAxises, { id: dataset.yAxisID })) {
          const axisCfg = { id: dataset.yAxisID };
          if (this.props.useMinMax) {
            axisCfg.ticks = { min: tsData.min, max: tsData.max };
          }
          yAxises.push(axisCfg);
        }
        return dataset;
      });
      datasets = this.props.datasetSorter(datasets);
      const scales = {
        xAxes: [
          {
            type: "time",
            time: {
              unit: this.props.units,
              displayFormats: {
                [this.props.units]: "YYYYMMDD",
              },
              min: _.get(datasets, "0.data.0.x"),
              max: _.get(datasets, [0, "data", _.get(datasets, "0.data", []).length - 1, "x"]),
            },
          },
        ],
      };
      if (yAxises.length) {
        scales.yAxes = _.map(yAxises, (axisCfg, idx) =>
          _.assignIn({ position: idx % 2 == 0 ? "left" : "right" }, axisCfg)
        );
      }
      return chartUtils.createChart(
        ctx,
        this.props.configHandler({
          type: "line",
          data: { datasets },
          options: _.assign(
            {
              scales,
              tooltips: {
                callbacks: {
                  title: (tooltipItems, _data) => moment(new Date(tooltipItems[0].xLabel)).format("YYYY-MM-DD"),
                  label: (tooltipItem, _data) => _.round(tooltipItem.yLabel, 4),
                },
              },
            },
            this.props.chartOptions
          ),
        })
      );
    }
    return null;
  }

  buildTimeseries() {
    if (_.isNil(this.props.url)) {
      return;
    }
    const cols = getCols(this.props.url);
    toggleBouncer(this.props.id);
    fetchJson(this.props.url, fetchedChartData => {
      toggleBouncer(this.props.id);
      if (fetchedChartData.error) {
        this.setState({ error: <RemovableError {...fetchedChartData} />, chart: null });
        return;
      }
      if (_.isEmpty(_.get(fetchedChartData, "data", {}))) {
        this.setState({ error: <RemovableError error="No data found." />, chart: null });
        return;
      }
      const chart = {};
      if (this.props.chartPerDataset) {
        _.forEach(cols, col => {
          const chartId = `${col}-${this.props.id}`;
          const colKeys = _.filter(_.keys(fetchedChartData.data), k => _.endsWith(k, col));
          let colData = _.pick(fetchedChartData.data, colKeys);
          const yMin = Math.floor(_.min(_.map(fetchedChartData.data, "min")));
          const yMax = Math.ceil(_.max(_.map(fetchedChartData.data, "max")));
          colData = _.mapKeys(_.mapValues(colData, v => _.assignIn(v, { min: yMin, max: yMax })), (_v, k) => `${k}:0`);
          chart[chartId] = this.buildChart(chartId, colData);
        });
      } else {
        const chartId = this.props.id;
        chart[chartId] = this.buildChart(chartId, fetchedChartData.data);
      }
      if (this.mounted) {
        this.setState({ chart, error: null });
        this.props.propagateState(this.state);
      }
    });
  }

  renderCharts() {
    if (this.props.chartPerDataset) {
      return (
        <div id={this.props.id} className="row">
          {_.map(getCols(this.props.url), c => (
            <div key={c} className={`col-md-${12 / this.props.chartsPerRow}`}>
              <canvas id={`${c}-${this.props.id}`} height={this.props.height} />
            </div>
          ))}
        </div>
      );
    }
    return <canvas id={this.props.id} height={this.props.height} />;
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = <div className="p-3">{this.state.error}</div>;
    }
    return (
      <div className="timeseries-body">
        <div id={`${this.props.id}-bouncer`} style={{ display: "none" }}>
          <Bouncer />
        </div>
        {error}
        {this.renderCharts()}
      </div>
    );
  }
}

TimeseriesChartBody.displayName = "TimeseriesChartBody";
TimeseriesChartBody.propTypes = {
  url: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  units: PropTypes.string,
  height: PropTypes.number,
  chartOptions: PropTypes.object,
  datasetHandler: PropTypes.func,
  datasetSorter: PropTypes.func,
  configHandler: PropTypes.func,
  propagateState: PropTypes.func,
  id: PropTypes.string,
  chartPerDataset: PropTypes.bool,
  chartsPerRow: PropTypes.number,
  useMinMax: PropTypes.bool,
};
TimeseriesChartBody.defaultProps = {
  units: "day",
  height: 400,
  chartOptions: {},
  datasetHandler: defaultDatasetHandler,
  datasetSorter: datasets => datasets,
  configHandler: config => config,
  propagateState: _.noop,
  id: "ts-chart",
  chartPerDataset: false,
  chartsPerRow: 4,
  useMinMax: false,
};

export { TimeseriesChartBody, defaultDatasetHandler };
