import PropTypes from "prop-types";
import React from "react";

class MessageWrapper extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.showMessage) {
      return <div>{this.props.message}</div>;
    }

    return this.props.children;
  }
}
MessageWrapper.displayName = "MessageWrapper";
MessageWrapper.propTypes = {
  showMessage: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export { MessageWrapper };
