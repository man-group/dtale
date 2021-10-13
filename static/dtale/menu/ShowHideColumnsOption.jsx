import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class ShowHideColumnsOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-visibility" />
            <span className="font-weight-bold">{this.props.t("show_hide", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ShowHideColumnsOption.displayName = "ShowHideColumnsOption";
ShowHideColumnsOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(ShowHideColumnsOption);
