import PropTypes from "prop-types";
import React from "react";

import app from "../../reducers/dtale";
import Descriptions from "../menu-descriptions.json";

class InstancesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const processCt = app.getHiddenValue("processes");
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-apps" />
            <span className="font-weight-bold">
              {"Instances "}
              <span className="badge badge-secondary">{processCt}</span>
            </span>
          </button>
        </span>
        <div className="hoverable__content menu-description">
          <span>{Descriptions.instances}</span>
        </div>
      </li>
    );
  }
}
InstancesOption.displayName = "InstancesOption";
InstancesOption.propTypes = {
  open: PropTypes.func,
};

export default InstancesOption;
