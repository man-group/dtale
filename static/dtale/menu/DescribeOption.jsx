import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";

class DescribeOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-view-column" />
            <span className="font-weight-bold">Describe</span>
          </button>
        </span>
        <div className="hoverable__content menu-description">{Descriptions.describe}</div>
      </li>
    );
  }
}
DescribeOption.displayName = "DescribeOption";
DescribeOption.propTypes = {
  open: PropTypes.func,
};

export default DescribeOption;
