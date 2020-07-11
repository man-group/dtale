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
    const { options, update } = this.props;
    return (
      <div className="btn-group compact col-auto">
        {_.map(options, ({ label, value }) => {
          const buttonProps = { className: "btn" };
          if (value === this.state.active) {
            buttonProps.className += " btn-primary active";
          } else {
            buttonProps.className += " btn-primary inactive";
            buttonProps.onClick = () => this.setState({ active: value }, () => update(value));
          }
          return (
            <button key={value} {...buttonProps}>
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
};

export default ButtonToggle;
