import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import menuFuncs from "./menu/dataViewerMenuUtils";
import { buildCtrlColumnCopyText, buildRowCopyText } from "./rangeSelectUtils";

class ReactDtaleHotkeys extends React.Component {
  constructor(props) {
    super(props);
    this.copyData = this.copyData.bind(this);
  }

  copyData() {
    const { openChart, dataId, ctrlCols, ctrlRows, columns } = this.props;
    if (ctrlRows) {
      const title = "Copy Rows to Clipboard?";
      const callback = copyText =>
        openChart({
          ...copyText,
          type: "copy-row-range",
          title,
          size: "sm",
          ...this.props,
        });
      const params = { rows: JSON.stringify(_.map(ctrlRows, idx => idx - 1)) };
      buildRowCopyText(dataId, columns, params, callback);
    } else if (ctrlCols) {
      const title = "Copy Columns to Clipboard?";
      const callback = copyText =>
        openChart({
          ...copyText,
          type: "copy-column-range",
          title,
          size: "sm",
          ...this.props,
        });
      buildCtrlColumnCopyText(dataId, columns, ctrlCols, callback);
    }
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
      COPY: ["ctrl+c", "command+c"],
    };
    const handlers = _.pick(menuFuncs.buildHotkeyHandlers(this.props), _.keys(keyMap));
    handlers.COPY = this.copyData;
    return <GlobalHotKeys keyMap={keyMap} handlers={handlers} />;
  }
}
ReactDtaleHotkeys.displayName = "DtaleHotkeys";
ReactDtaleHotkeys.propTypes = {
  dataId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  editedCell: PropTypes.string,
  propagateState: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  ctrlRows: PropTypes.arrayOf(PropTypes.number), // eslint-disable-line react/no-unused-prop-types
  ctrlCols: PropTypes.arrayOf(PropTypes.number), // eslint-disable-line react/no-unused-prop-types
  isVSCode: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
};
const ReduxDtaleHotkeys = connect(
  state => _.pick(state, ["dataId", "editedCell", "isVSCode"]),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
  })
)(ReactDtaleHotkeys);

export { ReactDtaleHotkeys, ReduxDtaleHotkeys as DtaleHotkeys };
