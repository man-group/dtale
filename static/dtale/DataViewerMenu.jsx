import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { openChart } from "../actions/charts";
import { lockCols, moveToFront, unlockCols, updateSort } from "./dataViewerMenuUtils";
import { SORT_PROPS, toggleHeatMap } from "./gridUtils";

//import { fetchJson } from "../fetcher";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { hideShutdown, iframe, selectedCols } = this.props;
    const processCt = document.getElementById("processes").value;
    const colCount = (this.props.selectedCols || []).length;
    const lockedColCount = _.filter(this.props.columns, ({ name, locked }) => locked && _.includes(selectedCols, name))
      .length;
    const unlockedColCount = _.filter(
      this.props.columns,
      ({ name, locked }) => !locked && _.includes(selectedCols, name)
    ).length;
    const openHistogram = () => {
      const col = _.head(this.props.selectedCols);
      this.props.openChart(_.assignIn({ type: "histogram", col, title: col }, this.props));
    };
    const openDescribe = () => {
      if (iframe) {
        window.open("/dtale/popup/describe", "_blank", "titlebar=1,location=1,status=1,width=500,height=450");
      } else {
        this.props.openChart({ type: "describe" });
      }
    };
    const openCorrelations = () => {
      if (iframe) {
        window.open("/dtale/popup/correlations", "_blank", "titlebar=1,location=1,status=1,width=500,height=450");
      } else {
        this.props.openChart(_.assignIn({ type: "correlations", title: "Correlations" }, this.props));
      }
    };
    const openCoverage = () => {
      if (iframe) {
        window.open("/dtale/popup/coverage", "_blank", "titlebar=1,location=1,status=1,width=500,height=450");
      } else {
        this.props.openChart(_.assignIn({ type: "coverage" }, this.props));
      }
    };
    const openInstances = () => {
      if (iframe) {
        window.open("/dtale/popup/instances", "_blank", "titlebar=1,location=1,status=1,width=500,height=450");
      } else {
        this.props.openChart({ type: "instances" });
      }
    };
    const resize = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    return (
      <div
        className="column-toggle__dropdown"
        hidden={!this.props.menuOpen}
        style={{ minWidth: "11em", top: "1em", left: "0.5em" }}>
        <header className="menu-font">D-TALE</header>
        <ul>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openDescribe}>
                <i className="ico-view-column" />
                <span className="font-weight-bold">Describe</span>
              </button>
            </span>
          </li>
          <ConditionalRender display={colCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={moveToFront(selectedCols, this.props)}>
                  <i className="fa fa-caret-left ml-4 mr-4" />
                  <span className="ml-3 font-weight-bold">Move To Front</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={unlockedColCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={lockCols(selectedCols, this.props)}>
                  <i className="fa fa-lock ml-3 mr-4" />
                  <span className="font-weight-bold">Lock</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={lockedColCount > 0}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={unlockCols(selectedCols, this.props)}>
                  <i className="fa fa-lock-open ml-2 mr-4" />
                  <span className="font-weight-bold">Unlock</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={colCount > 0 && !iframe}>
            {_.map(SORT_PROPS, ({ dir, full }) => (
              <li key={`${dir}-action`}>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={() => updateSort(selectedCols, dir, this.props)}>
                    <i className={full.icon} />
                    <span className="font-weight-bold">{full.label}</span>
                  </button>
                </span>
              </li>
            ))}
          </ConditionalRender>
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
              <button className="btn btn-plain" onClick={() => this.props.propagateState(toggleHeatMap(this.props))}>
                <i className={`fa fa-${this.props.heatMapMode ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
                <span className={`font-weight-bold${this.props.heatMapMode ? " flames" : ""}`}>Heat Map</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openInstances}>
                <i className="ico-apps" />
                <span className="font-weight-bold">
                  {"Instances "}
                  <span className="badge badge-secondary">{processCt}</span>
                </span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button
                className="btn btn-plain"
                onClick={() =>
                  this.props.openChart({
                    type: "about",
                    size: "modal-sm",
                    backdrop: true,
                  })
                }>
                <i className="fa fa-info-circle la-lg mr-4 ml-1" />
                <span className="font-weight-bold">About</span>
              </button>
            </span>
          </li>
          <ConditionalRender display={iframe}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.location.reload()}>
                  <i className="ico-sync" />
                  <span className="font-weight-bold">Refresh</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={global.top === global.self}>
            <li>
              <span className="toggler-action">
                <a className="btn btn-plain" href={`/dtale${iframe ? "/main" : "/iframe"}`}>
                  <i className={`far fa-${iframe ? "window-maximize" : "window-restore"} ml-2 mr-4`} />
                  <span className="font-weight-bold">{`${iframe ? "Full" : "Iframe"}-Mode`}</span>
                </a>
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
  selectedCols: PropTypes.array,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  heatMapMode: PropTypes.bool,
  hideShutdown: PropTypes.bool,
  iframe: PropTypes.bool,
};

const ReduxDataViewerMenu = connect(
  ({ hideShutdown, iframe }) => ({ hideShutdown, iframe }),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
