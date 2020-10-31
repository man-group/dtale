import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../actions/dtale";
import menuUtils from "../menuUtils";
import bu from "./backgroundUtils";
import { ignoreMenuClicks } from "./column/ColumnMenu";
import { exports as gu } from "./gridUtils";
import { DataViewerMenuHolder } from "./menu/DataViewerMenuHolder";

const SORT_CHARS = {
  ASC: String.fromCharCode("9650"),
  DESC: String.fromCharCode("9660"),
};

function buildMarkup(colCfg, colName, backgroundMode) {
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
    colNameMarkup = <div title={`Missing Values: ${colCfg.hasMissing}`}>{`${bu.missingIcon}${colName}`}</div>;
    className = " background";
  }
  if (backgroundMode === "outliers" && colCfg.hasOutliers) {
    colNameMarkup = <div title={`Outliers: ${colCfg.hasOutliers}`}>{`${bu.outlierIcon} ${colName}`}</div>;
    className = " background";
  }
  if (backgroundMode === "lowVariance" && colCfg.lowVariance) {
    colNameMarkup = <div title={`Low Variance: ${colCfg.lowVariance}`}>{`${bu.flagIcon} ${colName}`}</div>;
    className = " background";
  }
  return { headerStyle, colNameMarkup, className };
}

class ReactHeader extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props, newProps);
  }

  render() {
    const { columnIndex, style, sortInfo } = this.props;
    if (columnIndex == 0) {
      return <DataViewerMenuHolder {...this.props} />;
    }
    const colCfg = gu.getCol(columnIndex, this.props);
    const colName = _.get(colCfg, "name");
    const toggleId = gu.buildToggleId(colName);
    const menuHandler = menuUtils.openMenu(
      `${colName}Actions`,
      () => this.props.toggleColumnMenu(colName, toggleId),
      () => this.props.hideColumnMenu(colName),
      `div.${toggleId}`,
      ignoreMenuClicks
    );
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    let headerStyle = _.assignIn({}, style);
    const markupProps = buildMarkup(colCfg, colName, this.props.backgroundMode);
    headerStyle = { ...headerStyle, ...markupProps.headerStyle };
    return (
      <div className={`headerCell ${toggleId}${markupProps.className}`} style={headerStyle} onClick={menuHandler}>
        <div className="text-nowrap">
          {_.get(SORT_CHARS, sortDir, "")}
          {markupProps.colNameMarkup}
        </div>
      </div>
    );
  }
}
ReactHeader.displayName = "ReactHeader";
ReactHeader.propTypes = {
  columnIndex: PropTypes.number,
  style: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  sortInfo: PropTypes.arrayOf(PropTypes.array),
  propagateState: PropTypes.func,
  menuOpen: PropTypes.bool,
  rowCount: PropTypes.number,
  toggleColumnMenu: PropTypes.func,
  hideColumnMenu: PropTypes.func,
  backgroundMode: PropTypes.string,
};

const ReduxHeader = connect(
  () => ({}),
  dispatch => ({
    toggleColumnMenu: (colName, toggleId) => dispatch(actions.toggleColumnMenu(colName, toggleId)),
    hideColumnMenu: colName => dispatch(actions.hideColumnMenu(colName)),
  })
)(ReactHeader);

export { ReduxHeader as Header, ReactHeader };
