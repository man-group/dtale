import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class ButtonToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { active: props.defaultValue };
  }

  componentDidUpdate() {
    if (this.props.defaultValue !== this.state.active) {
      this.setState({ active: this.props.defaultValue });
    }
  }

  render() {
    const { options, update, className } = this.props;
    return (
      <div className={`btn-group compact col-auto ${className ?? ""}`}>
        {_.map(options, ({ label, value }) => {
          const buttonProps = { className: "btn" };
          if (value === this.state.active) {
            buttonProps.className += " btn-primary active";
            if (this.props.allowDeselect) {
              buttonProps.onClick = () => this.setState({ active: null }, () => update(null));
            }
          } else {
            buttonProps.className += " btn-primary inactive";
            buttonProps.onClick = () => this.setState({ active: value }, () => update(value));
          }
          return (
            <button key={value} {...buttonProps} disabled={this.props.disabled}>
              {label ?? value}
            </button>
          );
        })}
      </div>
    );
  }
}
ButtonToggle.displayName = "ButtonToggle";
ButtonToggle.propTypes = {
  options: PropTypes.array,
  update: PropTypes.func,
  defaultValue: PropTypes.string,
  allowDeselect: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
ButtonToggle.defaultProps = { allowDeselect: false };

export default ButtonToggle;
