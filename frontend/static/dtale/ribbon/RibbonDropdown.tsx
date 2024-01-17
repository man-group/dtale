import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { AppActions, SidePanelActionProps } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import * as selectors from '../../redux/selectors';
import { Popups, PopupType, RibbonDropdownType, SidePanelType } from '../../redux/state/AppState';
import * as InstanceRepository from '../../repository/InstanceRepository';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import AboutOption from '../menu/AboutOption';
import ArcticDBOption from '../menu/ArcticDBOption';
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
import JumpToColumnOption from '../menu/JumpToColumnOption';
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

const selectResult = createSelector(
  [
    selectors.selectDataId,
    selectors.selectIsVSCode,
    selectors.selectSettings,
    selectors.selectIsArcticDB,
    selectors.selectColumnCount,
    selectors.selectRibbonDropdownVisible,
    selectors.selectRibbonDropdownElement,
    selectors.selectRibbonDropdownName,
  ],
  (dataId, isVSCode, settings, isArcticDB, columnCount, visible, element, name) => ({
    dataId,
    isVSCode,
    settings,
    isArcticDB,
    columnCount,
    visible,
    element,
    name,
  }),
);

const RibbonDropdown: React.FC<RibbonDropdownProps & WithTranslation> = ({ columns, rows, propagateState, t }) => {
  const { dataId, isVSCode, element, name, settings, visible, isArcticDB, columnCount } = useAppSelector(selectResult);
  const largeArcticDB = React.useMemo(
    () => !!isArcticDB && (isArcticDB >= 1_000_000 || columnCount > 100),
    [isArcticDB, columnCount],
  );
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const openMenu = (): PayloadAction<void> => dispatch(AppActions.OpenMenuAction());
  const closeMenu = (): PayloadAction<void> => dispatch(AppActions.CloseMenuAction());
  const hideRibbonMenu = (): PayloadAction<void> => dispatch(AppActions.HideRibbonMenuAction());
  const showSidePanel = (view: SidePanelType): PayloadAction<SidePanelActionProps> =>
    dispatch(AppActions.ShowSidePanelAction({ view }));
  const updateBg = (bgType: string): void =>
    dispatch(
      settingsActions.updateSettings({
        backgroundMode: settings.backgroundMode === bgType ? undefined : bgType,
      }),
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
      data-testid="ribbon-dropdown"
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
          {!!isArcticDB && (
            <ArcticDBOption open={hideWrapper(openPopup({ type: PopupType.ARCTICDB, visible: true }, 450))} />
          )}
          {columnCount > 100 && (
            <JumpToColumnOption
              open={hideWrapper(openPopup({ type: PopupType.JUMP_TO_COLUMN, columns, visible: true }, 450))}
            />
          )}
          {!isArcticDB && (
            <UploadOption open={hideWrapper(openPopup({ type: PopupType.UPLOAD, visible: true }, 450))} />
          )}
          <CodeExportOption open={hideWrapper(buttonHandlers.CODE)} />
          <ExportOption rows={rows} ribbonWrapper={hideWrapper} />
          <ReloadOption />
          {!isArcticDB && (
            <InstancesOption open={hideWrapper(openPopup({ type: PopupType.INSTANCES, visible: true }, 450, 750))} />
          )}
          {!isArcticDB && (
            <MenuItem description={t('menu_description:clear_data')} onClick={cleanupThis}>
              <span className="toggler-action">
                <button className="btn btn-plain">
                  <i className="ico-delete ml-2 mr-4" />
                  <span className="font-weight-bold align-middle">{t('Clear Data', { ns: 'menu' })}</span>
                </button>
              </span>
            </MenuItem>
          )}
          {!isArcticDB && processes.length > 1 && (
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
          {!isArcticDB && <XArrayOption columns={columns.filter((col) => col.name !== 'dtale_index')} />}
          {!isArcticDB && <FilterOption open={hideWrapper(() => showSidePanel(SidePanelType.FILTER))} />}
          {!isArcticDB && <PredefinedFiltersOption open={() => showSidePanel(SidePanelType.PREDEFINED_FILTERS)} />}
          {!isArcticDB && <BuildColumnOption open={hideWrapper(buttonHandlers.BUILD)} />}
          {!isArcticDB && <CleanColumn open={hideWrapper(buttonHandlers.CLEAN)} />}
          {!isArcticDB && (
            <MergeOption open={hideWrapper(() => window.open(fullPath('/dtale/popup/merge'), '_blank'))} />
          )}
          {!isArcticDB && (
            <SummarizeOption open={hideWrapper(openPopup({ type: PopupType.RESHAPE, visible: true }, 400, 770))} />
          )}
          {!largeArcticDB && (
            <CorrelationAnalysisOption open={hideWrapper(() => showSidePanel(SidePanelType.CORR_ANALYSIS))} />
          )}
        </ul>
      )}
      {name === RibbonDropdownType.VISUALIZE && visible && (
        <ul>
          <DescribeOption open={hideWrapper(buttonHandlers.DESCRIBE)} />
          {!largeArcticDB && <DuplicatesOption open={hideWrapper(buttonHandlers.DUPLICATES)} />}
          {!largeArcticDB && <MissingOption open={hideWrapper(() => showSidePanel(SidePanelType.MISSINGNO))} />}
          {!largeArcticDB && <CorrelationsOption open={hideWrapper(() => showSidePanel(SidePanelType.CORRELATIONS))} />}
          {!largeArcticDB && <PPSOption open={hideWrapper(() => showSidePanel(SidePanelType.PPS))} />}
          {!largeArcticDB && (
            <TimeseriesAnalysisOption open={hideWrapper(() => showSidePanel(SidePanelType.TIMESERIES_ANALYSIS))} />
          )}
          <ChartsOption open={hideWrapper(buttonHandlers.CHARTS)} />
          <NetworkOption open={hideWrapper(buttonHandlers.NETWORK)} />
          {!largeArcticDB && <GageRnROption open={hideWrapper(() => showSidePanel(SidePanelType.GAGE_RNR))} />}
        </ul>
      )}
      {name === RibbonDropdownType.HIGHLIGHT && visible && (
        <ul>
          {!largeArcticDB && <HeatMapOption toggleBackground={updateBg} />}
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
          {!largeArcticDB && (
            <HighlightOption
              open={hideWrapper(() => updateBg('outliers'))}
              mode="outliers"
              label="Outliers"
              current={settings.backgroundMode}
            />
          )}
          <RangeHighlightOption {...{ columns, propagateState }} ribbonWrapper={hideWrapper} />
          {!largeArcticDB && (
            <LowVarianceOption
              toggleLowVarianceBackground={() => updateBg('lowVariance')}
              backgroundMode={settings.backgroundMode}
            />
          )}
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
