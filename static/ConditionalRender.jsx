import PropTypes from "prop-types";
import React from "react";

class ConditionalRender extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.display) {
      return this.props.children;
    }
    return null;
  }
}
ConditionalRender.displayName = "ConditionalRender";
ConditionalRender.propTypes = {
  display: PropTypes.bool.isRequired,
  children: PropTypes.node,
};

export default ConditionalRender;
