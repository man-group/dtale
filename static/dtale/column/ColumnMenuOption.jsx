import PropTypes from "prop-types";
import React from "react";

class ColumnMenuOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.props.open}>
            <i className={this.props.iconClass} />
            <span className="font-weight-bold">{this.props.label}</span>
          </button>
        </span>
      </li>
    );
  }
}
ColumnMenuOption.displayName = "ColumnMenuOption";
ColumnMenuOption.propTypes = {
  open: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  iconClass: PropTypes.string,
};

export default ColumnMenuOption;
