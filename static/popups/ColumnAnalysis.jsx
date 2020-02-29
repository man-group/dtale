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
import { findColType } from "../dtale/gridUtils";
import { fetchJson } from "../fetcher";
import { renderCodePopupAnchor } from "./CodePopup";

const BASE_ANALYSIS_URL = "/dtale/column-analysis";
const DESC_PROPS = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];

function createColumnAnalysis(ctx, fetchedData, col, type) {
  const { desc, labels, data } = fetchedData;
  if (desc) {
    const descHTML = _.map(DESC_PROPS, p => `${_.capitalize(p)}: <b>${desc[p]}</b>`).join(", ");
    $("#describe").html(`<small>${descHTML}</small>`);
  } else {
    $("#describe").empty();
  }
  return chartUtils.createChart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: col, data: data, backgroundColor: "rgb(42, 145, 209)" }],
    },
    options: {
      legend: { display: false },
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: type === "histogram" ? "Bin" : "Value",
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

class ReactColumnAnalysis extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null, bins: "20", type: null, dtype: null };
    this.buildAnalysisFilters = this.buildAnalysisFilters.bind(this);
    this.buildAnalysis = this.buildAnalysis.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const updateState = ["bins", "dtype", "type", "error"];
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
    this.buildAnalysis();
  }

  buildAnalysisFilters() {
    let chartTypeToggle = null,
      chartTitle = null;
    const colType = findColType(this.state.dtype);
    if (colType === "int") {
      chartTypeToggle = (
        <div className="col-auto btn-group">
          {_.map(
            [
              ["Histogram", "histogram"],
              ["Value Counts", "value_counts"],
            ],
            ([label, value]) => {
              const buttonProps = { className: "btn" };
              if (value === this.state.type) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.setState({ type: value }, this.buildAnalysis);
              }
              return (
                <button key={value} {...buttonProps}>
                  {label}
                </button>
              );
            }
          )}
        </div>
      );
    } else {
      chartTitle = (
        <h4 className="modal-title font-weight-bold">
          {this.state.type === "histogram" ? "Histogram" : "Value Counts"}
        </h4>
      );
    }
    let binFilter = null;
    if (_.includes(["int", "float"], colType) && this.state.type === "histogram") {
      const updateBins = e => {
        if (e.key === "Enter") {
          if (this.state.bins && parseInt(this.state.bins)) {
            this.buildAnalysis();
          }
          e.preventDefault();
        }
      };
      binFilter = [
        <div key={0} className="col-auto text-center">
          <div>
            <b>Bins</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>(Please edit)</small>
          </div>
        </div>,
        <div key={1} style={{ width: "3em" }} data-tip="Press ENTER to submit" className="mb-auto mt-auto">
          <input
            type="text"
            className="form-control text-center"
            value={this.state.bins}
            onChange={e => this.setState({ bins: e.target.value })}
            onKeyPress={updateBins}
          />
        </div>,
      ];
    }
    return (
      <div className="form-group row small-gutters mb-0">
        <div className="col-md-5 row">
          {chartTypeToggle}
          {binFilter}
        </div>
        <div className="col-md-2 text-center">{chartTitle}</div>
        <div className="col-md-5 text-right">
          <div style={{ marginRight: "-30px" }}>{renderCodePopupAnchor(this.state.code, "Histogram")}</div>
        </div>
      </div>
    );
  }

  buildAnalysis() {
    const { selectedCol } = this.props.chartData;
    const paramProps = ["selectedCol", "query", "bins", "type"];
    const params = _.assignIn({}, this.props.chartData, {
      bins: this.state.bins,
      type: this.state.type,
    });
    const url = `${BASE_ANALYSIS_URL}/${this.props.dataId}?${qs.stringify(buildURLParams(params, paramProps))}`;
    fetchJson(url, fetchedChartData => {
      const newState = { error: null };
      if (_.get(fetchedChartData, "error")) {
        newState.error = <RemovableError {...fetchedChartData} />;
      }
      newState.code = _.get(fetchedChartData, "code", "");
      newState.dtype = _.get(fetchedChartData, "dtype", "");
      newState.type = _.get(fetchedChartData, "chart_type", "histogram");
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data", []).length) {
          return null;
        }
        return createColumnAnalysis(ctx, fetchedChartData, selectedCol, newState.type);
      };
      newState.chart = chartUtils.chartWrapper("columnAnalysisChart", this.state.chart, builder);
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
            {` ${this.state.type === "histogram" ? "Histogram" : "Value Counts"} for `}
            <strong>{_.get(this.props, "chartData.selectedCol")}</strong>
            <div id="describe" />
          </h4>
        </div>
      );
    }
    return [
      description,
      <div key="inputs" className="modal-body modal-form">
        {this.buildAnalysisFilters()}
      </div>,
      <div key="body" className="modal-body">
        <canvas id="columnAnalysisChart" height={this.props.height} />
      </div>,
    ];
  }
}
ReactColumnAnalysis.displayName = "ColumnAnalysis";
ReactColumnAnalysis.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    selectedCol: PropTypes.string,
    query: PropTypes.string,
  }),
  height: PropTypes.number,
};
ReactColumnAnalysis.defaultProps = { height: 400 };

const ReduxColumnAnalysis = connect(state => _.pick(state, ["dataId", "chartData", "error"]))(ReactColumnAnalysis);

export { ReactColumnAnalysis, ReduxColumnAnalysis as ColumnAnalysis };
