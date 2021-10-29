import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class TimeseriesAnalysisOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:timeseries_analysis")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-schedule ml-2" />
            <span className="font-weight-bold">{this.props.t("Time Series Analysis", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
TimeseriesAnalysisOption.displayName = "TimeseriesAnalysisOption";
TimeseriesAnalysisOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(TimeseriesAnalysisOption);
