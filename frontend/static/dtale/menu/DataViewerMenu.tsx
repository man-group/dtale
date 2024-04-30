import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions, SidePanelActionProps } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import * as selectors from '../../redux/selectors';
import { Popups, PopupType, SidePanelType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';

import AboutOption from './AboutOption';
import ArcticDBOption from './ArcticDBOption';
import BuildColumnOption from './BuildColumnOption';
import ChartsOption from './ChartsOption';
import CleanColumn from './CleanOption';
import CodeExportOption from './CodeExportOption';
import CorrelationAnalysisOption from './CorrelationAnalysisOption';
import CorrelationsOption from './CorrelationsOption';
import * as menuFuncs from './dataViewerMenuUtils';
import DescribeOption from './DescribeOption';
import DuplicatesOption from './DuplicatesOption';
import ExportOption from './ExportOption';
import FilterOption from './FilterOption';
import GageRnROption from './GageRnROption';
import HeatMapOption from './HeatMapOption';
import HighlightOption from './HighlightOption';
import InstancesOption from './InstancesOption';
import JumpToColumnOption from './JumpToColumnOption';
import LanguageOption from './LanguageOption';
import LogoutOption from './LogoutOption';
import LowVarianceOption from './LowVarianceOption';
import { MenuItem } from './MenuItem';
import MergeOption from './MergeOption';
import MissingOption from './MissingOption';
import NetworkOption from './NetworkOption';
import NewTabOption from './NewTabOption';
import PinMenuOption from './PinMenuOption';
import PPSOption from './PPSOption';
import PredefinedFiltersOption from './PredefinedFiltersOption';
import RangeHighlightOption from './RangeHighlightOption';
import RawPandasOption from './RawPandasOutputOption';
import ReloadOption from './ReloadOption';
import ShowHideColumnsOption from './ShowHideColumnsOption';
import ShutdownOption from './ShutdownOption';
import SummarizeOption from './SummarizeOption';
import ThemeOption from './ThemeOption';
import TimeseriesAnalysisOption from './TimeseriesAnalysisOption';
import UploadOption from './UploadOption';
import XArrayOption from './XArrayOption';

/** Component properties for DataViewerMenu */
export interface DataViewerMenuProps {
  columns: ColumnDef[];
  rows: number;
  propagateState: DataViewerPropagateState;
}

const selectResult = createSelector(
  [
    selectors.selectDataId,
    selectors.selectMenuPinned,
    selectors.selectMainTitle,
    selectors.selectMainTitleFont,
    selectors.selectIsArcticDB,
    selectors.selectIsVSCode,
    selectors.selectSettings,
    selectors.selectMenuOpen,
    selectors.selectColumnCount,
  ],
  (dataId, menuPinned, mainTitle, mainTitleFont, isArcticDB, isVSCode, settings, menuOpen, columnCount) => ({
    dataId,
    menuPinned,
    mainTitle,
    mainTitleFont,
    isArcticDB,
    isVSCode,
    settings,
    menuOpen,
    columnCount,
  }),
);

const DataViewerMenu: React.FC<DataViewerMenuProps & WithTranslation> = ({ t, columns, rows, propagateState }) => {
  const { dataId, menuPinned, mainTitle, mainTitleFont, isArcticDB, isVSCode, settings, menuOpen, columnCount } =
    useAppSelector(selectResult);
  const largeArcticDB = React.useMemo(
    () => !!isArcticDB && (isArcticDB >= 1_000_000 || columnCount > 100),
    [isArcticDB, columnCount],
  );
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const openMenu = (): PayloadAction<void> => dispatch(AppActions.OpenMenuAction());
  const closeMenu = (): PayloadAction<void> => dispatch(AppActions.CloseMenuAction());
  const showSidePanel = (view: SidePanelType): PayloadAction<SidePanelActionProps> =>
    dispatch(AppActions.ShowSidePanelAction({ view }));
  const updateBg = (bgType: string): void =>
    dispatch(
      settingsActions.updateSettings({
        backgroundMode: settings.backgroundMode === bgType ? undefined : bgType,
      }),
    );

  const buttonHandlers = menuFuncs.buildHotkeyHandlers({ dataId, columns, openChart, openMenu, closeMenu, isVSCode });
  const { openPopup } = buttonHandlers;
  const refreshWidths = (): void => propagateState({ columns: columns.map((c) => ({ ...c })) });
  const hasNoInfo = gu.hasNoInfo({ ...settings, isArcticDB }, columns);
  const containerProps = menuPinned
    ? { className: 'pinned-data-viewer-menu' }
    : {
        className: 'column-toggle__dropdown',
        hidden: !menuOpen,
        style: {
          minWidth: '15em',
          top: hasNoInfo ? '1em' : '2em',
          left: '0.5em',
        },
      };
  const height = `calc(100vh - ${menuPinned ? 35 : hasNoInfo ? 68 : 98}px)`;
  return (
    <div data-testid="data-viewer-menu" {...containerProps}>
      {!menuPinned && menuOpen && (
        <GlobalHotKeys
          keyMap={{ CLOSE_MENU: 'esc' }}
          handlers={{ CLOSE_MENU: (): void => document.getElementsByTagName('body')[0].click() }}
        />
      )}
      <header
        className={`${mainTitleFont ? '' : 'title-font '}title-font-base pb-1`}
        style={mainTitleFont ? { fontFamily: mainTitleFont } : {}}
      >
        {mainTitle ?? 'D-TALE'}
      </header>
      <div
        style={{
          [menuPinned ? 'height' : 'maxHeight']: height,
          overflowY: 'scroll',
          overflowX: 'hidden',
        }}
      >
        <ul>
          <NewTabOption />
          {!!isArcticDB && <ArcticDBOption open={openPopup({ type: PopupType.ARCTICDB, visible: true }, 450)} />}
          {columnCount > 100 && (
            <JumpToColumnOption open={openPopup({ type: PopupType.JUMP_TO_COLUMN, columns, visible: true }, 450)} />
          )}
          {!isArcticDB && <XArrayOption columns={columns.filter(({ name }) => name !== gu.IDX)} />}
          <DescribeOption open={buttonHandlers.DESCRIBE} />
          {!isArcticDB && <FilterOption open={() => showSidePanel(SidePanelType.FILTER)} />}
          {!isArcticDB && <PredefinedFiltersOption open={() => showSidePanel(SidePanelType.PREDEFINED_FILTERS)} />}
          <ShowHideColumnsOption open={() => showSidePanel(SidePanelType.SHOW_HIDE)} />
          {!isArcticDB && <BuildColumnOption open={buttonHandlers.BUILD} />}
          {!isArcticDB && <CleanColumn open={buttonHandlers.CLEAN} />}
          {!isArcticDB && <MergeOption open={() => window.open(menuFuncs.fullPath('/dtale/popup/merge'), '_blank')} />}
          {!isArcticDB && (
            <SummarizeOption open={openPopup({ type: PopupType.RESHAPE, title: 'Reshape', visible: true }, 400, 770)} />
          )}
          {!largeArcticDB && <TimeseriesAnalysisOption open={() => showSidePanel(SidePanelType.TIMESERIES_ANALYSIS)} />}
          {!largeArcticDB && <DuplicatesOption open={buttonHandlers.DUPLICATES} />}
          {!largeArcticDB && <MissingOption open={() => showSidePanel(SidePanelType.MISSINGNO)} />}
          {!largeArcticDB && <CorrelationAnalysisOption open={() => showSidePanel(SidePanelType.CORR_ANALYSIS)} />}
          {!largeArcticDB && <CorrelationsOption open={() => showSidePanel(SidePanelType.CORRELATIONS)} />}
          {!largeArcticDB && <PPSOption open={() => showSidePanel(SidePanelType.PPS)} />}
          <ChartsOption open={buttonHandlers.CHARTS} />
          <NetworkOption open={buttonHandlers.NETWORK} />
          {!largeArcticDB && <HeatMapOption toggleBackground={updateBg} />}
          <HighlightOption
            open={() => updateBg('dtypes')}
            mode="dtypes"
            label="Dtypes"
            current={settings.backgroundMode}
          />
          <HighlightOption
            open={() => updateBg('missing')}
            mode="missing"
            label="Missing"
            current={settings.backgroundMode}
          />
          {!largeArcticDB && (
            <HighlightOption
              open={() => updateBg('outliers')}
              mode="outliers"
              label="Outliers"
              current={settings.backgroundMode}
            />
          )}
          <RangeHighlightOption columns={columns} />
          {!largeArcticDB && (
            <LowVarianceOption
              toggleLowVarianceBackground={() => updateBg('lowVariance')}
              backgroundMode={settings.backgroundMode}
            />
          )}
          {!largeArcticDB && <GageRnROption open={() => showSidePanel(SidePanelType.GAGE_RNR)} />}
          {!isArcticDB && <RawPandasOption open={buttonHandlers.RAW_PANDAS} />}
          {!isArcticDB && (
            <InstancesOption
              open={openPopup({ type: PopupType.INSTANCES, title: 'Instances', visible: true }, 450, 750)}
            />
          )}
          <CodeExportOption open={buttonHandlers.CODE} />
          <ExportOption rows={rows} />
          {!isArcticDB && <UploadOption open={openPopup({ type: PopupType.UPLOAD, visible: true }, 450)} />}
          <MenuItem description={t('menu_description:widths')} onClick={refreshWidths}>
            <span className="toggler-action">
              <button className="btn btn-plain">
                <i className="fas fa-columns ml-2 mr-4" />
                <span className="font-weight-bold">{t('Refresh Widths', { ns: 'menu' })}</span>
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
};

export default withTranslation(['menu', 'menu_description', 'code_export'])(DataViewerMenu);
