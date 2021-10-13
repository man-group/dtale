import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { MenuItem } from "./MenuItem";

class ReactShutdownOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { hideShutdown, open, t } = this.props;
    if (hideShutdown) {
      return null;
    }
    return (
      <MenuItem description={t("menu_description:shutdown")} onClick={open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fa fa-power-off ml-2 mr-4" />
            <span className="font-weight-bold">{t("Shutdown", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReactShutdownOption.displayName = "ReactShutdownOption";
ReactShutdownOption.propTypes = {
  hideShutdown: PropTypes.bool,
  open: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedShutdownOption = withTranslation(["menu", "menu_description"])(ReactShutdownOption);
const ReduxShutdownOption = connect(({ hideShutdown }) => ({ hideShutdown }))(TranslatedShutdownOption);
export { ReduxShutdownOption as ShutdownOption, TranslatedShutdownOption as ReactShutdownOption };
