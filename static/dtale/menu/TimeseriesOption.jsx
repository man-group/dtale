import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class TimeseriesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:timeseries")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-schedule ml-2" />
            <span className="font-weight-bold">{this.props.t("Timeseries", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
TimeseriesOption.displayName = "TimeseriesOption";
TimeseriesOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(TimeseriesOption);
