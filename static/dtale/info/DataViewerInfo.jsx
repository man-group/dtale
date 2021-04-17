import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { RemovableError } from "../../RemovableError";
import menuUtils from "../../menuUtils";
import { exports as gu } from "../gridUtils";
import serverState from "../serverStateManagement";

require("./DataViewerInfo.scss");

const removeBackticks = query => query.replace(/`/g, "");

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
        <span className="font-weight-bold text-nowrap">{removeBackticks(cfg.query)}</span>
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
    const { sortInfo, propagateState, t } = this.props;
    if (_.isEmpty(sortInfo)) {
      return null;
    }
    const label = (
      <div key={0} className="font-weight-bold d-inline-block">
        {t("Sort")}:
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
      sortText = `${_.size(sortInfo)} ${t("Sorts")}`;
    }
    const clickHandler = buildMenuHandler("sort", state => this.setState(state));
    return [
      label,
      <div key={1} className="pl-3 d-inline-block sort-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{sortText}</span>
        <div className="column-toggle__dropdown" hidden={this.state.menuOpen !== "sort"}>
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
          {removeBackticks(filterSegs[0])}
        </div>,
        clearAll,
      ];
    }
    const clickHandler = buildMenuHandler("filter", state => this.setState(state));
    let filterText = _.join(filterSegs, " and ");
    if (_.size(filterText) > 30) {
      filterText = _.truncate(removeBackticks(filterText), { length: 30 });
    }
    return [
      label,
      <div key={1} className="pl-3 d-inline-block filter-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{filterText}</span>
        <div className="column-toggle__dropdown" hidden={this.state.menuOpen !== "filter"}>
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
    const { columns, dataId, propagateState, t } = this.props;
    if (gu.noHidden(columns)) {
      return null;
    }
    const label = (
      <div key={0} className="font-weight-bold d-inline-block">
        {t("Hidden")}:
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
      hiddenText = `${_.size(hidden)} ${t("Columns")}`;
    }
    return [
      label,
      <div key={1} className="pl-3 d-inline-block hidden-menu-toggle" onClick={clickHandler}>
        <span className="pointer">{hiddenText}</span>
        <div className="column-toggle__dropdown" hidden={this.state.menuOpen !== "hidden"}>
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
    return (
      <>
        <div className={`row data-viewer-error${error ? " is-expanded" : ""}`}>
          <div className="col-md-12">
            {error && (
              <RemovableError {...this.props} onRemove={() => propagateState({ error: null, traceback: null })} />
            )}
          </div>
        </div>
        <div className={`row text-center data-viewer-info${gu.hasNoInfo(this.props) ? "" : " is-expanded"}`}>
          <div className="col text-left">{this.renderSort()}</div>
          <div className="col-auto">{this.renderFilter()}</div>
          <div className="col text-right">{this.renderHidden()}</div>
        </div>
      </>
    );
  }
}
ReactDataViewerInfo.displayName = "DataViewerInfo";
ReactDataViewerInfo.propTypes = {
  sortInfo: PropTypes.array,
  query: PropTypes.string,
  propagateState: PropTypes.func,
  error: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object),
  dataId: PropTypes.string,
  columnFilters: PropTypes.object,
  outlierFilters: PropTypes.object,
  t: PropTypes.func,
};
const TranslateDataViewerInfo = withTranslation("main")(ReactDataViewerInfo);
const ReduxDataViewerInfo = connect(({ dataId }) => ({ dataId }))(TranslateDataViewerInfo);
export { ReduxDataViewerInfo as DataViewerInfo, TranslateDataViewerInfo as ReactDataViewerInfo };
