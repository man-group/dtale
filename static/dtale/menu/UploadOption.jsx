import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

class UploadOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={Descriptions.upload}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-file-upload" />
            <span className="font-weight-bold">Load Data</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
UploadOption.displayName = "UploadOption";
UploadOption.propTypes = {
  open: PropTypes.func,
};

export default UploadOption;
