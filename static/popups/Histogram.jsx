import qs from "querystring";

import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { RemovableError } from "../RemovableError";
import { buildURLParams } from "../actions/url-utils";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";

const BASE_HISTOGRAM_URL = "/dtale/histogram?";
const DESC_PROPS = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];

function createHistogram(ctx, fetchedData, col) {
  const { desc, labels, data } = fetchedData;
  const descHTML = _.map(DESC_PROPS, p => `${_.capitalize(p)}: <b>${_.round(desc[p], 4)}</b>`).join(", ");
  $("#describe").html(`<small>${descHTML}</small>`);
  return chartUtils.createChart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: col, data: data, backgroundColor: "rgb(42, 145, 209)" }],
    },
    options: {
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "Bin",
            },
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "Count",
            },
          },
        ],
      },
    },
  });
}

class ReactHistogram extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null, bins: 20 };
    this.buildHistogramFilters = this.buildHistogramFilters.bind(this);
    this.buildHistogram = this.buildHistogram.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const updateState = ["bins", "error"];
    if (!_.isEqual(_.pick(this.state, updateState), _.pick(newState, updateState))) {
      return true;
    }

    if (this.state.chart != newState.chart) {
      // Don't re-render if we've only changed the chart.
      return false;
    }

    // Otherwise, use the default react behavior.
    return false;
  }

  componentDidUpdate() {
    if (!this.props.chartData.visible || this.state.error) {
      return;
    }

    this.buildHistogram();
  }

  componentDidMount() {
    this.buildHistogram();
  }

  buildHistogramFilters() {
    const binChange = e => this.setState({ bins: _.parseInt(e.target.value) });
    return (
      <div className="form-group row small-gutters">
        <label className="col-form-label text-right">Bins</label>
        <div>
          <select className="form-control custom-select" defaultValue={20} onChange={binChange}>
            <option key={5}>5</option>
            <option key={10}>10</option>
            <option key={20}>20</option>
            <option key={50}>50</option>
          </select>
        </div>
      </div>
    );
  }

  buildHistogram() {
    const { col } = this.props.chartData;
    const paramProps = ["col", "query", "bins"];
    const params = _.assignIn({ bins: this.state.bins }, this.props.chartData);
    fetchJson(BASE_HISTOGRAM_URL + qs.stringify(buildURLParams(params, paramProps)), fetchedChartData => {
      const newState = { error: null };
      if (fetchedChartData.error) {
        newState.error = <RemovableError {...fetchedChartData} />;
      }
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data", []).length) {
          return null;
        }

        return createHistogram(ctx, fetchedChartData, col);
      };
      newState.chart = chartUtils.chartWrapper("universeHistogram", this.state.chart, builder);
      this.setState(newState);
    });
  }

  render() {
    if (!_.isEmpty(this.state.error)) {
      return (
        <div key="body" className="modal-body">
          {this.state.error}
        </div>
      );
    }
    return [
      <div key="inputs" className="modal-body modal-form">
        <form>{this.buildHistogramFilters()}</form>
      </div>,
      <div key="body" className="modal-body">
        <canvas id="universeHistogram" height={this.props.height} />
      </div>,
    ];
  }
}
ReactHistogram.displayName = "Histogram";
ReactHistogram.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    col: PropTypes.string,
    query: PropTypes.string,
  }),
  height: PropTypes.number,
};
ReactHistogram.defaultProps = { height: 400 };

function mapStateToProps(state) {
  return {
    chartData: state.chartData,
    error: state.error,
  };
}

const ReduxHistogram = connect(mapStateToProps)(ReactHistogram);

export { ReactHistogram, ReduxHistogram as Histogram };
