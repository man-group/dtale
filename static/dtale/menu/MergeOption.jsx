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
      <MenuItem description={Descriptions.merge}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-object-group pl-3 pr-3" />
            <span className="font-weight-bold">Merge & Stack</span>
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
