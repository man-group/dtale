import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";

class UploadOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="fas fa-object-group pl-3 pr-3" />
            <span className="font-weight-bold">Merge & Stack</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.merge}</div>
      </li>
    );
  }
}
UploadOption.displayName = "UploadOption";
UploadOption.propTypes = {
  open: PropTypes.func,
};

export default UploadOption;
