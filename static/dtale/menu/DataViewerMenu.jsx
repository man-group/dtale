import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import ConditionalRender from "../../ConditionalRender";
import { openChart } from "../../actions/charts";
import bu from "../backgroundUtils";
import Descriptions from "../menu-descriptions.json";
import DescribeOption from "./DescribeOption";
import DuplicatesOption from "./DuplicatesOption";
import HeatMapOption from "./HeatMapOption";
import InstancesOption from "./InstancesOption";
import LowVarianceOption from "./LowVarianceOption";
import { MenuItem } from "./MenuItem";
import { MenuTooltip } from "./MenuTooltip";
import MergeOption from "./MergeOption";
import NetworkOption from "./NetworkOption";
import RangeHighlightOption from "./RangeHighlightOption";
import { ThemeOption } from "./ThemeOption";
import UploadOption from "./UploadOption";
import { XArrayOption } from "./XArrayOption";
import menuFuncs from "./dataViewerMenuUtils";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { hideShutdown, dataId, menuOpen, menuPinned, backgroundMode, pythonVersion } = this.props;
    const iframe = global.top !== global.self;
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    const { openTab, openPopup } = buttonHandlers;
    const refreshWidths = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    const bgState = bgType => ({
      backgroundMode: backgroundMode === bgType ? null : bgType,
      triggerBgResize: _.includes(bu.RESIZABLE, backgroundMode) || _.includes(bu.RESIZABLE, bgType),
    });
    const toggleBackground = bgType => () => this.props.propagateState(bgState(bgType));
    const toggleOutlierBackground = () => {
      const updatedState = bgState("outliers");
      if (updatedState.backgroundMode === "outliers") {
        updatedState.columns = _.map(this.props.columns, bu.buildOutlierScales);
      }
      this.props.propagateState(updatedState);
    };
    const exportFile = tsv => () =>
      window.open(
        `${menuFuncs.fullPath("/dtale/data-export", dataId)}?tsv=${tsv}&_id=${new Date().getTime()}`,
        "_blank"
      );
    const closeMenu = () => {
      $(document).unbind("click.gridActions");
      this.props.propagateState({ menuOpen: false });
    };
    const containerProps = menuPinned
      ? { className: "pinned-data-viewer-menu" }
      : {
          className: "column-toggle__dropdown",
          hidden: !menuOpen,
          style: { minWidth: "13.65em", top: "1em", left: "0.5em" },
        };
    return (
      <div {...containerProps}>
        {!menuPinned && menuOpen && (
          <GlobalHotKeys keyMap={{ CLOSE_MENU: "esc" }} handlers={{ CLOSE_MENU: closeMenu }} />
        )}
        <MenuTooltip />
        <header className="title-font pb-1">D-TALE</header>
        <div
          style={{
            height: `calc(100vh - ${menuPinned ? 40 : 68}px)`,
            overflowY: "scroll",
            overflowX: "hidden",
          }}>
          <ul>
            <XArrayOption columns={_.reject(this.props.columns, { name: "dtale_index" })} />
            <DescribeOption open={buttonHandlers.DESCRIBE} />
            <MenuItem description={Descriptions.filter}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.FILTER}>
                  <i className="fa fa-filter ml-2 mr-4" />
                  <span className="font-weight-bold">Custom Filter</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={Descriptions.build}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.BUILD}>
                  <i className="ico-build" />
                  <span className="font-weight-bold">Build Column</span>
                </button>
              </span>
            </MenuItem>
            <MergeOption open={() => window.open(menuFuncs.fullPath("/dtale/popup/merge"), "_blank")} />
            <MenuItem description={Descriptions.reshape}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={openPopup("reshape", 400, 770)}>
                  <i className="fas fa-tools ml-2 mr-4" />
                  <span className="font-weight-bold">Summarize Data</span>
                </button>
              </span>
            </MenuItem>
            <DuplicatesOption open={buttonHandlers.DUPLICATES} />
            <MenuItem description={Descriptions.corr}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={openTab("correlations")}>
                  <i className="ico-bubble-chart" />
                  <span className="font-weight-bold">Correlations</span>
                </button>
              </span>
            </MenuItem>
            {(!pythonVersion || (pythonVersion[0] >= 3 && pythonVersion[1] >= 6)) && (
              <MenuItem description={Descriptions.pps}>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={openTab("pps")}>
                    <i className="ico-bubble-chart" />
                    <span className="font-weight-bold">Predictive Power Score</span>
                  </button>
                </span>
              </MenuItem>
            )}
            <MenuItem description={Descriptions.charts}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.CHARTS}>
                  <i className="ico-show-chart" />
                  <span className="font-weight-bold">Charts</span>
                </button>
              </span>
            </MenuItem>
            <NetworkOption open={buttonHandlers.NETWORK} />
            <HeatMapOption backgroundMode={backgroundMode} toggleBackground={toggleBackground} />
            <MenuItem description={Descriptions.highlight_dtypes}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleBackground("dtypes")}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon dtype-bg${backgroundMode === "dtypes" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">Highlight Dtypes</span>
                  </div>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={Descriptions.highlight_missings}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleBackground("missing")}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon missing-bg${backgroundMode === "missing" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">Highlight Missing</span>
                  </div>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={Descriptions.highlight_outliers}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleOutlierBackground}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon outliers-bg${backgroundMode === "outliers" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">Highlight Outliers</span>
                  </div>
                </button>
              </span>
            </MenuItem>
            <RangeHighlightOption {...this.props} />
            <LowVarianceOption
              toggleLowVarianceBackground={toggleBackground("lowVariance")}
              backgroundMode={backgroundMode}
            />
            <InstancesOption open={openPopup("instances", 450, 750)} />
            <MenuItem description={Descriptions.code}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.CODE}>
                  <i className="ico-code" />
                  <span className="font-weight-bold">Code Export</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem style={{ color: "#565b68" }} description={Descriptions.export}>
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
            </MenuItem>
            <UploadOption open={openPopup("upload", 450)} />
            <MenuItem description={Descriptions.widths}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={refreshWidths}>
                  <i className="fas fa-columns ml-2 mr-4" />
                  <span className="font-weight-bold">Refresh Widths</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={Descriptions.about}>
              <span className="toggler-action">
                <button
                  className="btn btn-plain"
                  onClick={() =>
                    this.props.openChart({
                      type: "about",
                      size: "sm",
                      backdrop: true,
                    })
                  }>
                  <i className="fa fa-info-circle la-lg mr-4 ml-1" />
                  <span className="font-weight-bold">About</span>
                </button>
              </span>
            </MenuItem>
            <ThemeOption />
            <MenuItem description={Descriptions.reload_data}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.location.reload()}>
                  <i className="ico-sync" />
                  <span className="font-weight-bold">Reload Data</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={Descriptions.pin_menu}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={this.props.toggleMenuPinned}>
                  <i className="fa fa-anchor la-lg mr-3 ml-1" />
                  <span className="font-weight-bold">{menuPinned ? "Unpin menu" : "Pin menu"}</span>
                </button>
              </span>
            </MenuItem>
            <ConditionalRender display={iframe}>
              <li>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={() => window.open(window.location.pathname, "_blank")}>
                    <i className="ico-open-in-new" />
                    <span className="font-weight-bold">Open In New Tab</span>
                  </button>
                </span>
              </li>
            </ConditionalRender>
            <ConditionalRender display={hideShutdown == false}>
              <MenuItem description={Descriptions.shutdown}>
                <span className="toggler-action">
                  <a className="btn btn-plain" href="/shutdown">
                    <i className="fa fa-power-off ml-2 mr-4" />
                    <span className="font-weight-bold">Shutdown</span>
                  </a>
                </span>
              </MenuItem>
            </ConditionalRender>
          </ul>
        </div>
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
  backgroundMode: PropTypes.string,
  rangeHighlight: PropTypes.object,
  hideShutdown: PropTypes.bool,
  dataId: PropTypes.string.isRequired,
  pythonVersion: PropTypes.arrayOf(PropTypes.number),
  menuPinned: PropTypes.bool,
  toggleMenuPinned: PropTypes.func,
};

const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "hideShutdown", "pythonVersion", "menuPinned"]),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    toggleMenuPinned: () => dispatch({ type: "toggle-menu-pinned" }),
  })
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
