import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { GridCellEditor } from "./GridCellEditor";
import { Header } from "./Header";
import bu from "./backgroundUtils";
import { exports as gu } from "./gridUtils";

class ReactGridCell extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { columnIndex, key, rowIndex, style, gridState, editedCell, propagateState } = this.props;
    if (rowIndex == 0) {
      return (
        <Header
          {...gridState}
          key={key}
          columnIndex={columnIndex}
          style={style}
          propagateState={this.props.propagateState}
        />
      );
    }
    const colCfg = gu.getCol(columnIndex, gridState);
    const cellIdx = `${columnIndex}|${rowIndex}`;
    if (columnIndex > 0 && cellIdx === editedCell) {
      const rec = _.get(gridState, ["data", rowIndex - 1, colCfg.name], {});
      const cellStyle = _.assignIn({}, style, { padding: 0 });
      const onMouseOver = () => {
        const tt = $("#edit-tt");
        const cell = $(this._ref);
        const { top, left } = cell.position();
        tt.css({ left: left + cell.width() + 85, top: top + 25 });
        tt.show();
      };
      const onMouseOut = () => $("#edit-tt").hide();
      return (
        <div ref={r => (this._ref = r)} className="cell" {...{ key, style: cellStyle, onMouseOver, onMouseOut }}>
          <GridCellEditor {...{ value: rec.raw, gridState, colCfg, propagateState, rowIndex }} />
        </div>
      );
    }
    let value = "-";
    let valueStyle = {};
    const divProps = {};
    if (colCfg.name) {
      const rec = _.get(gridState, ["data", rowIndex - 1, colCfg.name], {});
      value = rec.view;
      valueStyle = _.get(rec, "style", {});
      valueStyle = bu.updateBackgroundStyles(gridState, valueStyle, colCfg, rec);
      if (_.includes(["string", "date"], gu.findColType(colCfg.dtype)) && rec.raw !== rec.view) {
        divProps.title = rec.raw;
      }
      divProps.cell_idx = cellIdx;
    }
    return (
      <div
        key={key}
        className={`cell${this.props.allowCellEdits ? " editable" : ""}`}
        style={_.assignIn({}, style, valueStyle)}
        {...divProps}>
        {value}
      </div>
    );
  }
}
ReactGridCell.displayName = "GridCell";
ReactGridCell.propTypes = {
  columnIndex: PropTypes.number,
  rowIndex: PropTypes.number,
  key: PropTypes.string,
  style: PropTypes.object,
  gridState: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
    sortInfo: PropTypes.arrayOf(PropTypes.array),
    menuOpen: PropTypes.bool,
    rowCount: PropTypes.number,
    toggleColumnMenu: PropTypes.func,
    hideColumnMenu: PropTypes.func,
    backgroundMode: PropTypes.string,
    rangeHighlight: PropTypes.object,
  }),
  propagateState: PropTypes.func,
  dataId: PropTypes.string,
  editedCell: PropTypes.string,
  allowCellEdits: PropTypes.bool,
};
const ReduxGridCell = connect(
  state => ({
    dataId: state.dataId,
    editedCell: state.editedCell,
    allowCellEdits: state.allowCellEdits,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    clearEdit: () => dispatch({ type: "clear-edit" }),
  })
)(ReactGridCell);

export { ReactGridCell, ReduxGridCell as GridCell };
