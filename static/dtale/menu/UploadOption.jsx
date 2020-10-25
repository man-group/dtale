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
            <i className="ico-file-upload" />
            <span className="font-weight-bold">Load Data</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.upload}</div>
      </li>
    );
  }
}
UploadOption.displayName = "UploadOption";
UploadOption.propTypes = {
  open: PropTypes.func,
};

export default UploadOption;
