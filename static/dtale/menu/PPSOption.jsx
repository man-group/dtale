import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { MenuItem } from "./MenuItem";

class ReactPPSOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { pythonVersion, open, t } = this.props;
    if (!pythonVersion || (pythonVersion[0] >= 3 && pythonVersion[1] >= 6)) {
      return (
        <MenuItem description={t("menu_description:pps")} onClick={open}>
          <span className="toggler-action">
            <button className="btn btn-plain">
              <i className="ico-bubble-chart" />
              <span className="font-weight-bold">{t("Predictive Power Score", { ns: "menu" })}</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return null;
  }
}
ReactPPSOption.displayName = "ReactPPSOption";
ReactPPSOption.propTypes = {
  pythonVersion: PropTypes.arrayOf(PropTypes.number),
  open: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedPPSOption = withTranslation(["menu", "menu_description"])(ReactPPSOption);
const ReduxPPSOption = connect(({ pythonVersion }) => ({ pythonVersion }))(TranslatedPPSOption);
export { ReduxPPSOption as PPSOption, TranslatedPPSOption as ReactPPSOption };
