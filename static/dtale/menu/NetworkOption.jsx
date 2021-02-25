import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

class NetworkOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={Descriptions.network}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-project-diagram ml-2 mr-4" />
            <span className="font-weight-bold">Network Viewer</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
NetworkOption.displayName = "NetworkOption";
NetworkOption.propTypes = {
  open: PropTypes.func,
};

export default NetworkOption;
