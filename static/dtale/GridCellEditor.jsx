import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { exports as gu } from "./gridUtils";
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
    const hideTT = () => $("#edit-tt").hide();
    if (e.key === "Enter") {
      const { gridState, colCfg, rowIndex, propagateState, dataId } = this.props;
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
        updatedData[rowIndex - 1][colCfg.name] = gu.buildDataProps(colCfg, this.state.value, { columnFormats });
        const width = gu.calcColWidth(colCfg, gridState);
        const updatedColumns = _.map(columns, c => _.assignIn({}, c, c.name === colCfg.name ? { width } : {}));
        propagateState({ columns: updatedColumns, data: updatedData, triggerResize: true }, this.props.clearEdit);
      };
      hideTT();
      serverState.editCell(dataId, colCfg.name, rowIndex - 1, this.state.value, callback);
    } else if (e.key === "Escape") {
      hideTT();
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
};
const ReduxGridCellEditor = connect(
  state => ({ dataId: state.dataId, editedCell: state.editedCell }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
  })
)(ReactGridCellEditor);

export { ReactGridCellEditor, ReduxGridCellEditor as GridCellEditor };
