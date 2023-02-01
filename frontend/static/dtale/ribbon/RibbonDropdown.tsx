import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import {
  ActionType,
  HideRibbonMenuAction,
  OpenChartAction,
  SidePanelAction,
  ToggleMenuAction,
} from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, Popups, PopupType, RibbonDropdownType, SidePanelType } from '../../redux/state/AppState';
import * as InstanceRepository from '../../repository/InstanceRepository';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import AboutOption from '../menu/AboutOption';
import BuildColumnOption from '../menu/BuildColumnOption';
import ChartsOption from '../menu/ChartsOption';
import CleanColumn from '../menu/CleanOption';
import CodeExportOption from '../menu/CodeExportOption';
import CorrelationAnalysisOption from '../menu/CorrelationAnalysisOption';
import CorrelationsOption from '../menu/CorrelationsOption';
import { buildHotkeyHandlers, fullPath } from '../menu/dataViewerMenuUtils';
import DescribeOption from '../menu/DescribeOption';
import DuplicatesOption from '../menu/DuplicatesOption';
import ExportOption from '../menu/ExportOption';
import FilterOption from '../menu/FilterOption';
import GageRnROption from '../menu/GageRnROption';
import HeatMapOption from '../menu/HeatMapOption';
import HideHeaderEditor from '../menu/HideHeaderEditor';
import HighlightOption from '../menu/HighlightOption';
import InstancesOption from '../menu/InstancesOption';
import LanguageOption from '../menu/LanguageOption';
import LogoutOption from '../menu/LogoutOption';
import LowVarianceOption from '../menu/LowVarianceOption';
import { MaxHeightOption, MaxWidthOption } from '../menu/MaxDimensionOption';
import { MenuItem } from '../menu/MenuItem';
import MergeOption from '../menu/MergeOption';
import MissingOption from '../menu/MissingOption';
import NetworkOption from '../menu/NetworkOption';
import NewTabOption from '../menu/NewTabOption';
import PPSOption from '../menu/PPSOption';
import PredefinedFiltersOption from '../menu/PredefinedFiltersOption';
import RangeHighlightOption from '../menu/RangeHighlightOption';
import ReloadOption from '../menu/ReloadOption';
import ShowHideColumnsOption from '../menu/ShowHideColumnsOption';
import ShowNonNumericHeatmapColumns from '../menu/ShowNonNumericHeatmapColumns';
import ShutdownOption from '../menu/ShutdownOption';
import SummarizeOption from '../menu/SummarizeOption';
import ThemeOption from '../menu/ThemeOption';
import TimeseriesAnalysisOption from '../menu/TimeseriesAnalysisOption';
import UploadOption from '../menu/UploadOption';
import VerticalColumnHeaders from '../menu/VerticalColumnHeaders';
import XArrayOption from '../menu/XArrayOption';

import DataMenuItem from './DataMenuItem';

const positionMenu = (selectedItem: HTMLElement | undefined, menuDiv: HTMLElement): React.CSSProperties => {
  if (!selectedItem) {
    return {};
  }
  const rect = selectedItem.getBoundingClientRect();
  const menuRect = menuDiv.getBoundingClientRect();
  const currLeft = rect.left;
  const currTop = rect.top + gu.ROW_HEIGHT;
  const divWidth = menuRect.width;
  const css: React.CSSProperties = {};
  if (currLeft + divWidth > window.innerWidth) {
    const finalLeft = currLeft - (currLeft + divWidth + 20 - window.innerWidth);
    css.left = finalLeft;
  } else {
    css.left = currLeft;
  }
  css.top = currTop;
  return css;
};

/** Component properties for RibbonDropdown */
export interface RibbonDropdownProps {
  columns: ColumnDef[];
  rows: number;
  propagateState: DataViewerPropagateState;
}

const RibbonDropdown: React.FC<RibbonDropdownProps & WithTranslation> = ({ columns, rows, propagateState, t }) => {
  const { dataId, isVSCode, element, name, settings, visible } = useSelector((state: AppState) => ({
    ...state.ribbonDropdown,
    dataId: state.dataId,
    isVSCode: state.isVSCode,
    settings: state.settings,
  }));
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const openMenu = (): ToggleMenuAction => dispatch({ type: ActionType.OPEN_MENU });
  const closeMenu = (): ToggleMenuAction => dispatch({ type: ActionType.CLOSE_MENU });
  const hideRibbonMenu = (): HideRibbonMenuAction => dispatch({ type: ActionType.HIDE_RIBBON_MENU });
  const showSidePanel = (view: SidePanelType): SidePanelAction => dispatch({ type: ActionType.SHOW_SIDE_PANEL, view });
  const updateBg = (bgType: string): AnyAction =>
    dispatch(
      settingsActions.updateSettings({
        backgroundMode: settings.backgroundMode === bgType ? undefined : bgType,
      }) as any as AnyAction,
    );

  const [style, setStyle] = React.useState<React.CSSProperties>();
  const [processes, setProcesses] = React.useState<InstanceRepository.ProcessKey[]>([]);
  const [processLoad, setProcessLoad] = React.useState<Date>();

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const now = new Date();
    if (
      name === RibbonDropdownType.MAIN &&
      (!processLoad || Math.ceil(((now.valueOf() - processLoad.valueOf()) / 1000) * 60) > 5)
    ) {
      InstanceRepository.loadProcessKeys().then((response) => {
        if (response?.success) {
          setProcesses(response.data);
          setProcessLoad(now);
        }
      });
    }
    if (ref.current) {
      setStyle(positionMenu(element, ref.current));
    }
  }, [name]);

  const cleanup = async (id: string): Promise<void> => {
    const response = await InstanceRepository.cleanupInstance(id);
    if (response?.success) {
      setProcesses((processes ?? []).filter((process) => process.id !== id));
    }
  };

  const cleanupThis = (): void => {
    cleanup(dataId);
    window.location.reload();
  };

  const hideWrapper =
    (func: () => void): (() => void) =>
    () => {
      func();
      hideRibbonMenu();
    };

  const buttonHandlers = React.useMemo(
    () => buildHotkeyHandlers({ columns, openChart, openMenu, closeMenu, dataId, isVSCode }),
    [columns, propagateState, openChart, dataId, isVSCode],
  );
  const { openPopup } = buttonHandlers;
  return (
    <div
      className={`ribbon-menu-dd-content${visible ? ' is-expanded' : ''}`}
      style={style}
      ref={ref}
      onClick={(e): void => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {name === RibbonDropdownType.MAIN && visible && (
        <ul>
          <NewTabOption />
          <UploadOption open={hideWrapper(openPopup({ type: PopupType.UPLOAD, visible: true }, 450))} />
          <CodeExportOption open={hideWrapper(buttonHandlers.CODE)} />
          <ExportOption rows={rows} ribbonWrapper={hideWrapper} />
          <ReloadOption />
          <InstancesOption open={hideWrapper(openPopup({ type: PopupType.INSTANCES, visible: true }, 450, 750))} />
          <MenuItem description={t('menu_description:clear_data')} onClick={cleanupThis}>
            <span className="toggler-action">
              <button className="btn btn-plain">
                <i className="ico-delete ml-2 mr-4" />
                <span className="font-weight-bold align-middle">{t('Clear Data', { ns: 'menu' })}</span>
              </button>
            </span>
          </MenuItem>
          {processes.length > 1 && (
            <>
              <li>
                <span className="font-weight-bold w-100 text-center">Other Data</span>
              </li>
              {processes
                .filter((process) => process.id !== dataId)
                .map((process) => (
                  <DataMenuItem key={process.id} {...process} cleanup={cleanup} />
                ))}
            </>
          )}
          <AboutOption open={hideWrapper(buttonHandlers.ABOUT)} />
          <LogoutOption open={buttonHandlers.LOGOUT} />
          <ShutdownOption open={buttonHandlers.SHUTDOWN} />
        </ul>
      )}
      {name === RibbonDropdownType.ACTIONS && visible && (
        <ul>
          <ShowHideColumnsOption open={hideWrapper(() => showSidePanel(SidePanelType.SHOW_HIDE))} />
          <XArrayOption columns={columns.filter((col) => col.name !== 'dtale_index')} />
          <FilterOption open={hideWrapper(() => showSidePanel(SidePanelType.FILTER))} />
          <PredefinedFiltersOption open={() => showSidePanel(SidePanelType.PREDEFINED_FILTERS)} />
          <BuildColumnOption open={hideWrapper(buttonHandlers.BUILD)} />
          <CleanColumn open={hideWrapper(buttonHandlers.CLEAN)} />
          <MergeOption open={hideWrapper(() => window.open(fullPath('/dtale/popup/merge'), '_blank'))} />
          <SummarizeOption open={hideWrapper(openPopup({ type: PopupType.RESHAPE, visible: true }, 400, 770))} />
          <CorrelationAnalysisOption open={hideWrapper(() => showSidePanel(SidePanelType.CORR_ANALYSIS))} />
        </ul>
      )}
      {name === RibbonDropdownType.VISUALIZE && visible && (
        <ul>
          <DescribeOption open={hideWrapper(buttonHandlers.DESCRIBE)} />
          <DuplicatesOption open={hideWrapper(buttonHandlers.DUPLICATES)} />
          <MissingOption open={hideWrapper(() => showSidePanel(SidePanelType.MISSINGNO))} />
          <CorrelationsOption open={hideWrapper(() => showSidePanel(SidePanelType.CORRELATIONS))} />
          <PPSOption open={hideWrapper(() => showSidePanel(SidePanelType.PPS))} />
          <TimeseriesAnalysisOption open={hideWrapper(() => showSidePanel(SidePanelType.TIMESERIES_ANALYSIS))} />
          <ChartsOption open={hideWrapper(buttonHandlers.CHARTS)} />
          <NetworkOption open={hideWrapper(buttonHandlers.NETWORK)} />
          <GageRnROption open={hideWrapper(() => showSidePanel(SidePanelType.GAGE_RNR))} />
        </ul>
      )}
      {name === RibbonDropdownType.HIGHLIGHT && visible && (
        <ul>
          <HeatMapOption toggleBackground={updateBg} />
          <HighlightOption
            open={hideWrapper(() => updateBg('dtypes'))}
            mode="dtypes"
            label="Dtypes"
            current={settings.backgroundMode}
          />
          <HighlightOption
            open={hideWrapper(() => updateBg('missing'))}
            mode="missing"
            label="Missing"
            current={settings.backgroundMode}
          />
          <HighlightOption
            open={hideWrapper(() => updateBg('outliers'))}
            mode="outliers"
            label="Outliers"
            current={settings.backgroundMode}
          />
          <RangeHighlightOption {...{ columns, propagateState }} ribbonWrapper={hideWrapper} />
          <LowVarianceOption
            toggleLowVarianceBackground={() => updateBg('lowVariance')}
            backgroundMode={settings.backgroundMode}
          />
        </ul>
      )}
      {name === RibbonDropdownType.SETTINGS && visible && (
        <ul>
          <ThemeOption ribbonWrapper={hideWrapper} />
          <LanguageOption ribbonWrapper={hideWrapper} />
          <MaxWidthOption />
          <MaxHeightOption />
          <ShowNonNumericHeatmapColumns />
          <VerticalColumnHeaders />
          <HideHeaderEditor />
        </ul>
      )}
    </div>
  );
};

export default withTranslation(['menu', 'menu_description', 'code_export'])(RibbonDropdown);
