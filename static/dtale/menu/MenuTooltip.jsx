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
      const style = {
        display: "block",
        top: top,
        left: rect.left + rect.width + 8, // 8 = width of tooltip caret
      };
      this.setState({ style: style, lastElementRect: rect, bottom: false, right: false }, this.checkForWindowEdge);
    } else {
      this.setState({
        style: { display: "none" },
        lastElementTop: null,
        bottom: false,
        right: false,
      });
    }
  }

  checkForWindowEdge() {
    const rect = this.state.lastElementRect;
    let top = rect.top - (this.props.menuPinned ? 0 : rect.height - 26);
    const tooltipRect = this.tooltip.current.getBoundingClientRect();
    const style = { ...this.state.style };
    const updates = { bottom: false, right: false };
    // handle the case when you're getting close to the bottom of the screen.
    if (top + tooltipRect.height > window.innerHeight) {
      top = rect.top - tooltipRect.height - rect.height / 3;
      style.top = `calc(${top}px + 2em)`;
      updates.bottom = true;
    }
    // 320 => 20em (tooltip width)
    if (style.left + 260 > window.innerWidth) {
      style.left = rect.left - 260 - 8;
      updates.right = true;
    }
    this.setState({ style, ...updates });
  }

  componentDidUpdate(prevProps) {
    const currTop = this.props.element?.getBoundingClientRect()?.top;
    const prevTop = prevProps.element?.getBoundingClientRect()?.top;
    const currLeft = this.props.element?.getBoundingClientRect()?.left;
    const prevLeft = prevProps.element?.getBoundingClientRect()?.left;
    if (this.props.visible !== prevProps.visible || currTop !== prevTop || currLeft !== prevLeft) {
      this.computeStyle();
    }
  }

  render() {
    const { bottom, right } = this.state;
    const extraClasses = `${bottom ? " bottom" : ""}${right ? " right" : ""}`;
    return (
      <div className={`hoverable__content menu-description${extraClasses}`} style={this.state.style} ref={this.tooltip}>
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
