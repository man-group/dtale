import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class CodeExportOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:code")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-code" />
            <span className="font-weight-bold">{this.props.t("Code Export", { ns: "code_export" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
CodeExportOption.displayName = "CodeExportOption";
CodeExportOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(CodeExportOption);
