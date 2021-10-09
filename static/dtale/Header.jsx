import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Draggable from "react-draggable";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as actions from "../actions/dtale";
import menuUtils from "../menuUtils";
import bu from "./backgroundUtils";
import { ignoreMenuClicks } from "./column/ColumnMenu";
import * as gu from "./gridUtils";
import { DataViewerMenuHolder } from "./menu/DataViewerMenuHolder";

import { buildColumnCopyText, buildRangeState, isInRowOrColumnRange, toggleSelection } from "./rangeSelectUtils";

const SORT_CHARS = {
  ASC: String.fromCharCode("9650"),
  DESC: String.fromCharCode("9660"),
};

function buildMarkup(t, colCfg, colName, backgroundMode) {
  let headerStyle = {};
  let className = "";
  let colNameMarkup = colName;
  if (backgroundMode === "dtypes") {
    const dtypeStyle = bu.dtypeHighlighting(colCfg);
    headerStyle = _.assignIn(dtypeStyle, headerStyle);
    colNameMarkup = <div title={`DType: ${colCfg.dtype}`}>{colName}</div>;
    className = _.size(dtypeStyle) ? " background" : "";
  }
  if (backgroundMode === "missing" && colCfg.hasMissing) {
    colNameMarkup = <div title={`${t("Missing Values")}: ${colCfg.hasMissing}`}>{`${bu.missingIcon}${colName}`}</div>;
    className = " background";
  }
  if (backgroundMode === "outliers" && colCfg.hasOutliers) {
    colNameMarkup = <div title={`${t("Outliers")}: ${colCfg.hasOutliers}`}>{`${bu.outlierIcon} ${colName}`}</div>;
    className = " background";
  }
  if (backgroundMode === "lowVariance" && colCfg.lowVariance) {
    colNameMarkup = <div title={`${t("Low Variance")}: ${colCfg.lowVariance}`}>{`${bu.flagIcon} ${colName}`}</div>;
    className = " background";
  }
  return { headerStyle, colNameMarkup, className };
}

function buildCopyHandler(menuHandler, props) {
  const { columnIndex, dataId, propagateState, openChart, columns, columnRange, ctrlCols } = props;
  return e => {
    if (e.shiftKey) {
      if (columnRange) {
        const title = props.t("Copy Columns to Clipboard?");
        const callback = copyText =>
          openChart({
            ...copyText,
            type: "copy-column-range",
            title,
            size: "sm",
            ...props,
          });
        buildColumnCopyText(dataId, columns, columnRange.start, columnIndex, callback);
      } else {
        propagateState(
          buildRangeState({
            columnRange: { start: columnIndex, end: columnIndex },
          })
        );
      }
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      if (ctrlCols) {
        props.propagateState(buildRangeState({ ctrlCols: toggleSelection(ctrlCols, columnIndex) }));
      } else {
        props.propagateState(buildRangeState({ ctrlCols: [columnIndex] }));
      }
      return;
    }
    menuHandler(e);
  };
}

function cancelEvents(e, func) {
  e.preventDefault();
  e.stopPropagation();
  func();
}

class ReactHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = { drag: false, currWidth: null };
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.resizeStart = this.resizeStart.bind(this);
    this.resizeCol = this.resizeCol.bind(this);
    this.resizeStop = this.resizeStop.bind(this);
  }

  handleMouseOver(e) {
    if (this.state.drag) {
      return;
    }
    const { columnRange, columnIndex } = this.props;
    const rangeExists = columnRange && columnRange.start;
    if (e.shiftKey) {
      if (rangeExists) {
        this.props.propagateState(buildRangeState({ columnRange: { ...columnRange, end: columnIndex } }));
      }
    } else if (rangeExists) {
      this.props.propagateState(buildRangeState());
    }
  }

  resizeStart(e) {
    const { columnIndex } = this.props;
    const colCfg = gu.getCol(columnIndex, this.props);
    this.setState({ drag: true, colWidth: colCfg.width });
    this.props.updateDragResize(e.clientX);
  }

  resizeCol(e, deltaX) {
    const { colWidth } = this.state;
    const { columnIndex } = this.props;
    const colCfg = gu.getCol(columnIndex, this.props);
    const width = _.max([(colWidth || colCfg.width) + deltaX, 10]);
    this.setState({ colWidth: width });
    this.props.updateDragResize(e.clientX);
  }

  resizeStop() {
    const { colWidth } = this.state;
    const { columns, columnIndex } = this.props;
    const colCfg = gu.getCol(columnIndex, this.props);
    const updatedColumns = _.map(columns, col =>
      col.name === colCfg.name ? { ...col, width: colWidth, resized: true } : { ...col }
    );
    this.setState({ drag: false, colWidth: null }, () =>
      this.props.propagateState({
        columns: updatedColumns,
        triggerResize: true,
      })
    );
    this.props.stopDragResize();
  }

  render() {
    const { columnIndex, style, toggleColumnMenu, hideColumnMenu, propagateState, verticalHeaders, t } = this.props;
    const { columns, menuOpen, sortInfo, backgroundMode, columnRange, rowCount, ctrlCols } = this.props;
    if (columnIndex == 0) {
      return (
        <DataViewerMenuHolder
          style={style}
          columns={columns}
          backgroundMode={backgroundMode}
          menuOpen={menuOpen}
          rowCount={rowCount}
          propagateState={propagateState}
        />
      );
    }
    const colCfg = gu.getCol(columnIndex, this.props);
    const colName = _.get(colCfg, "name");
    const menuHandler = menuUtils.openMenu(
      `${escape(colName)}Actions`,
      () => toggleColumnMenu(colName),
      () => hideColumnMenu(colName),
      `div[name='${escape(colName)}']`,
      ignoreMenuClicks
    );
    const copyHandler = buildCopyHandler(menuHandler, this.props);
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    let headerStyle = _.assignIn({}, style);
    const markupProps = buildMarkup(t, colCfg, colName, backgroundMode);
    headerStyle = { ...headerStyle, ...markupProps.headerStyle };
    const rangeClass =
      isInRowOrColumnRange(columnIndex, columnRange) || _.includes(ctrlCols, columnIndex) ? " in-range" : "";
    const { colWidth, drag } = this.state;
    const classes = ["text-nowrap"];
    const textStyle = { cursor: "default" };
    if (!drag && colCfg.resized) {
      classes.push("resized");
    }
    if (verticalHeaders) {
      headerStyle.height = "inherit";
      textStyle.width = gu.getRowHeight(0, this.props, this.props) - 15;
      textStyle.textAlign = "left";
      classes.push("rotate-header");
    } else {
      classes.push("w-100");
    }
    return (
      <div
        className={`headerCell ${markupProps.className}${rangeClass}${drag ? " active-resize" : ""}`}
        style={{ ...headerStyle, ...(drag ? { width: colWidth } : {}) }}
        onMouseOver={this.handleMouseOver}
        name={escape(colName)}>
        <div
          className={_.join(classes, " ")}
          style={textStyle}
          onClick={e => {
            if (this.state.drag) {
              return;
            }
            copyHandler(e);
          }}>
          {_.get(SORT_CHARS, sortDir, "")}
          {markupProps.colNameMarkup}
        </div>
        <Draggable
          axis="x"
          defaultClassName="DragHandle"
          defaultClassNameDragging="DragHandleActive"
          onStart={e => cancelEvents(e, () => this.resizeStart(e))}
          onDrag={(e, { deltaX }) => cancelEvents(e, () => this.resizeCol(e, deltaX))}
          onStop={e => cancelEvents(e, this.resizeStop)}
          position={{ x: 0 }}
          zIndex={999}>
          <div className="DragHandleIcon">⋮</div>
        </Draggable>
      </div>
    );
  }
}
ReactHeader.displayName = "ReactHeader";
ReactHeader.propTypes = {
  dataId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  columns: PropTypes.arrayOf(PropTypes.object),
  sortInfo: PropTypes.arrayOf(PropTypes.array),
  menuOpen: PropTypes.bool,
  rowCount: PropTypes.number,
  backgroundMode: PropTypes.string,
  columnRange: PropTypes.object,
  ctrlCols: PropTypes.arrayOf(PropTypes.number),
  columnIndex: PropTypes.number,
  style: PropTypes.object,
  propagateState: PropTypes.func,
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  toggleColumnMenu: PropTypes.func,
  hideColumnMenu: PropTypes.func,
  updateDragResize: PropTypes.func,
  stopDragResize: PropTypes.func,
  verticalHeaders: PropTypes.bool,
  t: PropTypes.func,
};
const TranslateReactHeader = withTranslation("main")(ReactHeader);
const ReduxHeader = connect(
  ({ dataId, settings }) => ({ dataId, ...settings }),
  dispatch => ({
    toggleColumnMenu: colName => dispatch(actions.toggleColumnMenu(colName)),
    hideColumnMenu: colName => dispatch(actions.hideColumnMenu(colName)),
    updateDragResize: x => dispatch({ type: "drag-resize", x }),
    stopDragResize: () => dispatch({ type: "stop-resize" }),
  })
)(TranslateReactHeader);

export { ReduxHeader as Header, TranslateReactHeader as ReactHeader, SORT_CHARS };
