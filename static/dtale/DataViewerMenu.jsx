import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { openChart } from "../actions/charts";
import menuFuncs from "./dataViewerMenuUtils";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { hideShutdown, dataId } = this.props;
    const iframe = global.top !== global.self;
    const processCt = document.getElementById("processes").value;
    const openPopup = (type, height = 450, width = 500) => () => {
      if (menuFuncs.shouldOpenPopup(height, width)) {
        menuFuncs.open(`/dtale/popup/${type}`, dataId, height, width);
      } else {
        this.props.openChart(_.assignIn({ type, title: _.capitalize(type) }, this.props));
      }
    };
    const resize = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    const toggleHeatMap = () => this.props.propagateState({ heatMapMode: !this.props.heatMapMode });
    return (
      <div
        className="column-toggle__dropdown"
        hidden={!this.props.menuOpen}
        style={{ minWidth: "11em", top: "1em", left: "0.5em" }}>
        <header className="title-font">D-TALE</header>
        <ul>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("describe", 670, 1100)}>
                <i className="ico-view-column" />
                <span className="font-weight-bold">Describe</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={() => this.props.propagateState({ filterOpen: true })}>
                <i className="fa fa-filter ml-2 mr-4" />
                <span className="font-weight-bold">Filter</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("build", 400, 770)}>
                <i className="ico-build" />
                <span className="font-weight-bold">Build Column</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("correlations", 1235, 1000)}>
                <i className="ico-bubble-chart" />
                <span className="font-weight-bold">Correlations</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button
                className="btn btn-plain"
                onClick={() => window.open(menuFuncs.fullPath("/charts", dataId), "_blank")}>
                <i className="ico-show-chart" />
                <span className="font-weight-bold">Charts</span>
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
              <button className="btn btn-plain" onClick={toggleHeatMap}>
                <i className={`fa fa-${this.props.heatMapMode ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
                <span className={`font-weight-bold${this.props.heatMapMode ? " flames" : ""}`}>Heat Map</span>
              </button>
            </span>
          </li>
          <li>
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("instances")}>
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
              <button className="btn btn-plain" onClick={openPopup("code")}>
                <i className="ico-code" />
                <span className="font-weight-bold">Code Export</span>
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
          <ConditionalRender display={iframe}>
            <li>
              <span className="toggler-action">
                <button
                  className="btn btn-plain"
                  onClick={() => menuFuncs.open(window.location.pathname, null, 400, 700)}>
                  <i className="ico-open-in-new" />
                  <span className="font-weight-bold">Open Popup</span>
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
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  heatMapMode: PropTypes.bool,
  hideShutdown: PropTypes.bool,
  dataId: PropTypes.string.isRequired,
};

const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "hideShutdown"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
