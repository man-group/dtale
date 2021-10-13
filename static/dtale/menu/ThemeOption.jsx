import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as actions from "../../actions/dtale";
import * as gu from "../gridUtils";
import serverStateManagement from "../serverStateManagement";
import { MenuItem } from "./MenuItem";

class ReactThemeOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { setTheme, theme, ribbonWrapper, t } = this.props;
    const updateTheme = newTheme => () => serverStateManagement.updateTheme(newTheme, () => setTheme(newTheme));
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:theme")}>
        <span className="toggler-action">
          <i className="fas fa-adjust" />
        </span>
        <span className="font-weight-bold pl-2">Theme</span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
          {_.map(gu.THEMES, value => (
            <button
              key={value}
              style={{ color: "#565b68" }}
              className={`btn btn-primary ${value === theme ? "active" : ""} font-weight-bold`}
              onClick={value === theme ? _.noop : ribbonWrapper(updateTheme(value))}>
              {t(_.capitalize(value), { ns: "menu" })}
            </button>
          ))}
        </div>
      </MenuItem>
    );
  }
}
ReactThemeOption.displayName = "ReactThemeOption";
ReactThemeOption.propTypes = {
  setTheme: PropTypes.func,
  theme: PropTypes.string,
  ribbonWrapper: PropTypes.func,
  t: PropTypes.func,
};
ReactThemeOption.defaultProps = { ribbonWrapper: func => func };

const TranslatedReactThemeOption = withTranslation(["menu", "menu_description"])(ReactThemeOption);
const ReduxThemeOption = connect(
  ({ theme }) => ({ theme }),
  dispatch => ({ setTheme: theme => dispatch(actions.setTheme(theme)) })
)(TranslatedReactThemeOption);

export { ReduxThemeOption as ThemeOption, TranslatedReactThemeOption as ReactThemeOption };
