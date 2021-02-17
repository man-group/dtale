import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import actions from "../../actions/dtale";
import serverStateManagement from "../serverStateManagement";
import { MenuItem } from "./MenuItem";

class ReactLanguageOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { setLanguage, language, t, i18n } = this.props;
    const updateLanguage = newLanguage => () =>
      serverStateManagement.updateLanguage(newLanguage, () => {
        setLanguage(newLanguage);
        i18n.changeLanguage(newLanguage);
      });
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:language")}>
        <span className="toggler-action">
          <i className="fas fa-adjust" />
        </span>
        <span className="font-weight-bold pl-2">Language</span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
          {_.map(["en", "cn"], value => (
            <button
              key={value}
              style={{ color: "#565b68" }}
              className={`btn btn-primary ${value === language ? "active" : ""} font-weight-bold`}
              onClick={value === language ? _.noop : updateLanguage(value)}>
              {t(`menu:${value}`)}
            </button>
          ))}
        </div>
      </MenuItem>
    );
  }
}
ReactLanguageOption.displayName = "ReactLanguageOption";
ReactLanguageOption.propTypes = {
  setLanguage: PropTypes.func,
  language: PropTypes.string,
  t: PropTypes.func,
  i18n: PropTypes.object,
};

const TranslatedReactLanguageOption = withTranslation(["menu", "menu_description"])(ReactLanguageOption);
const ReduxLanguageOption = connect(
  ({ language }) => ({ language }),
  dispatch => ({
    setLanguage: language => dispatch(actions.setLanguage(language)),
  })
)(TranslatedReactLanguageOption);

export { ReduxLanguageOption as LanguageOption, TranslatedReactLanguageOption as ReactLanguageOption };
