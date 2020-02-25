import qs from "querystring";

import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { RemovableError } from "../RemovableError";
import actions from "../actions/dtale";
import { buildURLParams } from "../actions/url-utils";
import chartUtils from "../chartUtils";
import { fetchJson } from "../fetcher";
import { renderCodePopupAnchor } from "./CodePopup";

const BASE_HISTOGRAM_URL = "/dtale/histogram";
const DESC_PROPS = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];

function createHistogram(ctx, fetchedData, col) {
  const { desc, labels, data } = fetchedData;
  const descHTML = _.map(DESC_PROPS, p => `${_.capitalize(p)}: <b>${desc[p]}</b>`).join(", ");
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
    this.state = { chart: null, bins: "20" };
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

  componentDidMount() {
    this.buildHistogram();
  }

  buildHistogramFilters() {
    const updateBins = e => {
      if (e.key === "Enter") {
        if (this.state.bins && parseInt(this.state.bins)) {
          this.buildHistogram();
        }
        e.preventDefault();
      }
    };
    return (
      <div className="form-group row small-gutters mb-0">
        <div className="col-auto text-center">
          <div>
            <b>Bins</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>(Please edit)</small>
          </div>
        </div>
        <div style={{ width: "3em" }} data-tip="Press ENTER to submit" className="mb-auto mt-auto">
          <input
            type="text"
            className="form-control text-center"
            value={this.state.bins}
            onChange={e => this.setState({ bins: e.target.value })}
            onKeyPress={updateBins}
          />
        </div>
        <div className="col text-right">{renderCodePopupAnchor(this.state.code, "Histogram")}</div>
      </div>
    );
  }

  buildHistogram() {
    const { selectedCol } = this.props.chartData;
    const paramProps = ["selectedCol", "query", "bins"];
    const params = _.assignIn({ bins: this.state.bins }, this.props.chartData);
    const url = `${BASE_HISTOGRAM_URL}/${this.props.dataId}?${qs.stringify(buildURLParams(params, paramProps))}`;
    fetchJson(url, fetchedChartData => {
      const newState = { error: null };
      if (_.get(fetchedChartData, "error")) {
        newState.error = <RemovableError {...fetchedChartData} />;
      }
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data", []).length) {
          return null;
        }

        return createHistogram(ctx, fetchedChartData, selectedCol);
      };
      newState.chart = chartUtils.chartWrapper("universeHistogram", this.state.chart, builder);
      newState.code = _.get(fetchedChartData, "code", "");
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
    let description = null;
    if (actions.isPopup()) {
      description = (
        <div key="description" className="modal-header">
          <h4 className="modal-title">
            <i className="ico-equalizer" />
            {" Histogram for "}
            <strong>{_.get(this.props, "chartData.selectedCol")}</strong>
            <div id="describe" />
          </h4>
        </div>
      );
    }
    return [
      description,
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
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
    query: PropTypes.string,
  }),
  height: PropTypes.number,
};
ReactHistogram.defaultProps = { height: 400 };

const ReduxHistogram = connect(state => _.pick(state, ["dataId", "chartData", "error"]))(ReactHistogram);

export { ReactHistogram, ReduxHistogram as Histogram };
