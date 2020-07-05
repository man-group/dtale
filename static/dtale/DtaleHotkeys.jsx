import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import menuFuncs from "./menu/dataViewerMenuUtils";

class ReactDtaleHotkeys extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.editedCell) {
      return null;
    }
    const keyMap = {
      MENU: "shift+m",
      DESCRIBE: "shift+d",
      FILTER: "shift+f",
      BUILD: "shift+b",
      CHARTS: "shift+c",
      CODE: "shift+x",
    };
    const handlers = _.pick(menuFuncs.buildHotkeyHandlers(this.props), _.keys(keyMap));
    return <GlobalHotKeys keyMap={keyMap} handlers={handlers} />;
  }
}
ReactDtaleHotkeys.displayName = "DtaleHotkeys";
ReactDtaleHotkeys.propTypes = {
  dataId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  editedCell: PropTypes.string,
  propagateState: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
};
const ReduxDtaleHotkeys = connect(
  state => _.pick(state, ["dataId", "editedCell"]),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
  })
)(ReactDtaleHotkeys);

export { ReactDtaleHotkeys, ReduxDtaleHotkeys as DtaleHotkeys };
