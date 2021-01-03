import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

require("./Collapsible.scss");

class Collapsible extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  render() {
    const { title, content } = this.props;
    if (!content) {
      return null;
    }
    const { isOpen } = this.state;
    const onClick = () => this.setState({ isOpen: !this.state.isOpen }, this.props.onExpand ?? _.noop);
    return (
      <dl className="accordion pt-3">
        <dt className={`accordion-title${isOpen ? " is-expanded" : ""} pointer pl-3`} onClick={onClick}>
          {title}
        </dt>
        <dd className={`accordion-content${isOpen ? " is-expanded" : ""}`} onClick={onClick}>
          {content}
        </dd>
      </dl>
    );
  }
}
Collapsible.displayName = "Collapsible";
Collapsible.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  content: PropTypes.node,
  onExpand: PropTypes.func,
};

export default Collapsible;
