import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { RemovableError } from "../RemovableError";
import menuUtils from "../menuUtils";
import { exports as gu } from "./gridUtils";
import serverState from "./serverStateManagement";

function buildMenuHandler(prop, propagateState) {
  return menuUtils.openMenu(
    `${prop}Actions`,
    () => propagateState({ menuOpen: prop }),
    () => propagateState({ menuOpen: null }),
    `div.${prop}-menu-toggle`,
    e => {
      const target = $(e.target);
      return target.hasClass("ignore-click") || target.parent().hasClass("ignore-click");
    }
  );
}

function displayQueries(props, prop) {
  const queries = props[prop];
  return _.map(queries, (cfg, col) => {
    const dropColFilter = () => {
      const updatedSettings = {
        [prop]: _.pickBy(queries, (_, k) => k !== col),
      };
      serverState.updateSettings(updatedSettings, props.dataId, () => props.propagateState(updatedSettings));
    };
    return (
      <li key={`${prop}-${col}`}>
        <span className="toggler-action">
          <button className="btn btn-plain ignore-clicks" onClick={dropColFilter}>
            <i className="ico-cancel mr-4" />
          </button>
        </span>
        <span className="font-weight-bold text-nowrap">{cfg.query}</span>
      </li>
    );
  });
}

class ReactDataViewerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: null };
    this.renderSort = this.renderSort.bind(this);
    this.renderFilter = this.renderFilter.bind(this);
    this.renderHidden = this.renderHidden.bind(this);
  }

  renderSort() {
    const { sortInfo, propagateState } = this.props;
    if (_.isEmpty(sortInfo)) {
      return null;
    }
    const label = (
      <div key={0} className="font-weight-bold d-inline-block">
        {"Sort:"}
      </div>
    );
    const clearAll = (
      <i
        key={2}
        className="ico-cancel pl-3 pointer"
        style={{ marginTop: "-0.1em" }}
        onClick={() => propagateState({ sortInfo: [] })}
      />
    );
    if (_.size(sortInfo) == 1) {
      return [
        label,
        <div key={1} className="pl-3 d-inline-block">{`${sortInfo[0][0]} (${sortInfo[0][1]})`}</div>,
        clearAll,
      ];
    }
    let sortText = _.join(
      _.map(sortInfo, ([col, dir]) => `${col} (${dir})`),
      ", "
    );
    if (_.size(sortText) > 60) {
      sortText = `${_.size(sortInfo)} Sorts`;
    }
    const clickHandler = buildMenuHandler("sort", state => this.setState(state));
    return [
      label,
      <div key={1} className="pl-3 d-inline-block sort-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{sortText}</span>
        <div
          className="column-toggle__dropdown"
          hidden={this.state.menuOpen !== "sort"}
          style={{ minWidth: "11em", top: "1em" }}>
          <ul>
            {_.map(sortInfo, ([col, dir]) => {
              const dropSort = () => propagateState({ sortInfo: _.reject(sortInfo, { 0: col }) });
              return (
                <li key={`${col}-${dir}`}>
                  <span className="toggler-action">
                    <button className="btn btn-plain ignore-click" onClick={dropSort}>
                      <i className="ico-cancel mr-4" onClick={dropSort} />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{`${col} (${dir})`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>,
      clearAll,
    ];
  }

  renderFilter() {
    const { query, columnFilters, outlierFilters, dataId, propagateState } = this.props;
    if (gu.noFilters(this.props)) {
      return null;
    }
    const label = (
      <div key={0} className="font-weight-bold d-inline-block">
        Filter:
      </div>
    );
    const filterSegs = _.concat(_.map(columnFilters, "query"), _.map(outlierFilters, "query"));
    if (query) {
      filterSegs.push(query);
    }
    const clearFilter = () => {
      const settingsUpdates = {
        query: "",
        columnFilters: {},
        outlierFilters: {},
      };
      serverState.updateSettings(settingsUpdates, dataId, () => propagateState(settingsUpdates));
    };
    const clearAll = (
      <i key={2} className="ico-cancel pl-3 pointer" style={{ marginTop: "-0.1em" }} onClick={clearFilter} />
    );
    if (_.size(filterSegs) == 1) {
      return [
        label,
        <div key={1} className="pl-3 d-inline-block filter-menu-toggle">
          {filterSegs[0]}
        </div>,
        clearAll,
      ];
    }
    const clickHandler = buildMenuHandler("filter", state => this.setState(state));
    let filterText = _.join(filterSegs, " and ");
    if (_.size(filterText) > 30) {
      filterText = _.truncate(filterText, { length: 30 });
    }
    return [
      label,
      <div key={1} className="pl-3 d-inline-block filter-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{filterText}</span>
        <div
          className="column-toggle__dropdown"
          hidden={this.state.menuOpen !== "filter"}
          style={{ minWidth: "8em", top: "1em" }}>
          <ul>
            {displayQueries(this.props, "columnFilters")}
            {displayQueries(this.props, "outlierFilters")}
            {query && (
              <li>
                <span className="toggler-action">
                  <button
                    className="btn btn-plain ignore-clicks"
                    onClick={() =>
                      serverState.updateSettings({ query: "" }, dataId, () => propagateState({ query: "" }))
                    }>
                    <i className="ico-cancel mr-4" />
                  </button>
                </span>
                <span className="font-weight-bold text-nowrap">{query}</span>
              </li>
            )}
          </ul>
        </div>
      </div>,
      clearAll,
    ];
  }

  renderHidden() {
    const { columns, dataId, propagateState } = this.props;
    if (gu.noHidden(columns)) {
      return null;
    }
    const label = (
      <div key={0} className="font-weight-bold d-inline-block">
        Hidden:
      </div>
    );
    const hidden = _.map(_.filter(columns, { visible: false }), "name");
    const clearHidden = () => {
      const visibility = _.reduce(columns, (ret, { name }) => _.assignIn(ret, { [name]: true }), {});
      const updatedState = {
        columns: _.map(columns, c => _.assignIn({}, c, { visible: true })),
        triggerResize: true,
      };
      serverState.updateVisibility(dataId, visibility, () => propagateState(updatedState));
    };
    const clearAll = (
      <i key={2} className="ico-cancel pl-3 pointer" style={{ marginTop: "-0.1em" }} onClick={clearHidden} />
    );
    if (_.size(hidden) == 1) {
      return [
        label,
        <div key={1} className="pl-3 d-inline-block filter-menu-toggle">
          {_.join(hidden, ", ")}
        </div>,
        clearAll,
      ];
    }
    const clickHandler = buildMenuHandler("hidden", state => this.setState(state));
    let hiddenText = _.join(hidden, ", ");
    if (_.size(hiddenText) > 30) {
      hiddenText = `${_.size(hidden)} Columns`;
    }
    return [
      label,
      <div key={1} className="pl-3 d-inline-block hidden-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{hiddenText}</span>
        <div
          className="column-toggle__dropdown"
          hidden={this.state.menuOpen !== "hidden"}
          style={{ minWidth: "11em", top: "1em", left: "unset", right: "-2em" }}>
          <ul>
            {_.map(hidden, (col, i) => {
              const unhideCol = () => {
                const updatedColumns = _.map(columns, c => _.assignIn({}, c, c.name === col ? { visible: true } : {}));
                serverState.toggleVisibility(dataId, col, () => propagateState({ columns: updatedColumns }));
              };
              return (
                <li key={i}>
                  <span className="toggler-action">
                    <button className="btn btn-plain ignore-clicks" onClick={unhideCol}>
                      <i className="ico-cancel mr-4" />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{col}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>,
      clearAll,
    ];
  }

  render() {
    const { error, propagateState } = this.props;
    let errorMarkup = null;
    if (error) {
      errorMarkup = (
        <div key={0} style={{ width: this.props.width || "100%" }} className="row">
          <div className="col-md-12">
            <RemovableError {...this.props} onRemove={() => propagateState({ error: null, traceback: null })} />
          </div>
        </div>
      );
    }
    if (gu.hasNoInfo(this.props)) {
      return errorMarkup;
    }
    return [
      errorMarkup,
      <div key={1} style={{ width: this.props.width || "100%" }} className="row text-center">
        <div className="col text-left ml-5">{this.renderSort()}</div>
        <div className="col-auto">{this.renderFilter()}</div>
        <div className="col text-right mr-5">{this.renderHidden()}</div>
      </div>,
    ];
  }
}
ReactDataViewerInfo.displayName = "DataViewerInfo";
ReactDataViewerInfo.propTypes = {
  sortInfo: PropTypes.array,
  query: PropTypes.string,
  propagateState: PropTypes.func,
  error: PropTypes.string,
  width: PropTypes.number,
  columns: PropTypes.arrayOf(PropTypes.object),
  dataId: PropTypes.string,
  columnFilters: PropTypes.object,
  outlierFilters: PropTypes.object,
};

const ReduxDataViewerInfo = connect(({ dataId }) => ({ dataId }))(ReactDataViewerInfo);
export { ReduxDataViewerInfo as DataViewerInfo, ReactDataViewerInfo };
