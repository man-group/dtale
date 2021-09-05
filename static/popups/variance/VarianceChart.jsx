import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { dataLoader } from "../analysis/columnAnalysisUtils";
import TextEnterFilter from "../analysis/filters/TextEnterFilter";

class VarianceChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null, bins: "20" };
    this.createChart = this.createChart.bind(this);
  }

  componentDidMount() {
    this.createChart();
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const updateState = ["error", "bins", "chart"];
    if (!_.isEqual(_.pick(this.state, updateState), _.pick(newState, updateState))) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props, prevProps)) {
      this.createChart();
    }
  }

  createChart() {
    const propagateState = state => this.setState(state);
    dataLoader(this.props, this.state, propagateState, {
      type: "histogram",
      bins: this.state.bins,
    });
  }

  render() {
    const propagateState = state => this.setState(state);
    return (
      <React.Fragment>
        <div className="form-group row small-gutters mb-3 mt-3">
          <div className="col row">
            <div style={{ fontSize: 16 }} className="col font-weight-bold m-auto">
              {this.props.t("HISTOGRAM")}
            </div>
            <TextEnterFilter
              {...{
                prop: "bins",
                buildChart: this.createChart,
                dtype: "float64",
                propagateState,
                defaultValue: this.state.bins,
              }}
            />
            <div className="col" />
          </div>
        </div>
        {this.state.error || null}
        {this.state.chart}
      </React.Fragment>
    );
  }
}
VarianceChart.displayName = "VarianceChart";
VarianceChart.propTypes = {
  dataId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  chartData: PropTypes.shape({
    selectedCol: PropTypes.string,
  }),
  height: PropTypes.number,
  t: PropTypes.func,
  filtered: PropTypes.bool,
};
VarianceChart.defaultProps = { height: 400 };

export default withTranslation("variance")(VarianceChart);
