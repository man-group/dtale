import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class JSAnchor extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <a href="javascript:void(0)" {..._.omit(this.props, "children")}>
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
