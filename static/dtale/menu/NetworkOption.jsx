import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";

class NetworkOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-project-diagram ml-2 mr-4" />
            <span className="font-weight-bold">Network Viewer</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.network}</div>
      </li>
    );
  }
}
NetworkOption.displayName = "NetworkOption";
NetworkOption.propTypes = {
  open: PropTypes.func,
};

export default NetworkOption;
