import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

class ReactMenuTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: { display: "none" },
    };
    this.computeStyle = this.computeStyle.bind(this);
  }

  computeStyle() {
    if (this.props.visible) {
      const rect = this.props.element.getBoundingClientRect();
      return {
        display: "block",
        top: `calc(${rect.top}px - 0.8em)`,
        left: `calc(${rect.left + rect.width}px - 0.5em)`,
      };
    }
    return { display: "none" };
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible !== prevProps.visible) {
      this.setState({ style: this.computeStyle() });
    }
  }

  render() {
    return (
      <div className="hoverable__content menu-description" style={this.state.style}>
        {this.props.content}
      </div>
    );
  }
}
ReactMenuTooltip.displayName = "MenuTooltip";
ReactMenuTooltip.propTypes = {
  visible: PropTypes.bool,
  element: PropTypes.instanceOf(Element),
  content: PropTypes.node,
};

const ReduxMenuTooltip = connect(state => state.menuTooltip)(ReactMenuTooltip);

export { ReduxMenuTooltip as MenuTooltip, ReactMenuTooltip };
