import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class CleanOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("builders:cleaning")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fas fa-pump-soap ml-3 mr-4" />
            <span className="font-weight-bold">{this.props.t("Clean Column", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
CleanOption.displayName = "CleanOption";
CleanOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "builders"])(CleanOption);
