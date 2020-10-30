import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../../actions/dtale";
import Descriptions from "../menu-descriptions.json";
import serverStateManagement from "../serverStateManagement";

class ReactDisplayOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { setDisplay, darkMode } = this.props;
    const updateDisplay = isDark => () => serverStateManagement.updateDisplay(isDark, () => setDisplay(isDark));
    return (
      <li className="hoverable" style={{ color: "#565b68" }}>
        <span className="toggler-action">
          <i className="fas fa-adjust" />
        </span>
        <span className="font-weight-bold pl-2">Display</span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
          {_.map(
            [
              ["Light", false],
              ["Dark", true],
            ],
            ([label, isDark]) => (
              <button
                key={label}
                style={{ color: "#565b68" }}
                className={`btn btn-primary ${isDark === darkMode ? "active" : ""} font-weight-bold`}
                onClick={isDark === darkMode ? _.noop : updateDisplay(isDark)}>
                {label}
              </button>
            )
          )}
        </div>
        <div className="hoverable__content menu-description">{Descriptions.display}</div>
      </li>
    );
  }
}
ReactDisplayOption.displayName = "ReactDisplayOption";
ReactDisplayOption.propTypes = {
  setDisplay: PropTypes.func,
  darkMode: PropTypes.bool,
};

const ReduxDisplayOption = connect(
  ({ darkMode }) => ({ darkMode }),
  dispatch => ({ setDisplay: isDark => dispatch(actions.setDisplay(isDark)) })
)(ReactDisplayOption);

export { ReduxDisplayOption as DisplayOption, ReactDisplayOption };
