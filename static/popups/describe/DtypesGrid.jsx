import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import * as gu from "../../dtale/gridUtils";

require("./DtypesGrid.css");

class SortIndicator extends React.Component {
  render() {
    const { sortDirection, sortBy, dataKey } = this.props;
    if (sortBy !== dataKey || _.isNull(sortDirection)) {
      return <svg width={18} height={18} style={{ verticalAlign: "bottom" }} />;
    }
    const className = `ReactVirtualized__Table__sortableHeaderIcon--${sortDirection}`;
    return (
      <svg
        className={`ReactVirtualized__Table__sortableHeaderIcon ${className}`}
        width={18}
        height={18}
        viewBox="0 0 24 24"
        style={{ verticalAlign: "bottom" }}>
        {sortDirection === "ASC" ? <path d="M7 14l5-5 5 5z" /> : <path d="M7 10l5 5 5-5z" />}
        <path d="M0 0h24v24H0z" fill="none" />
      </svg>
    );
  }
}
SortIndicator.propTypes = {
  sortDirection: PropTypes.oneOf(["ASC", "DESC", "NONE"]),
  sortBy: PropTypes.string,
  dataKey: PropTypes.string,
};

function sortDtypes(dtypes, sortBy, sortDirection) {
  return _.orderBy(dtypes, [sortBy], [sortDirection.toLowerCase()]);
}

function buildSortDtypesState(state, { sortDirection, sortBy }) {
  let finalSort = sortDirection;
  if (sortBy == state.sortBy && state.sortDirection === "DESC") {
    finalSort = "NONE";
  }
  if (finalSort === "NONE") {
    return { dtypes: sortDtypes(state.dtypes, "index", "ASC"), sortDirection: finalSort, sortBy };
  }
  return { dtypes: sortDtypes(state.dtypes, sortBy, sortDirection), sortDirection: finalSort, sortBy };
}

function filterDtypes(dtypes, dtypesFilter, { sortDirection, sortBy }) {
  let filteredDtypes = dtypes;
  if (dtypesFilter) {
    const substrLower = dtypesFilter.toLowerCase();
    filteredDtypes = _.filter(dtypes, ({ name }) => _.includes(name.toLowerCase(), substrLower));
  }
  return { dtypes: sortDtypes(filteredDtypes, sortBy, sortDirection), dtypesFilter };
}

class DtypesGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dtypes: props.dtypes,
      dtypesFilter: null,
      sortBy: null,
      sortDirection: "NONE",
      scrollToIndex: undefined,
    };
    this._headerRenderer = this._headerRenderer.bind(this);
    this._rowClass = this._rowClass.bind(this);
  }

  _headerRenderer({ dataKey, label, sortBy, sortDirection }) {
    let filterMarkup = null;
    if (dataKey === "name") {
      const filter = e => this.setState(filterDtypes(this.props.dtypes, e.target.value, this.state));
      const onClick = e => e.stopPropagation();
      filterMarkup = (
        <div className="col" onClick={onClick}>
          <input
            type="text"
            onClick={onClick}
            className="w-100"
            value={this.state.dtypesFilter || ""}
            onChange={filter}
          />
        </div>
      );
    }
    return (
      <div key={0} className="headerCell filterable">
        <div className="row">
          <div className="col-auto">
            {label}
            <SortIndicator {...{ dataKey, sortBy, sortDirection }} />
          </div>
          {filterMarkup}
        </div>
      </div>
    );
  }

  _rowClass({ index }) {
    const { selected } = this.props;
    if (selected && selected === _.get(this.state.dtypes, [index, "name"])) {
      return "dtype-row-selected";
    }
    return "dtype-row";
  }

  render() {
    if (!_.isEmpty(this.state.error)) {
      return this.state.error;
    }
    const { sortBy, sortDirection, dtypes } = this.state;
    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <Table
            headerHeight={40}
            height={400}
            overscanRowCount={10}
            rowStyle={{ display: "flex" }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => dtypes[index]}
            rowCount={_.size(dtypes)}
            rowClassName={this._rowClass}
            sort={state => this.setState(buildSortDtypesState(this.state, state))}
            sortBy={sortBy}
            sortDirection={sortDirection === "NONE" ? null : sortDirection}
            width={width}
            onRowClick={this.props.rowClick}
            className="dtypes">
            <Column
              dataKey="name"
              label="Column Name"
              headerRenderer={this._headerRenderer}
              width={200}
              flexGrow={1}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
            />
            <Column
              width={100}
              dataKey="dtype"
              label="Data Type"
              headerRenderer={this._headerRenderer}
              style={{ textAlign: "right", paddingRight: ".5em", fontSize: "80%" }}
              className="cell"
            />
          </Table>
        )}
      </AutoSizer>
    );
  }
}
DtypesGrid.displayName = "DtypesGrid";
DtypesGrid.propTypes = {
  dtypes: PropTypes.array,
  rowClick: PropTypes.func,
  selected: PropTypes.string,
};

export { DtypesGrid };
