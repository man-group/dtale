import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../actions/dtale";
import menuUtils from "../menuUtils";
import * as gu from "./gridUtils";

const SORT_CHARS = { DESC: String.fromCharCode("9650"), ASC: String.fromCharCode("9660") };

class ReactHeader extends React.Component {
  constructor(props) {
    super(props);
    this.renderMenu = this.renderMenu.bind(this);
    this.renderIframe = this.renderIframe.bind(this);
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

  renderIframe() {
    const { columnIndex, style, sortInfo } = this.props;
    const colName = _.get(gu.getCol(columnIndex, this.props), "name");
    const toggleId = gu.buildToggleId(colName);
    const menuHandler = menuUtils.openMenu(
      `${colName}Actions`,
      () => this.props.toggleColumnMenu(colName, toggleId),
      () => this.props.hideColumnMenu(colName),
      `div.${toggleId}`
    );
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    return (
      <div className={`headerCell ${toggleId}`} style={style}>
        <div onClick={menuHandler}>
          {_.get(SORT_CHARS, sortDir, "")}
          {colName}
        </div>
      </div>
    );
  }

  render() {
    const { columnIndex, style, sortInfo, propagateState, selectedCols } = this.props;
    if (columnIndex == 0) {
      return this.renderMenu();
    }
    if (this.props.iframe) {
      return this.renderIframe();
    }
    const colName = _.get(gu.getCol(columnIndex, this.props), "name");
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    const toggleCol = () => {
      if (_.includes(selectedCols, colName)) {
        propagateState({ selectedCols: _.without(selectedCols, colName) });
      } else {
        propagateState({ selectedCols: _.concat(selectedCols, [colName]) });
      }
    };
    return (
      <div className={`headerCell ${_.includes(selectedCols, colName) ? "selected" : ""}`} style={style}>
        <div style={{ cursor: "pointer" }} onClick={toggleCol}>
          {_.get(SORT_CHARS, sortDir, "")}
          {colName}
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
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  rowCount: PropTypes.number,
  iframe: PropTypes.bool,
  toggleColumnMenu: PropTypes.func,
  hideColumnMenu: PropTypes.func,
};

const ReduxHeader = connect(
  ({ iframe }) => ({ iframe }),
  dispatch => ({
    toggleColumnMenu: (colName, toggleId) => dispatch(actions.toggleColumnMenu(colName, toggleId)),
    hideColumnMenu: colName => dispatch(actions.hideColumnMenu(colName)),
  })
)(ReactHeader);

export { ReduxHeader as Header, ReactHeader };
