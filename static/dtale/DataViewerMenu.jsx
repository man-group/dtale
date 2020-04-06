import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import ConditionalRender from "../ConditionalRender";
import { openChart } from "../actions/charts";
import menuFuncs from "./dataViewerMenuUtils";
import Descriptions from "./menu-descriptions.json";

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
    const openCodeExport = () => menuFuncs.open("/dtale/popup/code-export", dataId, 450, 700);
    const refreshWidths = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    const toggleHeatMap = mode => () =>
      this.props.propagateState({
        heatMapMode: this.props.heatMapMode == mode ? null : mode,
        dtypeHighlighting: false,
      });
    const toggleDtypeHighlighting = () =>
      this.props.propagateState({
        dtypeHighlighting: !this.props.dtypeHighlighting,
        heatMapMode: null,
      });
    const exportFile = tsv => () =>
      window.open(`/dtale/data-export/${dataId}?tsv=${tsv}&_id=${new Date().getTime()}`, "_blank");
    return (
      <div
        className="column-toggle__dropdown"
        hidden={!this.props.menuOpen}
        style={{ minWidth: "11em", top: "1em", left: "0.5em" }}>
        <header className="title-font">D-TALE</header>
        <ul>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("describe", 670, 1100)}>
                <i className="ico-view-column" />
                <span className="font-weight-bold">Describe</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.describe}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("filter", 500, 1100)}>
                <i className="fa fa-filter ml-2 mr-4" />
                <span className="font-weight-bold">Custom Filter</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.filter}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("build", 400, 770)}>
                <i className="ico-build" />
                <span className="font-weight-bold">Build Column</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.build}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("reshape", 400, 770)}>
                <i className="fas fa-tools ml-2 mr-4" />
                <span className="font-weight-bold">Summarize Data</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.reshape}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("correlations", 1235, 1000)}>
                <i className="ico-bubble-chart" />
                <span className="font-weight-bold">Correlations</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.corr}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button
                className="btn btn-plain"
                onClick={() => window.open(menuFuncs.fullPath("/charts", dataId), "_blank")}>
                <i className="ico-show-chart" />
                <span className="font-weight-bold">Charts</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.charts}</div>
          </li>
          <li className="hoverable" style={{ color: "inherit" }}>
            <span className="toggler-action">
              <i className={`fa fa-${this.props.heatMapMode ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
            </span>
            <span className={`font-weight-bold pl-2${_.isNull(this.props.heatMapMode) ? "" : " flames"}`}>
              {"Heat Map"}
            </span>
            <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" style={{ fontSize: "75%" }}>
              {_.map(
                [
                  ["By Col", "col"],
                  ["Overall", "all"],
                ],
                ([label, mode]) => (
                  <button
                    key={label}
                    style={{ color: "#565b68" }}
                    className="btn btn-primary font-weight-bold"
                    onClick={toggleHeatMap(mode)}>
                    {mode === this.props.heatMapMode && <span className="flames">{label}</span>}
                    {mode !== this.props.heatMapMode && label}
                  </button>
                )
              )}
            </div>
            <div className="hoverable__content menu-description">{Descriptions.heatmap}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={toggleDtypeHighlighting}>
                <div style={{ display: "inherit" }}>
                  <div className={`dtype-highlighting${this.props.dtypeHighlighting ? " spin" : ""}`} />
                  <span className="font-weight-bold pl-4">Highlight Dtypes</span>
                </div>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.highlight_dtypes}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("instances", 450, 750)}>
                <i className="ico-apps" />
                <span className="font-weight-bold">
                  {"Instances "}
                  <span className="badge badge-secondary">{processCt}</span>
                </span>
              </button>
            </span>
            <div className="hoverable__content menu-description">
              <span>{Descriptions.instances}</span>
            </div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openCodeExport}>
                <i className="ico-code" />
                <span className="font-weight-bold">Code Export</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.code}</div>
          </li>
          <li className="hoverable" style={{ color: "inherit" }}>
            <span className="toggler-action">
              <i className="far fa-file" />
            </span>
            <span className="font-weight-bold pl-2">Export</span>
            <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
              {_.map(
                [
                  ["CSV", "false"],
                  ["TSV", "true"],
                ],
                ([label, tsv]) => (
                  <button
                    key={label}
                    style={{ color: "#565b68" }}
                    className="btn btn-primary font-weight-bold"
                    onClick={exportFile(tsv)}>
                    {label}
                  </button>
                )
              )}
            </div>
            <div className="hoverable__content menu-description">{Descriptions.export}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={refreshWidths}>
                <i className="fas fa-columns ml-2 mr-4" />
                <span className="font-weight-bold">Refresh Widths</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.widths}</div>
          </li>
          <li className="hoverable">
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
            <div className="hoverable__content menu-description">{Descriptions.about}</div>
          </li>
          <ConditionalRender display={iframe}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.location.reload()}>
                  <i className="ico-sync" />
                  <span className="font-weight-bold">Reload Data</span>
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
            <li className="hoverable">
              <span className="toggler-action">
                <a className="btn btn-plain" href="/shutdown">
                  <i className="fa fa-power-off ml-2 mr-4" />
                  <span className="font-weight-bold">Shutdown</span>
                </a>
              </span>
              <div className="hoverable__content menu-description">{Descriptions.shutdown}</div>
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
  heatMapMode: PropTypes.string,
  dtypeHighlighting: PropTypes.bool,
  hideShutdown: PropTypes.bool,
  dataId: PropTypes.string.isRequired,
};

const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "hideShutdown"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
