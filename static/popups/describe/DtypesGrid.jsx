import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import Column from "react-virtualized/dist/commonjs/Table/Column";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import * as gu from "../../dtale/gridUtils";

require("./DtypesGrid.css");

export class SortIndicator extends React.Component {
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

function sortData(data, sortBy, sortDirection) {
  return _.orderBy(data, [sortBy], [sortDirection.toLowerCase()]);
}

export function buildSortedState(state, { sortDirection, sortBy }, dataProp = "dtypes") {
  let finalSort = sortDirection;
  if (sortBy == state.sortBy && state.sortDirection === "DESC") {
    finalSort = "NONE";
  }
  if (finalSort === "NONE") {
    return {
      [dataProp]: sortData(state[dataProp], "index", "ASC"),
      sortDirection: finalSort,
      sortBy,
    };
  }
  return {
    [dataProp]: sortData(state[dataProp], sortBy, sortDirection),
    sortDirection: finalSort,
    sortBy,
  };
}

function filterDtypes({ dtypes, dtypesFilter, sortDirection, sortBy }) {
  let filteredDtypes = dtypes;
  if (dtypesFilter) {
    const substrLower = dtypesFilter.toLowerCase();
    filteredDtypes = _.filter(dtypes, ({ name }) => _.includes(name.toLowerCase(), substrLower));
  }
  return sortData(filteredDtypes, sortBy, sortDirection);
}

class DtypesGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dtypes: props.dtypes,
      dtypesFilter: null,
      sortBy: null,
      sortDirection: "NONE",
      allVisible: gu.noHidden(props.dtypes),
    };
    this._headerRenderer = this._headerRenderer.bind(this);
    this._rowClass = this._rowClass.bind(this);
  }

  shouldComponentUpdate(_newProps, newState) {
    return !_.isEqual(this.state, newState);
  }

  _headerRenderer({ dataKey, label, sortBy, sortDirection }) {
    if (dataKey === "visible") {
      const { allVisible } = this.state;
      const onClick = e => {
        this.setState({
          dtypes: _.map(this.state.dtypes, d => _.assign({}, d, { visible: !allVisible })),
          allVisible: !allVisible,
        });
        e.stopPropagation();
      };
      return (
        <div className="headerCell pointer" onClick={onClick}>
          {label}
          <i className={`ico-check-box${allVisible ? "" : "-outline-blank"}`} onClick={onClick} />
        </div>
      );
    }
    let filterMarkup = null;
    if (dataKey === "name") {
      const filter = e => this.setState({ dtypesFilter: e.target.value });
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
    if (_.get(this.state.dtypes, [index, "selected"], false)) {
      return "dtype-row-selected";
    }
    return "dtype-row";
  }

  render() {
    if (!_.isEmpty(this.state.error)) {
      return this.state.error;
    }
    const { t } = this.props;
    const { sortBy, sortDirection } = this.state;
    const toggleVisibility =
      ({ name, visible }) =>
      e => {
        this.setState({
          dtypes: _.map(this.state.dtypes, d => {
            if (d.name === name) {
              return _.assign({}, d, { visible: !visible });
            }
            return d;
          }),
        });
        e.stopPropagation();
      };
    const currDtypes = filterDtypes(this.state);
    const rowClick = ({ rowData }) =>
      this.setState(
        {
          dtypes: _.map(this.state.dtypes, d => _.assign({}, d, { selected: d.name === rowData.name })),
        },
        () => this.props.propagateState({ selected: rowData })
      );
    return (
      <AutoSizer>
        {({ height, width }) => (
          <Table
            headerHeight={40}
            height={height < 400 ? 400 : height}
            overscanRowCount={10}
            rowStyle={{ display: "flex" }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => currDtypes[index]}
            rowCount={_.size(currDtypes)}
            rowClassName={this._rowClass}
            sort={state => this.setState(buildSortedState(this.state, state))}
            sortBy={sortBy}
            sortDirection={sortDirection === "NONE" ? null : sortDirection}
            width={width}
            onRowClick={rowClick}
            className="dtypes">
            <Column
              dataKey="index"
              label="#"
              headerRenderer={this._headerRenderer}
              width={35}
              style={{ textAlign: "center" }}
              className="cell"
            />
            <Column
              dataKey="visible"
              label={t("Visible")}
              headerRenderer={this._headerRenderer}
              width={60}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
              cellRenderer={({ rowData }) => (
                <div onClick={toggleVisibility(rowData)} className="text-center pointer">
                  <i className={`ico-check-box${rowData.visible ? "" : "-outline-blank"}`} />
                </div>
              )}
            />
            <Column
              dataKey="name"
              label={t("Column Name")}
              headerRenderer={this._headerRenderer}
              width={200}
              flexGrow={1}
              style={{ textAlign: "left", paddingLeft: ".5em" }}
              className="cell"
            />
            <Column
              width={100}
              dataKey="dtype"
              label={t("Data Type")}
              headerRenderer={this._headerRenderer}
              style={{
                textAlign: "right",
                paddingLeft: ".5em",
                paddingTop: ".35em",
                fontSize: "80%",
              }}
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
  propagateState: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation("describe", { withRef: true })(DtypesGrid);
