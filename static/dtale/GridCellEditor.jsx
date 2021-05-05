import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import * as gu from "./gridUtils";
import serverState from "./serverStateManagement";

class ReactGridCellEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value || "" };
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentDidMount() {
    $(this._input).keydown(this.onKeyDown);
    $(this._input).focus();
  }

  onKeyDown(e) {
    if (e.key === "Enter") {
      const { gridState, colCfg, rowIndex, propagateState, dataId, settings, maxColumnWidth } = this.props;
      if (this.props.value === this.state.value) {
        this.props.clearEdit();
        return;
      }
      const { data, columns, columnFormats } = gridState;
      const callback = editData => {
        if (editData.error) {
          this.props.openChart({ ...editData, type: "error" });
          return;
        }
        const updatedData = _.cloneDeep(data);
        updatedData[rowIndex - 1][colCfg.name] = gu.buildDataProps(colCfg, this.state.value, {
          columnFormats,
          settings,
        });
        const width = gu.calcColWidth(colCfg, {
          ...gridState,
          ...settings,
          maxColumnWidth,
        });
        const updatedColumns = _.map(columns, c => ({
          ...c,
          ...(c.name === colCfg.name ? width : {}),
        }));
        propagateState({ columns: updatedColumns, data: updatedData, triggerResize: true }, this.props.clearEdit);
      };
      serverState.editCell(dataId, colCfg.name, rowIndex - 1, this.state.value, callback);
    } else if (e.key === "Escape") {
      this.props.clearEdit();
    }
  }

  render() {
    return (
      <input
        ref={i => (this._input = i)}
        style={{ background: "lightblue", width: "inherit" }}
        type="text"
        value={this.state.value}
        onChange={e => this.setState({ value: e.target.value })}
      />
    );
  }
}
ReactGridCellEditor.propTypes = {
  value: PropTypes.node,
  colCfg: PropTypes.object,
  rowIndex: PropTypes.number,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  clearEdit: PropTypes.func,
  dataId: PropTypes.string,
  gridState: PropTypes.shape({
    data: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.object),
    sortInfo: PropTypes.arrayOf(PropTypes.array),
    columnFormats: PropTypes.object,
  }),
  settings: PropTypes.object,
  maxColumnWidth: PropTypes.number,
};
const ReduxGridCellEditor = connect(
  ({ dataId, editedCell, settings, maxColumnWidth }) => ({
    dataId,
    editedCell,
    settings,
    maxColumnWidth,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
  })
)(ReactGridCellEditor);

export { ReactGridCellEditor, ReduxGridCellEditor as GridCellEditor };
