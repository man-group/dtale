import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

require("./LowVarianceOption.css");

class LowVarianceOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { toggleLowVarianceBackground, backgroundMode, t } = this.props;
    const iconClass = `ico-check-box${backgroundMode == "lowVariance" ? "" : "-outline-blank"}`;
    return (
      <MenuItem
        className="hoverable low-variance"
        description={
          <>
            <span>{t("menu_description:low_variance_1")}</span>
            <ul className="low-variance-conditions">
              <li>{t("menu_description:low_variance_2")}</li>
              <li>{t("menu_description:low_variance_3")}</li>
            </ul>
            <span>{t("menu_description:low_variance_4")}</span>
          </>
        }
        onClick={toggleLowVarianceBackground}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className={iconClass} style={{ marginTop: "-.25em" }} />
            <span className="font-weight-bold">{t("Low Variance Flag", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
LowVarianceOption.displayName = "LowVarianceOption";
LowVarianceOption.propTypes = {
  backgroundMode: PropTypes.string,
  toggleLowVarianceBackground: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(LowVarianceOption);
