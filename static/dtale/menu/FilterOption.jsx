import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class FilterOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:filter")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fa fa-filter ml-2 mr-4" />
            <span className="font-weight-bold">{this.props.t("Custom Filter", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
FilterOption.displayName = "FilterOption";
FilterOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(FilterOption);
