import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

class ReactMenuItem extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    const { className, description, onClick, hideTooltip, showTooltip, style } = this.props;
    const props = { className, style };
    if (onClick) {
      props.onClick = () => {
        hideTooltip();
        onClick();
      };
      props.className = `${className} clickable-menu-item`;
    }
    if (description) {
      props.onMouseOver = () => showTooltip(this.ref.current, description);
      props.onMouseLeave = hideTooltip;
    }
    return (
      <li ref={this.ref} {...props}>
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
  onClick: PropTypes.func,
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
