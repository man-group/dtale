import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class ReloadOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:reload_data")} onClick={() => window.location.reload()}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-sync" />
            <span className="font-weight-bold">{this.props.t("Reload Data", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReloadOption.displayName = "ReloadOption";
ReloadOption.propTypes = {
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(ReloadOption);
