import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class BuildColumnOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:build")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-build" />
            <span className="font-weight-bold">{this.props.t("Dataframe Functions", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
BuildColumnOption.displayName = "BuildColumnOption";
BuildColumnOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(BuildColumnOption);
