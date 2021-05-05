import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { RemovableError } from "../../RemovableError";
import { updateSettings } from "../../actions/settings";
import * as gu from "../gridUtils";
import serverState from "../serverStateManagement";
import { FilterDisplay } from "./FilterDisplay";
import { buildMenuHandler } from "./infoUtils";

require("./DataViewerInfo.scss");

class ReactDataViewerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: null };
    this.renderSort = this.renderSort.bind(this);
    this.renderHidden = this.renderHidden.bind(this);
  }

  renderSort() {
    const { sortInfo, updateSettings, t } = this.props;
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
        onClick={() => updateSettings({ sortInfo: [] })}
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
              const dropSort = () => updateSettings({ sortInfo: _.reject(sortInfo, { 0: col }) });
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
          <div className="col-auto">
            <FilterDisplay menuOpen={this.state.menuOpen} propagateState={state => this.setState(state)} />
          </div>
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
  updateSettings: PropTypes.func,
  error: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.object),
  dataId: PropTypes.string,
  columnFilters: PropTypes.object,
  outlierFilters: PropTypes.object,
  predefinedFiltersConfigs: PropTypes.array,
  t: PropTypes.func,
};
const TranslateDataViewerInfo = withTranslation("main")(ReactDataViewerInfo);
const ReduxDataViewerInfo = connect(
  ({ dataId, predefinedFilters, settings }) => ({
    dataId,
    predefinedFiltersConfigs: predefinedFilters,
    ...settings,
  }),
  dispatch => ({
    updateSettings: (settings, callback) => dispatch(updateSettings(settings, callback)),
  })
)(TranslateDataViewerInfo);
export { ReduxDataViewerInfo as DataViewerInfo, TranslateDataViewerInfo as ReactDataViewerInfo };
