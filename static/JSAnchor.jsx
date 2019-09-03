import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class JSAnchor extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  }

  render() {
    return (
      <a href="#" onClick={this.handleClick} {..._.omit(this.props, ["children", "onClick"])}>
        {this.props.children}
      </a>
    );
  }
}
JSAnchor.displayName = "JSAnchor";
JSAnchor.propTypes = {
  id: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  title: PropTypes.string,
};
JSAnchor.defaultProps = { onClick: _.noop };

export { JSAnchor };
