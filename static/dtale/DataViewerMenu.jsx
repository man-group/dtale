import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { openChart } from "../actions/charts";
import { IDX } from "./gridUtils";

const SORT_PROPS = [
  ["ASC", "Sort Ascending", "fa fa-sort-down ml-4 mr-4"],
  ["DESC", "Sort Descending", "fa fa-sort-up ml-4 mr-4"],
  ["NONE", "Clear Sort", "fa fa-sort ml-4 mr-4"],
];
class ReactDataViewerMenu extends React.Component {
  render() {
    const hideShutdown = document.getElementById("hide_shutdown").value === "True";
    const processCt = document.getElementById("processes").value;
    const colCount = (this.props.selectedCols || []).length;
    const lockedColCount = _.filter(
      this.props.columns,
      ({ name, locked }) => locked && _.includes(this.props.selectedCols, name)
    ).length;
    const unlockedColCount = _.filter(
      this.props.columns,
      ({ name, locked }) => !locked && _.includes(this.props.selectedCols, name)
    ).length;
    const updateSort = dir => {
      const { selectedCols } = this.props;
      let sortInfo = _.filter(this.props.sortInfo, ([col, _dir]) => !_.includes(selectedCols, col));
      switch (dir) {
        case "ASC":
        case "DESC":
          sortInfo = _.concat(sortInfo, _.map(selectedCols, col => [col, dir]));
          break;
        case "NONE":
        default:
          break;
      }
      this.props.propagateState({ sortInfo });
    };
    const openHistogram = () => {
      const col = _.head(this.props.selectedCols);
      this.props.openChart(_.assignIn({ type: "histogram", col, title: col }, this.props));
    };
    const openCorrelations = () => {
      this.props.openChart(_.assignIn({ type: "correlations", title: "Correlations" }, this.props));
    };
    const openCoverage = () => {
      const chartCols = _.filter(this.props.columns, ({ name }) => name !== IDX);
      this.props.openChart(_.assignIn({ type: "coverage", cols: chartCols }, this.props));
    };
    const moveToFront = () => {
      const locked = _.filter(this.props.columns, "locked");
      const colsToFront = _.filter(
        this.props.columns,
        ({ name, locked }) => _.includes(this.props.selectedCols, name) && !locked
      );
      let finalCols = _.filter(this.props.columns, ({ name }) => !_.includes(this.props.selectedCols, name));
      finalCols = _.filter(finalCols, ({ name }) => !_.find(locked, { name }));
      finalCols = _.concat(locked, colsToFront, finalCols);
      this.props.propagateState({ columns: finalCols, triggerResize: true });
    };
    const lockCols = () => {
      let locked = _.filter(this.props.columns, "locked");
      locked = _.concat(
        locked,
        _.map(_.filter(this.props.columns, ({ name }) => _.includes(this.props.selectedCols, name)), c =>
          _.assignIn({}, c, { locked: true })
        )
      );
      const finalCols = _.concat(locked, _.filter(this.props.columns, ({ name }) => !_.find(locked, { name })));
      this.props.propagateState({
        columns: finalCols,
        fixedColumnCount: locked.length,
        selectedCols: [],
        triggerResize: true,
      });
    };
    const unlockCols = () => {
      let locked = _.filter(this.props.columns, "locked");
      const unlocked = _.map(_.filter(locked, ({ name }) => _.includes(this.props.selectedCols, name)), c =>
        _.assignIn({}, c, { locked: false })
      );
      locked = _.filter(locked, ({ name }) => !_.includes(this.props.selectedCols, name));
      const finalCols = _.concat(locked, unlocked, _.filter(this.props.columns, c => !_.get(c, "locked", false)));
      this.props.propagateState({
        columns: finalCols,
        fixedColumnCount: locked.length,
        selectedCols: [],
        triggerResize: true,
      });
    };
    const resize = () => this.props.propagateState({ columns: _.map(this.props.columns, c => _.assignIn({}, c)) });
    return (
      <div
        className="column-toggle__dropdown"
        hidden={!this.props.menuOpen}
        style={{ minWidth: "11em", top: "1em", left: "0.5em" }}>
        <header className="menu-font">D-TALE</header>
        <ul>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={() => this.props.openChart({ type: "describe" })}>
                <i className="ico-view-column" />
                <span className="font-weight-bold">Describe</span>
              </button>
            </span>
          </li>
          <ConditionalRender display={colCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={moveToFront}>
                  <i className="fa fa-caret-left ml-4 mr-4" />
                  <span className="ml-3 font-weight-bold">Move To Front</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={unlockedColCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={lockCols}>
                  <i className="fa fa-lock ml-3 mr-4" />
                  <span className="font-weight-bold">Lock</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={lockedColCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={unlockCols}>
                  <i className="fa fa-lock-open ml-2 mr-4" />
                  <span className="font-weight-bold">Unlock</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          {_.map(SORT_PROPS, ([dir, label, icon]) => (
            <ConditionalRender key={`${dir}-action`} display={colCount > 0}>
              <li>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={() => updateSort(dir)}>
                    <i className={icon} />
                    <span className="font-weight-bold">{label}</span>
                  </button>
                </span>
              </li>
            </ConditionalRender>
          ))}
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={() => this.props.propagateState({ filterOpen: true })}>
                <i className="fa fa-filter ml-2 mr-4" />
                <span className="font-weight-bold">Filter</span>
              </button>
            </span>
          </li>
          <ConditionalRender display={colCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => this.props.propagateState({ formattingOpen: true })}>
                  <i className="ico-palette" />
                  <span className="font-weight-bold">Formats</span>
                </button>
              </span>
            </li>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={openHistogram}>
                  <i className="ico-equalizer" />
                  <span className="font-weight-bold">Histogram</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openCorrelations}>
                <i className="ico-bubble-chart" />
                <span className="font-weight-bold">Correlations</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openCoverage}>
                <i className="ico-show-chart" />
                <span className="font-weight-bold">Coverage</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={resize}>
                <i className="fa fa-expand ml-2 mr-4" />
                <span className="font-weight-bold">Resize</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button
                className="btn btn-plain"
                onClick={() => this.props.openChart({ type: "about", size: "modal-sm", backdrop: true })}>
                <i className="fa fa-info-circle la-lg mr-4 ml-1" />
                <span className="font-weight-bold">About</span>
              </button>
            </span>
          </li>
          <ConditionalRender display={processCt > 1}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => this.props.openChart({ type: "instances" })}>
                  <i className="ico-apps" />
                  <span className="font-weight-bold">Instances</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={hideShutdown == false}>
            <li>
              <span className="toggler-action">
                <a className="btn btn-plain" href="/shutdown">
                  <i className="fa fa-power-off ml-2 mr-4" />
                  <span className="font-weight-bold">Shutdown</span>
                </a>
              </span>
            </li>
          </ConditionalRender>
        </ul>
      </div>
    );
  }
}
ReactDataViewerMenu.displayName = "ReactDataViewerMenu";
ReactDataViewerMenu.propTypes = {
  columns: PropTypes.array,
  menuOpen: PropTypes.bool,
  sortInfo: PropTypes.array,
  selectedCols: PropTypes.array,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
};

function mapDispatchToProps(dispatch) {
  return {
    openChart: chartProps => dispatch(openChart(chartProps)),
  };
}

const ReduxDataViewerMenu = connect(
  () => ({}),
  mapDispatchToProps
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
