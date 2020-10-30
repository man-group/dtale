import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import menuUtils from "../../menuUtils";
import { exports as gu } from "../gridUtils";

class ReactDataViewerMenuHolder extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { style, propagateState, menuOpen, rowCount, darkMode, columns, backgroundMode } = this.props;
    const activeCols = gu.getActiveCols({ columns, backgroundMode });
    const menuHandler = menuUtils.openMenu(
      "gridActions",
      () => propagateState({ menuOpen: true }),
      () => propagateState({ menuOpen: false }),
      "div.menu-toggle"
    );
    return (
      <div style={style} className="menu-toggle">
        <div className="crossed">
          <div
            className={`grid-menu ${menuOpen ? "open" : ""}`}
            style={{ background: darkMode ? "black" : "white" }}
            onClick={menuHandler}>
            <span>&#8227;</span>
          </div>
          <div className="rows">{rowCount ? rowCount - 1 : 0}</div>
          <div className="cols">{activeCols.length ? activeCols.length - 1 : 0}</div>
        </div>
      </div>
    );
  }
}
ReactDataViewerMenuHolder.displayName = "ReactDataViewerMenuHolder";
ReactDataViewerMenuHolder.propTypes = {
  style: PropTypes.object,
  darkMode: PropTypes.bool,
  columns: PropTypes.arrayOf(PropTypes.object),
  backgroundMode: PropTypes.string,
  menuOpen: PropTypes.bool,
  rowCount: PropTypes.number,
  propagateState: PropTypes.func,
};

const ReduxDataViewerMenuHolder = connect(({ darkMode }) => ({ darkMode }))(ReactDataViewerMenuHolder);
export { ReduxDataViewerMenuHolder as DataViewerMenuHolder, ReactDataViewerMenuHolder };
