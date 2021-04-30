import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../actions/charts";
import { MeasureText } from "./MeasureText";
import { MenuTooltip } from "./menu/MenuTooltip";

import {
  buildCopyText,
  buildRangeState,
  buildRowCopyText,
  convertCellIdxToCoords,
  toggleSelection,
} from "./rangeSelectUtils";

import { SidePanel } from "./side/SidePanel";

function handleRangeSelect(props, cellIdx) {
  const { columns, data, rangeSelect } = props.gridState;
  if (rangeSelect) {
    const copyText = buildCopyText(data, columns, rangeSelect.start, cellIdx);
    const title = props.t("Copy Range to Clipboard?");
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
    const title = props.t("Copy Rows to Clipboard?");
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
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClicks = this.handleClicks.bind(this);
    this.state = { currY: null };
  }

  componentDidMount() {
    ["keyup", "keydown"].forEach(event => {
      window.addEventListener(event, e => {
        document.onselectstart = () => !(e.key === "Shift" && e.shiftKey) && e.key !== "Meta";
      });
    });
  }

  handleMouseMove(e) {
    if (e.clientY <= 5) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
      if (!this.props.ribbonMenuOpen) {
        this.showTimeout = setTimeout(() => {
          if (this.state.currY <= 5) {
            this.props.setRibbonVisibility(true);
          }
        }, 500);
      }
    } else if (!this.props.ribbonDropdownOpen && this.props.ribbonMenuOpen && e.clientY >= 35 && !this.hideTimeout) {
      this.hideTimeout = setTimeout(() => {
        this.props.setRibbonVisibility(false);
        this.hideTimeout = null;
      }, 2000);
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.setState({ currY: e.clientY });
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
    this.props.setRibbonVisibility(false);
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
    const { sidePanel, sidePanelOpen, menuPinned } = this.props;
    return (
      <div className={`h-100 w-100 d-flex ${menuPinned ? "is-pinned" : ""}`}>
        <div
          className={`main-panel-content${sidePanelOpen ? " is-half" : ""} ${sidePanel ?? ""} h-100 d-flex`}
          onMouseOver={this.handleMouseOver}
          onMouseMove={this.handleMouseMove}
          onClick={this.handleClicks}>
          {this.props.children}
        </div>
        <MenuTooltip />
        <MeasureText />
        <SidePanel />
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
  setRibbonVisibility: PropTypes.func,
  ribbonMenuOpen: PropTypes.bool,
  ribbonDropdownOpen: PropTypes.bool,
  sidePanelOpen: PropTypes.bool,
  sidePanel: PropTypes.string,
  menuPinned: PropTypes.bool,
  t: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
};
const TranslateReactGridEventHandler = withTranslation("main")(ReactGridEventHandler);
const ReduxGridEventHandler = connect(
  ({ allowCellEdits, dataId, ribbonMenuOpen, ribbonDropdown, sidePanel, menuPinned }) => ({
    allowCellEdits,
    dataId,
    ribbonMenuOpen,
    menuPinned,
    ribbonDropdownOpen: ribbonDropdown.visible,
    sidePanelOpen: sidePanel.visible,
    sidePanel: sidePanel.view,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    editCell: editedCell => dispatch({ type: "edit-cell", editedCell }),
    setRibbonVisibility: show => dispatch({ type: `${show ? "show" : "hide"}-ribbon-menu` }),
  })
)(TranslateReactGridEventHandler);

export { ReduxGridEventHandler as GridEventHandler, TranslateReactGridEventHandler as ReactGridEventHandler };
