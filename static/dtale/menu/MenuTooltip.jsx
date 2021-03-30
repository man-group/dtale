import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

class ReactMenuTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: { display: "none" },
      lastElementTop: null,
      bottom: false,
    };
    this.tooltip = React.createRef();
    this.computeStyle = this.computeStyle.bind(this);
    this.checkForWindowEdge = this.checkForWindowEdge.bind(this);
  }

  computeStyle() {
    if (this.props.visible) {
      const rect = this.props.element.getBoundingClientRect();
      const top = rect.top - (this.props.menuPinned ? 0 : rect.height - 26);
      this.setState(
        {
          style: {
            display: "block",
            top: top,
            left: rect.left + rect.width + 8, // 8 = width of tooltip caret
          },
          lastElementRect: rect,
        },
        this.checkForWindowEdge
      );
    } else {
      this.setState({
        style: { display: "none" },
        lastElementTop: null,
        bottom: false,
      });
    }
  }

  checkForWindowEdge() {
    const rect = this.state.lastElementRect;
    let top = rect.top - (this.props.menuPinned ? 0 : rect.height - 26);
    const tooltipRect = this.tooltip.current.getBoundingClientRect();
    // handle the case when you're getting close to the bottom of the screen.
    if (top + tooltipRect.height > window.innerHeight) {
      top = rect.top - tooltipRect.height - rect.height / 3;
      this.setState({
        style: { ...this.state.style, top: `calc(${top}px + 2em)` },
        bottom: true,
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible !== prevProps.visible) {
      this.computeStyle();
    }
  }

  render() {
    return (
      <div
        className={`hoverable__content menu-description${this.state.bottom ? " bottom" : ""}`}
        style={this.state.style}
        ref={this.tooltip}>
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
  menuPinned: PropTypes.bool,
};

const ReduxMenuTooltip = connect(({ menuTooltip, menuPinned }) => ({
  ...menuTooltip,
  menuPinned,
}))(ReactMenuTooltip);

export { ReduxMenuTooltip as MenuTooltip, ReactMenuTooltip };
