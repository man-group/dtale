import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ActionType, OpenChartAction, SidePanelAction, ToggleMenuAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, Popups, PopupType, SidePanelType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';

import AboutOption from './AboutOption';
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

const DataViewerMenu: React.FC<DataViewerMenuProps & WithTranslation> = ({ t, columns, rows, propagateState }) => {
  const { dataId, menuPinned, mainTitle, mainTitleFont, isVSCode, settings, menuOpen } = useSelector(
    (state: AppState) => state,
  );
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const openMenu = (): ToggleMenuAction => dispatch({ type: ActionType.OPEN_MENU });
  const closeMenu = (): ToggleMenuAction => dispatch({ type: ActionType.CLOSE_MENU });
  const showSidePanel = (view: SidePanelType): SidePanelAction => dispatch({ type: ActionType.SHOW_SIDE_PANEL, view });
  const updateBg = (bgType: string): AnyAction =>
    dispatch(
      settingsActions.updateSettings({
        backgroundMode: settings.backgroundMode === bgType ? undefined : bgType,
      }) as any as AnyAction,
    );

  const buttonHandlers = menuFuncs.buildHotkeyHandlers({ dataId, columns, openChart, openMenu, closeMenu, isVSCode });
  const { openPopup } = buttonHandlers;
  const refreshWidths = (): void => propagateState({ columns: columns.map((c) => ({ ...c })) });
  const hasNoInfo = gu.hasNoInfo(settings, columns);
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
          <XArrayOption columns={columns.filter(({ name }) => name !== gu.IDX)} />
          <DescribeOption open={buttonHandlers.DESCRIBE} />
          <FilterOption open={() => showSidePanel(SidePanelType.FILTER)} />
          <PredefinedFiltersOption open={() => showSidePanel(SidePanelType.PREDEFINED_FILTERS)} />
          <ShowHideColumnsOption open={() => showSidePanel(SidePanelType.SHOW_HIDE)} />
          <BuildColumnOption open={buttonHandlers.BUILD} />
          <CleanColumn open={buttonHandlers.CLEAN} />
          <MergeOption open={() => window.open(menuFuncs.fullPath('/dtale/popup/merge'), '_blank')} />
          <SummarizeOption open={openPopup({ type: PopupType.RESHAPE, title: 'Reshape', visible: true }, 400, 770)} />
          <TimeseriesAnalysisOption open={() => showSidePanel(SidePanelType.TIMESERIES_ANALYSIS)} />
          <DuplicatesOption open={buttonHandlers.DUPLICATES} />
          <MissingOption open={() => showSidePanel(SidePanelType.MISSINGNO)} />
          <CorrelationAnalysisOption open={() => showSidePanel(SidePanelType.CORR_ANALYSIS)} />
          <CorrelationsOption open={() => showSidePanel(SidePanelType.CORRELATIONS)} />
          <PPSOption open={() => showSidePanel(SidePanelType.PPS)} />
          <ChartsOption open={buttonHandlers.CHARTS} />
          <NetworkOption open={buttonHandlers.NETWORK} />
          <HeatMapOption toggleBackground={updateBg} />
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
          <HighlightOption
            open={() => updateBg('outliers')}
            mode="outliers"
            label="Outliers"
            current={settings.backgroundMode}
          />
          <RangeHighlightOption columns={columns} />
          <LowVarianceOption
            toggleLowVarianceBackground={() => updateBg('lowVariance')}
            backgroundMode={settings.backgroundMode}
          />
          <GageRnROption open={() => showSidePanel(SidePanelType.GAGE_RNR)} />
          <InstancesOption
            open={openPopup({ type: PopupType.INSTANCES, title: 'Instances', visible: true }, 450, 750)}
          />
          <CodeExportOption open={buttonHandlers.CODE} />
          <ExportOption rows={rows} />
          <UploadOption open={openPopup({ type: PopupType.UPLOAD, visible: true }, 450)} />
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
