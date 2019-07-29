import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "./Bouncer";

require("./BouncerWrapper.css");

class BouncerWrapper extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.showBouncer) {
      return (
        <div className="bouncer-wrapper">
          <Bouncer />
        </div>
      );
    }

    return this.props.children;
  }
}
BouncerWrapper.displayName = "BouncerWrapper";
BouncerWrapper.propTypes = {
  showBouncer: PropTypes.bool.isRequired,
  children: PropTypes.node,
};

export { BouncerWrapper };
