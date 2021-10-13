import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { getHiddenValue } from "../../reducers/utils";
import { MenuItem } from "./MenuItem";

class InstancesOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const processCt = getHiddenValue("processes");
    return (
      <MenuItem description={this.props.t("menu_description:instances")} onClick={this.props.open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-apps" />
            <span className="font-weight-bold">
              {`${this.props.t("Instances", { ns: "menu" })} `}
              <span className="badge badge-secondary">{processCt}</span>
            </span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
InstancesOption.displayName = "InstancesOption";
InstancesOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(InstancesOption);
