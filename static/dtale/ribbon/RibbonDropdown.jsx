import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import { fetchJsonPromise, logException } from "../../fetcher";
import { executeCleanup } from "../../popups/instances/Instances";
import * as gu from "../gridUtils";
import AboutOption from "../menu/AboutOption";
import BuildColumnOption from "../menu/BuildColumnOption";
import ChartsOption from "../menu/ChartsOption";
import CleanColumn from "../menu/CleanOption";
import CodeExportOption from "../menu/CodeExportOption";
import CorrelationAnalysisOption from "../menu/CorrelationAnalysisOption";
import CorrelationsOption from "../menu/CorrelationsOption";
import DescribeOption from "../menu/DescribeOption";
import DuplicatesOption from "../menu/DuplicatesOption";
import ExportOption from "../menu/ExportOption";
import FilterOption from "../menu/FilterOption";
import GageRnROption from "../menu/GageRnROption";
import { HeatMapOption } from "../menu/HeatMapOption";
import HighlightOption from "../menu/HighlightOption";
import InstancesOption from "../menu/InstancesOption";
import { LanguageOption } from "../menu/LanguageOption";
import { LogoutOption } from "../menu/LogoutOption";
import LowVarianceOption from "../menu/LowVarianceOption";
import { MaxHeightOption, MaxWidthOption } from "../menu/MaxDimensionOption";
import { MenuItem } from "../menu/MenuItem";
import MergeOption from "../menu/MergeOption";
import MissingOption from "../menu/MissingOption";
import NetworkOption from "../menu/NetworkOption";
import NewTabOption from "../menu/NewTabOption";
import { PPSOption } from "../menu/PPSOption";
import { PredefinedFiltersOption } from "../menu/PredefinedFiltersOption";
import RangeHighlightOption from "../menu/RangeHighlightOption";
import ReloadOption from "../menu/ReloadOption";
import ShowHideColumnsOption from "../menu/ShowHideColumnsOption";
import { ShowNonNumericHeatmapColumns } from "../menu/ShowNonNumericHeatmapColumns";
import { ShutdownOption } from "../menu/ShutdownOption";
import SummarizeOption from "../menu/SummarizeOption";
import { ThemeOption } from "../menu/ThemeOption";
import TimeseriesOption from "../menu/TimeseriesOption";
import UploadOption from "../menu/UploadOption";
import { VerticalColumnHeaders } from "../menu/VerticalColumnHeaders";
import { XArrayOption } from "../menu/XArrayOption";
import menuFuncs from "../menu/dataViewerMenuUtils";
import { DataMenuItem } from "./DataMenuItem";

function positionMenu(selectedItem, menuDiv) {
  if (!selectedItem) {
    return {};
  }
  const rect = selectedItem.getBoundingClientRect();
  const menuRect = menuDiv.getBoundingClientRect();
  const currLeft = rect.left;
  const currTop = rect.top + gu.ROW_HEIGHT;
  const divWidth = menuRect.width;
  const css = {};
  if (currLeft + divWidth > window.innerWidth) {
    const finalLeft = currLeft - (currLeft + divWidth + 20 - window.innerWidth);
    css.left = finalLeft;
  } else {
    css.left = currLeft;
  }
  css.top = currTop;
  return css;
}

class ReactRibbonDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = { style: {}, processes: [], processLoad: null };
    this.ref = React.createRef();
    this.onClick = this.onClick.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.cleanupThis = this.cleanupThis.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name) {
      const { processLoad } = this.state;
      const now = new Date();
      if (this.props.name === "main" && (!processLoad || Math.ceil(((now - processLoad) / 1000) * 60) > 5)) {
        fetchJsonPromise(menuFuncs.fullPath("/dtale/process-keys"))
          .then(keys => {
            if (!keys.error) {
              this.setState({ processes: keys.data, processLoad: now });
            }
          })
          .catch((e, callstack) => {
            logException(e, callstack);
          });
      }
      this.setState({
        style: positionMenu(this.props.element, this.ref.current),
      });
    }
  }

  onClick(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  cleanup(id) {
    executeCleanup(id, () => {
      const currProcesses = _.get(this.state, "processes") || [];
      const processes = _.reject(currProcesses, { id });
      this.setState({ processes });
    });
  }

  cleanupThis() {
    this.cleanup(this.props.dataId);
    window.location.reload();
  }

  render() {
    const { visible, name } = this.props;
    const { dataId, backgroundMode, t } = this.props;
    const hideWrapper = func => () => {
      func();
      this.props.hideRibbonMenu();
    };
    const { processes } = this.state;
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    const { openPopup, toggleBackground, toggleOutlierBackground, exportFile } = buttonHandlers;
    const ribbonExport = ext => () => {
      exportFile(ext)();
      this.props.hideRibbonMenu();
    };
    return (
      <div
        className={`ribbon-menu-dd-content${visible ? " is-expanded" : ""}`}
        style={this.state.style}
        ref={this.ref}
        onClick={this.onClick}>
        {name === "main" && visible && (
          <ul>
            <NewTabOption />
            <UploadOption open={hideWrapper(openPopup("upload", 450))} />
            <CodeExportOption open={hideWrapper(buttonHandlers.CODE)} />
            <ExportOption open={ribbonExport} />
            <ReloadOption />
            <InstancesOption open={hideWrapper(openPopup("instances", 450, 750))} />
            <MenuItem description={t("menu_description:clear_data")} onClick={this.cleanupThis}>
              <span className="toggler-action">
                <button className="btn btn-plain">
                  <i className="ico-delete ml-2 mr-4" />
                  <span className="font-weight-bold align-middle">{t("Clear Data", { ns: "menu" })}</span>
                </button>
              </span>
            </MenuItem>
            {processes.length > 1 && (
              <>
                <li>
                  <span className="font-weight-bold w-100 text-center">Other Data</span>
                </li>
                {processes
                  .filter(process => process.id !== dataId)
                  .map(({ id, name }) => (
                    <DataMenuItem key={id} name={name} id={id} cleanup={this.cleanup} />
                  ))}
              </>
            )}
            <AboutOption open={hideWrapper(buttonHandlers.ABOUT)} />
            <LogoutOption open={buttonHandlers.LOGOUT} />
            <ShutdownOption open={buttonHandlers.SHUTDOWN} />
          </ul>
        )}
        {name === "actions" && visible && (
          <ul>
            <ShowHideColumnsOption open={hideWrapper(() => this.props.showSidePanel("show_hide"))} />
            <XArrayOption columns={_.reject(this.props.columns, { name: "dtale_index" })} />
            <FilterOption open={hideWrapper(() => this.props.showSidePanel("filter"))} />
            <PredefinedFiltersOption open={() => this.props.showSidePanel("predefined_filters")} />
            <BuildColumnOption open={hideWrapper(buttonHandlers.BUILD)} />
            <CleanColumn open={hideWrapper(buttonHandlers.CLEAN)} />
            <MergeOption open={hideWrapper(() => window.open(menuFuncs.fullPath("/dtale/popup/merge"), "_blank"))} />
            <SummarizeOption open={hideWrapper(openPopup("reshape", 400, 770))} />
            <TimeseriesOption open={openPopup("timeseries", 400, 770)} />
            <CorrelationAnalysisOption open={hideWrapper(() => this.props.showSidePanel("corr_analysis"))} />
          </ul>
        )}
        {name === "visualize" && visible && (
          <ul>
            <DescribeOption open={hideWrapper(buttonHandlers.DESCRIBE)} />
            <DuplicatesOption open={hideWrapper(buttonHandlers.DUPLICATES)} />
            <MissingOption open={hideWrapper(() => this.props.showSidePanel("missingno"))} />
            <CorrelationsOption open={hideWrapper(() => this.props.showSidePanel("correlations"))} />
            <PPSOption open={hideWrapper(() => this.props.showSidePanel("pps"))} />
            <ChartsOption open={hideWrapper(buttonHandlers.CHARTS)} />
            <NetworkOption open={hideWrapper(buttonHandlers.NETWORK)} />
            <GageRnROption open={hideWrapper(() => this.props.showSidePanel("gage_rnr"))} />
          </ul>
        )}
        {name === "highlight" && visible && (
          <ul>
            <HeatMapOption backgroundMode={backgroundMode} toggleBackground={toggleBackground} />
            <HighlightOption
              open={hideWrapper(toggleBackground("dtypes"))}
              mode="dtypes"
              label="Dtypes"
              current={backgroundMode}
            />
            <HighlightOption
              open={hideWrapper(toggleBackground("missing"))}
              mode="missing"
              label="Missing"
              current={backgroundMode}
            />
            <HighlightOption
              open={hideWrapper(toggleOutlierBackground)}
              mode="outliers"
              label="Outliers"
              current={backgroundMode}
            />
            <RangeHighlightOption {...this.props} ribbonWrapper={hideWrapper} />
            <LowVarianceOption
              toggleLowVarianceBackground={toggleBackground("lowVariance")}
              backgroundMode={backgroundMode}
            />
          </ul>
        )}
        {name === "settings" && visible && (
          <ul>
            <ThemeOption ribbonWrapper={hideWrapper} />
            <LanguageOption ribbonWrapper={hideWrapper} />
            <MaxWidthOption ribbonWrapper={hideWrapper} />
            <MaxHeightOption ribbonWrapper={hideWrapper} />
            <ShowNonNumericHeatmapColumns backgroundMode={backgroundMode} toggleBackground={toggleBackground} />
            <VerticalColumnHeaders />
          </ul>
        )}
      </div>
    );
  }
}
ReactRibbonDropdown.displayName = "ReactRibbonDropdown";
ReactRibbonDropdown.propTypes = {
  dataId: PropTypes.string.isRequired,
  visible: PropTypes.bool,
  name: PropTypes.string,
  element: PropTypes.instanceOf(Element),
  hideRibbonMenu: PropTypes.func,
  columns: PropTypes.array,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  backgroundMode: PropTypes.string,
  rangeHighlight: PropTypes.object,
  showSidePanel: PropTypes.func,
  t: PropTypes.func,
  isVSCode: PropTypes.bool,
};
const TranslatedRibbonDropdown = withTranslation(["menu", "menu_description", "code_export"])(ReactRibbonDropdown);
const ReduxRibbonDropdown = connect(
  ({ ribbonDropdown, dataId, isVSCode }) => ({
    ...ribbonDropdown,
    dataId,
    isVSCode,
  }),
  dispatch => ({
    openChart: chartProps => dispatch(openChart(chartProps)),
    hideRibbonMenu: () => dispatch({ type: "hide-ribbon-menu" }),
    showSidePanel: view => dispatch({ type: "show-side-panel", view }),
  })
)(TranslatedRibbonDropdown);
export { ReduxRibbonDropdown as RibbonDropdown, TranslatedRibbonDropdown as ReactRibbonDropdown };
