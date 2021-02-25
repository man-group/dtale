import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";
import { MenuItem } from "./MenuItem";

class DescribeOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MenuItem description={Descriptions.describe}>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className="ico-view-column" />
            <span className="font-weight-bold">Describe</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
DescribeOption.displayName = "DescribeOption";
DescribeOption.propTypes = {
  open: PropTypes.func,
};

export default DescribeOption;
