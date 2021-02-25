import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

class DuplicatesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={Descriptions.duplicates}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-clone ml-2 mr-4" />
            <span className="font-weight-bold">Duplicates</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
DuplicatesOption.displayName = "DuplicatesOption";
DuplicatesOption.propTypes = {
  open: PropTypes.func,
};

export default DuplicatesOption;
