import qs from "querystring";

import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { RemovableError } from "../../RemovableError";
import actions from "../../actions/dtale";
import { buildURLParams } from "../../actions/url-utils";
import chartUtils from "../../chartUtils";
import { fetchJson } from "../../fetcher";
import { ColumnAnalysisFilters } from "./ColumnAnalysisFilters";
import { createChart } from "./columnAnalysisUtils";

require("./ColumnAnalysis.css");

const BASE_ANALYSIS_URL = "/dtale/column-analysis";

class ReactColumnAnalysis extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null, type: null, error: null, chartParams: null };
    this.buildAnalysis = this.buildAnalysis.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const updateState = ["type", "error", "chartParams"];
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

  buildAnalysis(chartParams) {
    const finalParams = chartParams || this.state.chartParams;
    const { selectedCol } = this.props.chartData;
    const paramProps = ["selectedCol", "bins", "top", "type", "ordinalCol", "ordinalAgg", "categoryCol", "categoryAgg"];
    const params = _.assignIn({}, this.props.chartData, _.pick(finalParams, ["bins", "top"]));
    params.type = _.get(finalParams, "type");
    if (params.type === "categories" && _.isNull(finalParams.categoryCol)) {
      return;
    }
    const subProps = params.type === "value_counts" ? ["ordinalCol", "ordinalAgg"] : ["categoryCol", "categoryAgg"];
    _.forEach(subProps, p => (params[p] = _.get(finalParams, [p, "value"])));
    const url = `${BASE_ANALYSIS_URL}/${this.props.dataId}?${qs.stringify(buildURLParams(params, paramProps))}`;
    fetchJson(url, fetchedChartData => {
      const newState = { error: null, chartParams: finalParams };
      if (_.get(fetchedChartData, "error")) {
        newState.error = <RemovableError {...fetchedChartData} />;
      }
      newState.code = _.get(fetchedChartData, "code", "");
      newState.dtype = _.get(fetchedChartData, "dtype", "");
      newState.type = _.get(fetchedChartData, "chart_type", "histogram");
      newState.query = _.get(fetchedChartData, "query");
      newState.cols = _.get(fetchedChartData, "cols", []);
      newState.top = _.get(fetchedChartData, "top", null);
      const builder = ctx => {
        if (!_.get(fetchedChartData, "data", []).length) {
          return null;
        }
        return createChart(ctx, fetchedChartData, _.assignIn(finalParams, { selectedCol, type: newState.type }));
      };
      newState.chart = chartUtils.chartWrapper("columnAnalysisChart", this.state.chart, builder);
      this.setState(newState);
    });
  }

  render() {
    let description = null;
    if (actions.isPopup()) {
      description = (
        <div key="description" className="modal-header">
          <h4 className="modal-title">
            <i className="ico-equalizer" />
            {` ${this.state.type === "histogram" ? "Histogram" : "Value Counts"} for `}
            <strong>{_.get(this.props, "chartData.selectedCol")}</strong>
            {this.state.query && <small>{this.state.query}</small>}
            <div id="describe" />
          </h4>
        </div>
      );
    }
    let filters = null;
    if (this.state.type) {
      filters = (
        <div key="inputs" className="modal-body modal-form">
          <ColumnAnalysisFilters
            {..._.pick(this.state, ["type", "cols", "dtype", "code", "top"])}
            chartType={this.state.type}
            selectedCol={_.get(this, "props.chartData.selectedCol")}
            buildChart={this.buildAnalysis}
          />
        </div>
      );
    }
    return [
      description,
      filters,
      <div key="body" className="modal-body">
        {this.state.error || null}
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

const ReduxColumnAnalysis = connect(state => _.pick(state, ["dataId", "chartData"]))(ReactColumnAnalysis);

export { ReactColumnAnalysis, ReduxColumnAnalysis as ColumnAnalysis };
