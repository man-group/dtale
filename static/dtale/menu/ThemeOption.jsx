import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../../actions/dtale";
import { exports as gu } from "../gridUtils";
import Descriptions from "../menu-descriptions.json";
import serverStateManagement from "../serverStateManagement";

class ReactThemeOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { setTheme, theme } = this.props;
    const updateTheme = newTheme => () => serverStateManagement.updateTheme(newTheme, () => setTheme(newTheme));
    return (
      <li className="hoverable" style={{ color: "#565b68" }}>
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
              onClick={value === theme ? _.noop : updateTheme(value)}>
              {_.capitalize(value)}
            </button>
          ))}
        </div>
        <div className="hoverable__content menu-description">{Descriptions.theme}</div>
      </li>
    );
  }
}
ReactThemeOption.displayName = "ReactThemeOption";
ReactThemeOption.propTypes = {
  setTheme: PropTypes.func,
  theme: PropTypes.string,
};

const ReduxThemeOption = connect(
  ({ theme }) => ({ theme }),
  dispatch => ({ setTheme: theme => dispatch(actions.setTheme(theme)) })
)(ReactThemeOption);

export { ReduxThemeOption as ThemeOption, ReactThemeOption };
