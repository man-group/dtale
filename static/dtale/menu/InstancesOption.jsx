import PropTypes from "prop-types";
import React from "react";

import app from "../../reducers/dtale";
import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

class InstancesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const processCt = app.getHiddenValue("processes");
    return (
      <MenuItem description={Descriptions.instances}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-apps" />
            <span className="font-weight-bold">
              {"Instances "}
              <span className="badge badge-secondary">{processCt}</span>
            </span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
InstancesOption.displayName = "InstancesOption";
InstancesOption.propTypes = {
  open: PropTypes.func,
};

export default InstancesOption;
