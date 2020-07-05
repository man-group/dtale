import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../actions/dtale";
import menuUtils from "../menuUtils";
import bu from "./backgroundUtils";
import { ignoreMenuClicks } from "./column/ColumnMenu";
import { exports as gu } from "./gridUtils";

const SORT_CHARS = {
  ASC: String.fromCharCode("9650"),
  DESC: String.fromCharCode("9660"),
};

class ReactHeader extends React.Component {
  constructor(props) {
    super(props);
    this.renderMenu = this.renderMenu.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props, newProps);
  }

  renderMenu() {
    const { style, propagateState, menuOpen, rowCount } = this.props;
    const activeCols = gu.getActiveCols(this.props);
    const menuHandler = menuUtils.openMenu(
      "gridActions",
      () => propagateState({ menuOpen: true }),
      () => propagateState({ menuOpen: false }),
      "div.menu-toggle"
    );
    return (
      <div style={style} className="menu-toggle">
        <div className="crossed">
          <div className={`grid-menu ${menuOpen ? "open" : ""}`} onClick={menuHandler}>
            <span>&#8227;</span>
          </div>
          <div className="rows">{rowCount ? rowCount - 1 : 0}</div>
          <div className="cols">{activeCols.length ? activeCols.length - 1 : 0}</div>
        </div>
      </div>
    );
  }

  render() {
    const { columnIndex, style, sortInfo } = this.props;
    if (columnIndex == 0) {
      return this.renderMenu();
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
    let colNameMarkup = colName;
    if (this.props.backgroundMode === "dtypes") {
      headerStyle = _.assignIn(bu.dtypeHighlighting(colCfg), headerStyle);
      colNameMarkup = <div title={`DType: ${colCfg.dtype}`}>{colName}</div>;
    }
    if (this.props.backgroundMode === "missing" && colCfg.hasMissing) {
      colNameMarkup = <div title={`Missing Values: ${colCfg.hasMissing}`}>{`${bu.missingIcon}${colName}`}</div>;
    }
    if (this.props.backgroundMode === "outliers" && colCfg.hasOutliers) {
      colNameMarkup = <div title={`Outliers: ${colCfg.hasOutliers}`}>{`${bu.outlierIcon} ${colName}`}</div>;
    }
    return (
      <div className={`headerCell ${toggleId}`} style={headerStyle} onClick={menuHandler}>
        <div className="text-nowrap">
          {_.get(SORT_CHARS, sortDir, "")}
          {colNameMarkup}
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
