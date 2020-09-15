import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";

class DuplicatesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-clone ml-2 mr-4" />
            <span className="font-weight-bold">Duplicates</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.duplicates}</div>
      </li>
    );
  }
}
DuplicatesOption.displayName = "DuplicatesOption";
DuplicatesOption.propTypes = {
  open: PropTypes.func,
};

export default DuplicatesOption;
