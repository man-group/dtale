import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import menuUtils from "../menuUtils";

const SORT_CHARS = { DESC: String.fromCharCode("9650"), ASC: String.fromCharCode("9660") };

class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { columnIndex, style, columns, sortInfo, propagateState, menuOpen, selectedCols, rowCount } = this.props;
    const colName = _.get(columns, [columnIndex, "name"]);
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === colName) || [null, null])[1];
    if (columnIndex == 0) {
      const menuHandler = menuUtils.openMenu(
        "gridActions",
        () => propagateState({ menuOpen: true }),
        () => propagateState({ menuOpen: false })
      );

      return (
        <div style={style}>
          <div className="crossed">
            <div className={`grid-menu ${menuOpen ? "open" : ""}`} onClick={menuHandler}>
              <span>&#8227;</span>
            </div>
            <div className="rows">{rowCount ? rowCount - 1 : 0}</div>
            <div className="cols">{columns.length ? columns.length - 1 : 0}</div>
          </div>
        </div>
      );
    }
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
Header.displayName = "Header";
Header.propTypes = {
  columnIndex: PropTypes.number,
  style: PropTypes.object,
  columns: PropTypes.arrayOf(PropTypes.object),
  sortInfo: PropTypes.arrayOf(PropTypes.array),
  propagateState: PropTypes.func,
  menuOpen: PropTypes.bool,
  selectedCols: PropTypes.arrayOf(PropTypes.string),
  rowCount: PropTypes.number,
};

export default Header;
