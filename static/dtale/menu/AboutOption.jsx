import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class AboutOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:about")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fa fa-info-circle la-lg mr-4 ml-1" />
            <span className="font-weight-bold">{this.props.t("About", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
AboutOption.displayName = "AboutOption";
AboutOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(AboutOption);
