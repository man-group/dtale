import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

class ReactMenuItem extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    return (
      <li
        className={this.props.className}
        style={this.props.style}
        ref={this.ref}
        onMouseOver={() => {
          this.props.showTooltip(this.ref.current, this.props.description);
        }}
        onMouseLeave={this.props.hideTooltip}>
        {this.props.children}
      </li>
    );
  }
}
ReactMenuItem.displayName = "MenuItem";
ReactMenuItem.propTypes = {
  children: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  showTooltip: PropTypes.func,
  hideTooltip: PropTypes.func,
};
ReactMenuItem.defaultProps = {
  className: "hoverable",
};

const ReduxMenuItem = connect(
  () => ({}),
  dispatch => ({
    showTooltip: (element, content) => dispatch({ type: "show-menu-tooltip", element, content }),
    hideTooltip: () => dispatch({ type: "hide-menu-tooltip" }),
  })
)(ReactMenuItem);

export { ReduxMenuItem as MenuItem, ReactMenuItem };
