import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";

import {
  buildCopyText,
  buildRangeState,
  buildRowCopyText,
  convertCellIdxToCoords,
  toggleSelection,
} from "./rangeSelectUtils";

function handleRangeSelect(props, cellIdx) {
  const { columns, data, rangeSelect } = props.gridState;
  if (rangeSelect) {
    const copyText = buildCopyText(data, columns, rangeSelect.start, cellIdx);
    const title = "Copy Range to Clipboard?";
    props.openChart({
      ...copyText,
      type: "copy-range",
      title,
      size: "sm",
      ...props,
    });
  } else {
    props.propagateState(buildRangeState({ rangeSelect: { start: cellIdx, end: cellIdx } }));
  }
}

function handleRowSelect(props, cellIdx) {
  const { columns, rowRange } = props.gridState;
  if (rowRange) {
    const coords = convertCellIdxToCoords(cellIdx);
    const title = "Copy Rows to Clipboard?";
    const callback = copyText =>
      props.openChart({
        ...copyText,
        type: "copy-row-range",
        title,
        size: "sm",
        ...props,
      });
    buildRowCopyText(props.dataId, columns, { start: rowRange.start, end: coords[1] }, callback);
  } else {
    const coords = convertCellIdxToCoords(cellIdx);
    props.propagateState(buildRangeState({ rowRange: { start: coords[1], end: coords[1] } }));
  }
}

function handleCtrlRowSelect(props, cellIdx) {
  const { ctrlRows } = props.gridState;
  const coords = convertCellIdxToCoords(cellIdx);
  if (ctrlRows) {
    props.propagateState(buildRangeState({ ctrlRows: toggleSelection(ctrlRows, coords[1]) }));
  } else {
    const coords = convertCellIdxToCoords(cellIdx);
    props.propagateState(buildRangeState({ ctrlRows: [coords[1]] }));
  }
}

class ReactGridEventHandler extends React.Component {
  constructor(props) {
    super(props);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleClicks = this.handleClicks.bind(this);
  }

  componentDidMount() {
    ["keyup", "keydown"].forEach(event => {
      window.addEventListener(event, e => {
        document.onselectstart = () => !(e.key === "Shift" && e.shiftKey) && e.key !== "Meta";
      });
    });
  }

  handleMouseOver(e) {
    const { rangeSelect, rowRange } = this.props.gridState;
    const rangeExists = rangeSelect && rangeSelect.start;
    const rowRangeExists = rowRange && rowRange.start;
    const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
    if (e.shiftKey) {
      if (rangeExists) {
        if (cellIdx && !_.startsWith(cellIdx, "0|") && !_.endsWith(cellIdx, "|0")) {
          this.props.propagateState(
            buildRangeState({
              rangeSelect: { ...rangeSelect, end: cellIdx ?? null },
            })
          );
        }
      }
      if (rowRangeExists) {
        if (cellIdx && _.startsWith(cellIdx, "0|")) {
          const coords = convertCellIdxToCoords(cellIdx);
          this.props.propagateState(buildRangeState({ rowRange: { ...rowRange, end: coords[1] } }));
        }
      }
    } else if (rangeExists || rowRangeExists) {
      this.props.propagateState(buildRangeState());
    }
  }

  handleClicks(e) {
    // check for range selected
    const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
    if (e.shiftKey) {
      if (cellIdx && !_.startsWith(cellIdx, "0|") && !_.endsWith(cellIdx, "|0")) {
        handleRangeSelect(this.props, cellIdx);
      } else if (cellIdx && _.startsWith(cellIdx, "0|")) {
        handleRowSelect(this.props, cellIdx);
      }
      return;
    } else if (e.ctrlKey || e.metaKey) {
      if (cellIdx && _.startsWith(cellIdx, "0|")) {
        handleCtrlRowSelect(this.props, cellIdx);
      }
      return;
    }

    if (this.props.allowCellEdits) {
      if (this.clickTimeout === null) {
        this.clickTimeout = setTimeout(() => {
          clearTimeout(this.clickTimeout);
          this.clickTimeout = null;
        }, 2000);
      } else {
        const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
        if (cellIdx) {
          this.props.editCell(cellIdx);
        }
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }
    }
    this.props.propagateState(buildRangeState());
  }

  render() {
    return (
      <div className="h-100 w-100" onMouseOver={this.handleMouseOver} onClick={this.handleClicks}>
        {this.props.children}
      </div>
    );
  }
}
ReactGridEventHandler.displayName = "ReactGridEventHandler";
ReactGridEventHandler.propTypes = {
  dataId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  gridState: PropTypes.shape({
    rangeSelect: PropTypes.object,
    rowRange: PropTypes.object,
    ctrlRows: PropTypes.arrayOf(PropTypes.number),
    ctrlCols: PropTypes.arrayOf(PropTypes.number),
    columns: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.object,
  }),
  propagateState: PropTypes.func,
  children: PropTypes.node,
  allowCellEdits: PropTypes.bool,
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  editCell: PropTypes.func,
};

const ReduxGridEventHandler = connect(
  ({ allowCellEdits, dataId }) => ({ allowCellEdits, dataId }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    editCell: editedCell => dispatch({ type: "edit-cell", editedCell }),
  })
)(ReactGridEventHandler);

export { ReduxGridEventHandler as GridEventHandler, ReactGridEventHandler };
