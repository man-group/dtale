import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as actions from "../../actions/dtale";
import { dataLoader } from "./columnAnalysisUtils";
import ColumnAnalysisFilters from "./filters/ColumnAnalysisFilters";

require("./ColumnAnalysis.css");

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
    const updateState = ["type", "error", "chartParams", "chart"];
    if (!_.isEqual(_.pick(this.state, updateState), _.pick(newState, updateState))) {
      return true;
    }

    // Otherwise, use the default react behavior.
    return false;
  }

  componentDidMount() {
    this.buildAnalysis();
  }

  buildAnalysis(chartParams) {
    const propagateState = state => this.setState(state);
    dataLoader(this.props, this.state, propagateState, chartParams);
  }

  render() {
    const { t } = this.props;
    let description = null;
    if (actions.isPopup()) {
      description = (
        <div key="description" className="modal-header">
          <h4 className="modal-title">
            <i className="ico-equalizer" />
            {` ${t(this.state.type === "histogram" ? "Histogram" : "Value Counts", { ns: "constants" })} `}
            {`${t("analysis:for")} `}
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
        <div key="inputs" className="modal-form">
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
        {this.state.chart}
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
  t: PropTypes.func,
};
ReactColumnAnalysis.defaultProps = { height: 400 };
const TranslateReactColumnAnalysis = withTranslation(["constants", "analysis"])(ReactColumnAnalysis);
const ReduxColumnAnalysis = connect(state => _.pick(state, ["dataId", "chartData"]))(TranslateReactColumnAnalysis);
export { TranslateReactColumnAnalysis as ReactColumnAnalysis, ReduxColumnAnalysis as ColumnAnalysis };
