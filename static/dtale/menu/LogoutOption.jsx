import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { MenuItem } from "./MenuItem";

class ReactLogoutOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { auth, username, open, t } = this.props;
    if (auth) {
      return (
        <MenuItem description={t("menu_description:logout")} onClick={open}>
          <span className="toggler-action">
            <button className="btn btn-plain">
              <i className="fas fa-sign-out-alt ml-2 mr-4" />
              <span className="font-weight-bold">{`${t("Logout", {
                ns: "menu",
              })}, ${username}`}</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return null;
  }
}
ReactLogoutOption.displayName = "ReactLogoutOption";
ReactLogoutOption.propTypes = {
  auth: PropTypes.bool,
  username: PropTypes.string,
  open: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedLogoutOption = withTranslation(["menu", "menu_description"])(ReactLogoutOption);
const ReduxLogoutOption = connect(({ auth, username }) => ({ auth, username }))(TranslatedLogoutOption);
export { ReduxLogoutOption as LogoutOption, TranslatedLogoutOption as ReactLogoutOption };
