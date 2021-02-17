import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import bu from "../backgroundUtils";
import DescribeOption from "./DescribeOption";
import DuplicatesOption from "./DuplicatesOption";
import HeatMapOption from "./HeatMapOption";
import InstancesOption from "./InstancesOption";
import { LanguageOption } from "./LanguageOption";
import LowVarianceOption from "./LowVarianceOption";
import { MenuItem } from "./MenuItem";
import { MenuTooltip } from "./MenuTooltip";
import MergeOption from "./MergeOption";
import NetworkOption from "./NetworkOption";
import { PinMenuOption } from "./PinMenuOption";
import RangeHighlightOption from "./RangeHighlightOption";
import { ThemeOption } from "./ThemeOption";
import UploadOption from "./UploadOption";
import { XArrayOption } from "./XArrayOption";
import menuFuncs from "./dataViewerMenuUtils";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { hideShutdown, dataId, menuOpen, menuPinned, backgroundMode, pythonVersion, t } = this.props;
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
            <MenuItem description={t("menu_description:filter")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.FILTER}>
                  <i className="fa fa-filter ml-2 mr-4" />
                  <span className="font-weight-bold">{t("menu:Custom Filter")}</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={t("menu_description:build")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.BUILD}>
                  <i className="ico-build" />
                  <span className="font-weight-bold">{t("menu:Build Column")}</span>
                </button>
              </span>
            </MenuItem>
            <MergeOption open={() => window.open(menuFuncs.fullPath("/dtale/popup/merge"), "_blank")} />
            <MenuItem description={t("menu_description:reshape")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={openPopup("reshape", 400, 770)}>
                  <i className="fas fa-tools ml-2 mr-4" />
                  <span className="font-weight-bold">{t("menu:Summarize Data")}</span>
                </button>
              </span>
            </MenuItem>
            <DuplicatesOption open={buttonHandlers.DUPLICATES} />
            <MenuItem description={t("menu_description:corr")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={openTab("correlations")}>
                  <i className="ico-bubble-chart" />
                  <span className="font-weight-bold">{t("menu:Correlations")}</span>
                </button>
              </span>
            </MenuItem>
            {(!pythonVersion || (pythonVersion[0] >= 3 && pythonVersion[1] >= 6)) && (
              <MenuItem description={t("menu_description:pps")}>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={openTab("pps")}>
                    <i className="ico-bubble-chart" />
                    <span className="font-weight-bold">{t("menu:Predictive Power Score")}</span>
                  </button>
                </span>
              </MenuItem>
            )}
            <MenuItem description={t("menu_description:charts")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.CHARTS}>
                  <i className="ico-show-chart" />
                  <span className="font-weight-bold">{t("menu:Charts")}</span>
                </button>
              </span>
            </MenuItem>
            <NetworkOption open={buttonHandlers.NETWORK} />
            <HeatMapOption backgroundMode={backgroundMode} toggleBackground={toggleBackground} />
            <MenuItem description={t("menu_description:highlight_dtypes")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleBackground("dtypes")}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon dtype-bg${backgroundMode === "dtypes" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">{t("menu:Highlight Dtypes")}</span>
                  </div>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={t("menu_description:highlight_missings")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleBackground("missing")}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon missing-bg${backgroundMode === "missing" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">{t("menu:Highlight Missing")}</span>
                  </div>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={t("menu_description:highlight_outliers")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={toggleOutlierBackground}>
                  <div style={{ display: "inherit" }}>
                    <div className={`bg-icon outliers-bg${backgroundMode === "outliers" ? " spin" : ""}`} />
                    <span className="font-weight-bold pl-4">{t("menu:Highlight Outliers")}</span>
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
            <MenuItem description={t("menu_description:code")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={buttonHandlers.CODE}>
                  <i className="ico-code" />
                  <span className="font-weight-bold">{t("code_export:Code Export")}</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem style={{ color: "#565b68" }} description={t("menu_description:export")}>
              <span className="toggler-action">
                <i className="far fa-file" />
              </span>
              <span className="font-weight-bold pl-2">{t("menu:Export")}</span>
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
                      {t(`menu:${label}`)}
                    </button>
                  )
                )}
              </div>
            </MenuItem>
            <UploadOption open={openPopup("upload", 450)} />
            <MenuItem description={t("menu_description:widths")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={refreshWidths}>
                  <i className="fas fa-columns ml-2 mr-4" />
                  <span className="font-weight-bold">{t("menu:Refresh Widths")}</span>
                </button>
              </span>
            </MenuItem>
            <MenuItem description={t("menu_description:about")}>
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
                  <span className="font-weight-bold">{t("menu:About")}</span>
                </button>
              </span>
            </MenuItem>
            <ThemeOption />
            <MenuItem description={t("menu_description:reload_data")}>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.location.reload()}>
                  <i className="ico-sync" />
                  <span className="font-weight-bold">{t("menu:Reload Data")}</span>
                </button>
              </span>
            </MenuItem>
            <PinMenuOption />
            <LanguageOption />
            {iframe && (
              <li>
                <span className="toggler-action">
                  <button className="btn btn-plain" onClick={() => window.open(window.location.pathname, "_blank")}>
                    <i className="ico-open-in-new" />
                    <span className="font-weight-bold">{t("menu:Open In New Tab")}</span>
                  </button>
                </span>
              </li>
            )}
            {hideShutdown == false && (
              <MenuItem description={t("menu_description:shutdown")}>
                <span className="toggler-action">
                  <a className="btn btn-plain" href="/shutdown">
                    <i className="fa fa-power-off ml-2 mr-4" />
                    <span className="font-weight-bold">{t("menu:Shutdown")}</span>
                  </a>
                </span>
              </MenuItem>
            )}
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
  t: PropTypes.func,
};

const TranslatedReactDataViewMenu = withTranslation(["menu", "menu_description", "code_export"])(ReactDataViewerMenu);
const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "hideShutdown", "pythonVersion", "menuPinned"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(TranslatedReactDataViewMenu);

export { ReduxDataViewerMenu as DataViewerMenu, TranslatedReactDataViewMenu as ReactDataViewerMenu };
