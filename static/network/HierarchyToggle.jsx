import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ButtonToggle from "../ButtonToggle";

class HierarchyToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hierarchy: null };
  }

  render() {
    const { updateHierarchy, t } = this.props;
    const options = [
      { label: t("Up-Down"), value: "UD" },
      { label: t("Down-Up"), value: "DU" },
      { label: t("Left-Right"), value: "LR" },
      { label: t("Right-Left"), value: "RL" },
    ];
    const update = value => this.setState({ hierarchy: value }, () => updateHierarchy(value));
    return (
      <div className="row pt-3">
        <div className="col">
          <b>{t("Hierarchical Layout")}</b>
          <ButtonToggle options={options} update={update} defaultValue={this.state.hierarchy} allowDeselect />
        </div>
      </div>
    );
  }
}
HierarchyToggle.displayName = "HierarchyToggle";
HierarchyToggle.propTypes = {
  updateHierarchy: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation("network")(HierarchyToggle);
