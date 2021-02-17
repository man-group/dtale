import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class UploadOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={this.props.t("menu_description:upload")}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-file-upload" />
            <span className="font-weight-bold">{this.props.t("menu:Load Data")}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
UploadOption.displayName = "UploadOption";
UploadOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(UploadOption);
