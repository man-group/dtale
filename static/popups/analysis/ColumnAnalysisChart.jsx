import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import chartUtils from "../../chartUtils";
import { createChart, isPlotly } from "./columnAnalysisUtils";

class ColumnAnalysisChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null, id: `chart${new Date().getTime()}` };
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

  componentWillUnmount() {
    this.state.chart?.destroy?.();
  }

  createChart() {
    const { fetchedChartData, finalParams } = this.props;
    const builder = ctx => {
      if (finalParams.type === "geolocation") {
        chartUtils.createGeolocation(this.state.id, fetchedChartData);
        return null;
      }
      if (finalParams.type === "qq") {
        chartUtils.createQQ(this.state.id, fetchedChartData);
        return null;
      }
      if (!_.get(fetchedChartData, "data", []).length && !_.get(fetchedChartData, "targets", []).length) {
        return null;
      }
      return createChart(ctx, fetchedChartData, finalParams);
    };
    const chart = chartUtils.chartWrapper(this.state.id, this.state.chart, builder);
    this.setState({ chart });
  }

  render() {
    const plotly = isPlotly(this.props.finalParams?.type);
    return (
      <div style={{ height: this.props.height }}>
        {plotly && <div id={this.state.id} />}
        {!plotly && <canvas id={this.state.id} />}
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
