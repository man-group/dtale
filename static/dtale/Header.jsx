import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Draggable from "react-draggable";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import actions from "../actions/dtale";
import menuUtils from "../menuUtils";
import bu from "./backgroundUtils";
import { ignoreMenuClicks } from "./column/ColumnMenu";
import { exports as gu } from "./gridUtils";
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
    this.state = { drag: false };
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.resizeCol = this.resizeCol.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props, newProps);
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

  resizeCol(deltaX) {
    const { columns, columnIndex } = this.props;
    const colCfg = gu.getCol(columnIndex, this.props);
    const width = _.max([colCfg.width + deltaX, 10]);
    const updatedColumns = _.map(columns, col =>
      col.name === colCfg.name ? { ...col, width, resized: true } : { ...col }
    );
    this.props.propagateState({ columns: updatedColumns, triggerResize: true });
  }

  render() {
    const { columnIndex, style, toggleColumnMenu, hideColumnMenu, propagateState, t } = this.props;
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
    const toggleId = gu.buildToggleId(colName);
    const menuHandler = menuUtils.openMenu(
      `${colName}Actions`,
      () => toggleColumnMenu(colName, toggleId),
      () => hideColumnMenu(colName),
      `div[name='${colName}']`,
      ignoreMenuClicks
    );
    const copyHandler = buildCopyHandler(menuHandler, this.props);
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    let headerStyle = _.assignIn({}, style);
    const markupProps = buildMarkup(t, colCfg, colName, backgroundMode);
    headerStyle = { ...headerStyle, ...markupProps.headerStyle };
    const rangeClass =
      isInRowOrColumnRange(columnIndex, columnRange) || _.includes(ctrlCols, columnIndex) ? " in-range" : "";
    return (
      <div
        className={`headerCell ${toggleId}${markupProps.className}${rangeClass}`}
        style={headerStyle}
        onMouseOver={this.handleMouseOver}
        name={colName}>
        <div
          className={`text-nowrap w-100${colCfg.resized ? " resized" : ""}`}
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
          onStart={e => cancelEvents(e, () => this.setState({ drag: true }))}
          onDrag={(e, { deltaX }) => cancelEvents(e, () => this.resizeCol(deltaX))}
          onStop={e => cancelEvents(e, () => this.setState({ drag: false }))}
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
  t: PropTypes.func,
};
const TranslateReactHeader = withTranslation("main")(ReactHeader);
const ReduxHeader = connect(
  ({ dataId }) => ({ dataId }),
  dispatch => ({
    toggleColumnMenu: (colName, toggleId) => dispatch(actions.toggleColumnMenu(colName, toggleId)),
    hideColumnMenu: colName => dispatch(actions.hideColumnMenu(colName)),
  })
)(TranslateReactHeader);

export { ReduxHeader as Header, TranslateReactHeader as ReactHeader };
