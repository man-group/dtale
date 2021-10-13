import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import * as gu from "../gridUtils";
import AboutOption from "./AboutOption";
import BuildColumnOption from "./BuildColumnOption";
import ChartsOption from "./ChartsOption";
import CleanColumn from "./CleanOption";
import CodeExportOption from "./CodeExportOption";
import CorrelationAnalysisOption from "./CorrelationAnalysisOption";
import CorrelationsOption from "./CorrelationsOption";
import DescribeOption from "./DescribeOption";
import DuplicatesOption from "./DuplicatesOption";
import ExportOption from "./ExportOption";
import FilterOption from "./FilterOption";
import GageRnROption from "./GageRnROption";
import { HeatMapOption } from "./HeatMapOption";
import HighlightOption from "./HighlightOption";
import InstancesOption from "./InstancesOption";
import { LanguageOption } from "./LanguageOption";
import { LogoutOption } from "./LogoutOption";
import LowVarianceOption from "./LowVarianceOption";
import { MenuItem } from "./MenuItem";
import MergeOption from "./MergeOption";
import MissingOption from "./MissingOption";
import NetworkOption from "./NetworkOption";
import NewTabOption from "./NewTabOption";
import { PPSOption } from "./PPSOption";
import { PinMenuOption } from "./PinMenuOption";
import { PredefinedFiltersOption } from "./PredefinedFiltersOption";
import RangeHighlightOption from "./RangeHighlightOption";
import ReloadOption from "./ReloadOption";
import ShowHideColumnsOption from "./ShowHideColumnsOption";
import { ShutdownOption } from "./ShutdownOption";
import SummarizeOption from "./SummarizeOption";
import { ThemeOption } from "./ThemeOption";
import TimeseriesOption from "./TimeseriesOption";
import UploadOption from "./UploadOption";
import { XArrayOption } from "./XArrayOption";
import menuFuncs from "./dataViewerMenuUtils";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { menuOpen, menuPinned, backgroundMode, mainTitle, mainTitleFont, t } = this.props;
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    const { openPopup, toggleBackground, toggleOutlierBackground, exportFile } = buttonHandlers;
    const refreshWidths = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    const closeMenu = () => {
      $(document).unbind("click.gridActions");
      this.props.propagateState({ menuOpen: false });
    };
    const hasNoInfo = gu.hasNoInfo(this.props);
    const containerProps = menuPinned
      ? { className: "pinned-data-viewer-menu" }
      : {
          className: "column-toggle__dropdown",
          hidden: !menuOpen,
          style: {
            minWidth: "15em",
            top: hasNoInfo ? "1em" : "2em",
            left: "0.5em",
          },
        };
    const height = `calc(100vh - ${menuPinned ? 35 : hasNoInfo ? 68 : 98}px)`;
    return (
      <div {...containerProps}>
        {!menuPinned && menuOpen && (
          <GlobalHotKeys keyMap={{ CLOSE_MENU: "esc" }} handlers={{ CLOSE_MENU: closeMenu }} />
        )}
        <header
          className={`${mainTitleFont ? "" : "title-font "}title-font-base pb-1`}
          style={mainTitleFont ? { fontFamily: mainTitleFont } : {}}>
          {mainTitle ?? "D-TALE"}
        </header>
        <div
          style={{
            [menuPinned ? "height" : "maxHeight"]: height,
            overflowY: "scroll",
            overflowX: "hidden",
          }}>
          <ul>
            <NewTabOption />
            <XArrayOption columns={_.reject(this.props.columns, { name: "dtale_index" })} />
            <DescribeOption open={buttonHandlers.DESCRIBE} />
            <FilterOption open={() => this.props.showSidePanel("filter")} />
            <PredefinedFiltersOption open={() => this.props.showSidePanel("predefined_filters")} />
            <ShowHideColumnsOption open={() => this.props.showSidePanel("show_hide")} />
            <BuildColumnOption open={buttonHandlers.BUILD} />
            <CleanColumn open={buttonHandlers.CLEAN} />
            <MergeOption open={() => window.open(menuFuncs.fullPath("/dtale/popup/merge"), "_blank")} />
            <SummarizeOption open={openPopup("reshape", 400, 770)} />
            <TimeseriesOption open={openPopup("timeseries", 400, 770)} />
            <DuplicatesOption open={buttonHandlers.DUPLICATES} />
            <MissingOption open={() => this.props.showSidePanel("missingno")} />
            <CorrelationAnalysisOption open={() => this.props.showSidePanel("corr_analysis")} />
            <CorrelationsOption open={() => this.props.showSidePanel("correlations")} />
            <PPSOption open={() => this.props.showSidePanel("pps")} />
            <ChartsOption open={buttonHandlers.CHARTS} />
            <NetworkOption open={buttonHandlers.NETWORK} />
            <HeatMapOption backgroundMode={backgroundMode} toggleBackground={toggleBackground} />
            <HighlightOption open={toggleBackground("dtypes")} mode="dtypes" label="Dtypes" current={backgroundMode} />
            <HighlightOption
              open={toggleBackground("missing")}
              mode="missing"
              label="Missing"
              current={backgroundMode}
            />
            <HighlightOption open={toggleOutlierBackground} mode="outliers" label="Outliers" current={backgroundMode} />
            <RangeHighlightOption {...this.props} />
            <LowVarianceOption
              toggleLowVarianceBackground={toggleBackground("lowVariance")}
              backgroundMode={backgroundMode}
            />
            <GageRnROption open={() => this.props.showSidePanel("gage_rnr")} />
            <InstancesOption open={openPopup("instances", 450, 750)} />
            <CodeExportOption open={buttonHandlers.CODE} />
            <ExportOption open={exportFile} />
            <UploadOption open={openPopup("upload", 450)} />
            <MenuItem description={t("menu_description:widths")} onClick={refreshWidths}>
              <span className="toggler-action">
                <button className="btn btn-plain">
                  <i className="fas fa-columns ml-2 mr-4" />
                  <span className="font-weight-bold">{t("Refresh Widths", { ns: "menu" })}</span>
                </button>
              </span>
            </MenuItem>
            <AboutOption open={buttonHandlers.ABOUT} />
            <ThemeOption />
            <ReloadOption />
            <PinMenuOption />
            <LanguageOption />
            <LogoutOption open={buttonHandlers.LOGOUT} />
            <ShutdownOption open={buttonHandlers.SHUTDOWN} />
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
  dataId: PropTypes.string.isRequired,
  menuPinned: PropTypes.bool,
  showSidePanel: PropTypes.func,
  mainTitle: PropTypes.string,
  mainTitleFont: PropTypes.string,
  t: PropTypes.func,
  isVSCode: PropTypes.bool,
};

const TranslatedReactDataViewMenu = withTranslation(["menu", "menu_description", "code_export"])(ReactDataViewerMenu);
const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "menuPinned", "mainTitle", "mainTitleFont", "isVSCode"]),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    showSidePanel: view => dispatch({ type: "show-side-panel", view }),
  })
)(TranslatedReactDataViewMenu);

export { ReduxDataViewerMenu as DataViewerMenu, TranslatedReactDataViewMenu as ReactDataViewerMenu };
