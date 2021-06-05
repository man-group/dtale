import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import chartUtils from "../../chartUtils";
import { createChart, isPlotly } from "./columnAnalysisUtils";

class ColumnAnalysisChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null };
    this.createChart = this.createChart.bind(this);
  }

  componentDidMount() {
    this.createChart();
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props, newProps);
  }

  componentDidUpdate() {
    this.createChart();
  }

  createChart() {
    const { fetchedChartData, finalParams } = this.props;
    const builder = ctx => {
      if (finalParams.type === "geolocation") {
        chartUtils.createGeolocation("columnAnalysisChart", fetchedChartData);
        return null;
      }
      if (finalParams.type === "qq") {
        chartUtils.createQQ("columnAnalysisChart", fetchedChartData);
        return null;
      }
      if (!_.get(fetchedChartData, "data", []).length && !_.get(fetchedChartData, "targets", []).length) {
        return null;
      }
      return createChart(ctx, fetchedChartData, finalParams);
    };
    const chart = chartUtils.chartWrapper("columnAnalysisChart", this.state.chart, builder);
    this.setState({ chart });
  }

  render() {
    const plotly = isPlotly(this.props.finalParams?.type);
    return (
      <div style={{ height: this.props.height }}>
        {plotly && <div id="columnAnalysisChart" />}
        {!plotly && <canvas id="columnAnalysisChart" />}
      </div>
    );
  }
}
ColumnAnalysisChart.displayName = "ColumnAnalysisChart";
ColumnAnalysisChart.propTypes = {
  fetchedChartData: PropTypes.object,
  finalParams: PropTypes.object,
  height: PropTypes.number,
};
ColumnAnalysisChart.defaultProps = { height: 400 };

export default ColumnAnalysisChart;
