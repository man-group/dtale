import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, AppActions, SidePanelAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { AppState, Popups, PopupType, RangeHighlightConfig, SortDef } from '../../redux/state/AppState';
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
interface DataViewerMenuProps {
  columns: ColumnDef[];
  menuOpen: boolean;
  propagateState: DataViewerPropagateState;
  backgroundMode?: string;
  rangeHighlight?: RangeHighlightConfig;
  sortInfo: SortDef[];
}

const DataViewerMenu: React.FC<DataViewerMenuProps & WithTranslation> = ({ menuOpen, t, ...props }) => {
  const { dataId, menuPinned, mainTitle, mainTitleFont, isVSCode, settings } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): AppActions<void> => dispatch(chartActions.openChart(chartData));
  const showSidePanel = (view: string): SidePanelAction => dispatch({ type: ActionType.SHOW_SIDE_PANEL, view });

  const buttonHandlers = menuFuncs.buildHotkeyHandlers({ ...props, dataId, openChart, isVSCode });
  const { openPopup, toggleBackground, toggleOutlierBackground, exportFile } = buttonHandlers;
  const refreshWidths = (): void => props.propagateState({ columns: props.columns.map((c) => ({ ...c })) });
  const closeMenu = (): void => document.getElementsByTagName('body')[0].click();
  const hasNoInfo = gu.hasNoInfo(settings, props.columns);
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
    <div {...containerProps}>
      {!menuPinned && menuOpen && <GlobalHotKeys keyMap={{ CLOSE_MENU: 'esc' }} handlers={{ CLOSE_MENU: closeMenu }} />}
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
          <XArrayOption columns={props.columns.filter(({ name }) => name !== gu.IDX)} />
          <DescribeOption open={buttonHandlers.DESCRIBE} />
          <FilterOption open={() => showSidePanel('filter')} />
          <PredefinedFiltersOption open={() => showSidePanel('predefined_filters')} />
          <ShowHideColumnsOption open={() => showSidePanel('show_hide')} />
          <BuildColumnOption open={buttonHandlers.BUILD} />
          <CleanColumn open={buttonHandlers.CLEAN} />
          <MergeOption open={() => window.open(menuFuncs.fullPath('/dtale/popup/merge'), '_blank')} />
          <SummarizeOption open={openPopup({ type: PopupType.RESHAPE, title: 'Reshape', visible: true }, 400, 770)} />
          <TimeseriesAnalysisOption open={() => showSidePanel('timeseries_analysis')} />
          <DuplicatesOption open={buttonHandlers.DUPLICATES} />
          <MissingOption open={() => showSidePanel('missingno')} />
          <CorrelationAnalysisOption open={() => showSidePanel('corr_analysis')} />
          <CorrelationsOption open={() => showSidePanel('correlations')} />
          <PPSOption open={() => showSidePanel('pps')} />
          <ChartsOption open={buttonHandlers.CHARTS} />
          <NetworkOption open={buttonHandlers.NETWORK} />
          <HeatMapOption backgroundMode={props.backgroundMode} toggleBackground={toggleBackground} />
          <HighlightOption
            open={toggleBackground('dtypes')}
            mode="dtypes"
            label="Dtypes"
            current={props.backgroundMode}
          />
          <HighlightOption
            open={toggleBackground('missing')}
            mode="missing"
            label="Missing"
            current={props.backgroundMode}
          />
          <HighlightOption
            open={toggleOutlierBackground}
            mode="outliers"
            label="Outliers"
            current={props.backgroundMode}
          />
          <RangeHighlightOption {...props} />
          <LowVarianceOption
            toggleLowVarianceBackground={toggleBackground('lowVariance')}
            backgroundMode={props.backgroundMode}
          />
          <GageRnROption open={() => showSidePanel('gage_rnr')} />
          <InstancesOption
            open={openPopup({ type: PopupType.INSTANCES, title: 'Instances', visible: true }, 450, 750)}
          />
          <CodeExportOption open={buttonHandlers.CODE} />
          <ExportOption open={exportFile} />
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
