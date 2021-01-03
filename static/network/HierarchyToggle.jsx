import PropTypes from "prop-types";
import React from "react";

import ButtonToggle from "../ButtonToggle";

export default class HierarchyToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hierarchy: null };
  }

  render() {
    const { updateHierarchy } = this.props;
    const options = [
      { label: "Up-Down", value: "UD" },
      { label: "Down-Up", value: "DU" },
      { label: "Left-Right", value: "LR" },
      { label: "Right-Left", value: "RL" },
    ];
    const update = value => this.setState({ hierarchy: value }, () => updateHierarchy(value));
    return (
      <div className="row pt-3">
        <div className="col">
          <b>Hierarchical Layout</b>
          <ButtonToggle options={options} update={update} defaultValue={this.state.hierarchy} allowDeselect />
        </div>
      </div>
    );
  }
}
HierarchyToggle.displayName = "HierarchyToggle";
HierarchyToggle.propTypes = { updateHierarchy: PropTypes.func };
