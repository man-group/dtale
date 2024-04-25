import { createSelector } from '@reduxjs/toolkit';

import { RangeSelection } from '../dtale/DataViewerState';

import { AppStoreState } from './reducers/app';
import {
  DataViewerUpdate,
  FilteredRanges,
  InstanceSettings,
  Popups,
  PredefinedFilter,
  QueryEngine,
  RibbonDropdownProps,
  SidePanelProps,
  ThemeType,
  Version,
} from './state/AppState';

export const selectDataId = (state: AppStoreState): string => state.dataId;
export const selectAuth = (state: AppStoreState): boolean => state.auth;
export const selectUsername = (state: AppStoreState): string | null => state.username;
export const selectEditedCell = (state: AppStoreState): string | null => state.editedCell;
export const selectIsVSCode = (state: AppStoreState): boolean => state.isVSCode;
export const selectCtrlRows = (state: AppStoreState): number[] | null => state.ctrlRows;
export const selectCtrlCols = (state: AppStoreState): number[] | null => state.ctrlCols;
export const selectIsArcticDB = (state: AppStoreState): number => state.isArcticDB;
export const selectColumnCount = (state: AppStoreState): number => state.columnCount;
export const selectColumnMenuOpen = (state: AppStoreState): boolean => state.columnMenuOpen;
export const selectSelectedCol = (state: AppStoreState): string | null => state.selectedCol;
export const selectSelectedColRef = (state: AppStoreState): HTMLElement | null => state.selectedColRef;
export const selectIsPreview = (state: AppStoreState): boolean => state.isPreview;
export const selectRibbonDropdown = (state: AppStoreState): RibbonDropdownProps => state.ribbonDropdown;
export const selectRibbonDropdownVisible = createSelector(
  [selectRibbonDropdown],
  (ribbonDropdown) => ribbonDropdown.visible,
);
export const selectRibbonDropdownElement = createSelector(
  [selectRibbonDropdown],
  (ribbonDropdown) => ribbonDropdown.element,
);
export const selectRibbonDropdownName = createSelector([selectRibbonDropdown], (ribbonDropdown) => ribbonDropdown.name);
export const selectSettings = (state: AppStoreState): InstanceSettings => state.settings;
export const selectColumnFilters = createSelector([selectSettings], (settings) => settings?.columnFilters);
export const selectOutlierFilters = createSelector([selectSettings], (settings) => settings?.outlierFilters);
export const selectInvertFilter = createSelector([selectSettings], (settings) => settings?.invertFilter);
export const selectQuery = createSelector([selectSettings], (settings) => settings?.query);
export const selectPredefinedFilters = createSelector([selectSettings], (settings) => settings?.predefinedFilters);
export const selectSortInfo = createSelector([selectSettings], (settings) => settings?.sortInfo);
export const selectHighlightFilter = createSelector([selectSettings], (settings) => settings?.highlightFilter);
export const selectVerticalHeaders = createSelector([selectSettings], (settings) => settings?.verticalHeaders);
export const selectSettingsHideHeaderEditor = createSelector(
  [selectSettings],
  (settings) => settings?.hide_header_editor,
);
export const selectBackgroundMode = createSelector([selectSettings], (settings) => settings?.backgroundMode);
export const selectRangeHighlight = createSelector([selectSettings], (settings) => settings?.rangeHighlight);
export const selectBaseLockHeaderMenu = (state: AppStoreState): boolean => state.lockHeaderMenu;
export const selectBaseHideHeaderMenu = (state: AppStoreState): boolean => state.hideHeaderMenu;
export const selectBaseHideMainMenu = (state: AppStoreState): boolean => state.hideMainMenu;
export const selectBaseHideColumnMenus = (state: AppStoreState): boolean => state.hideColumnMenus;
export const selectBaseEnableCustomFilters = (state: AppStoreState): boolean => state.enableCustomFilters;
export const selectEnableWebUploads = (state: AppStoreState): boolean => state.enableWebUploads;
export const selectFilteredRanges = (state: AppStoreState): FilteredRanges => state.filteredRanges;
export const selectShowAllHeatmapColumns = (state: AppStoreState): boolean => state.showAllHeatmapColumns;
export const selectChartData = (state: AppStoreState): Popups => state.chartData;
export const selectSidePanel = (state: AppStoreState): SidePanelProps => state.sidePanel;
export const selectSidePanelVisible = createSelector([selectSidePanel], (sidePanel) => sidePanel.visible);
export const selectSidePanelView = createSelector([selectSidePanel], (sidePanel) => sidePanel.view);
export const selectSidePanelColumn = createSelector([selectSidePanel], (sidePanel) => sidePanel.column);
export const selectSidePanelOffset = createSelector([selectSidePanel], (sidePanel) => sidePanel.offset);
export const selectTheme = (state: AppStoreState): ThemeType => state.theme;
export const selectPythonVersion = (state: AppStoreState): Version | null => state.pythonVersion;
export const selectMaxColumnWidth = (state: AppStoreState): number | null => state.maxColumnWidth;
export const selectAllowCellEdits = (state: AppStoreState): boolean | string[] => state.allowCellEdits;
export const selectRowRange = (state: AppStoreState): RangeSelection<number> | null => state.rowRange;
export const selectColumnRange = (state: AppStoreState): RangeSelection<number> | null => state.columnRange;
export const selectRangeSelect = (state: AppStoreState): RangeSelection<string> | null => state.rangeSelect;
export const selectSelectedRow = (state: AppStoreState): number | null => state.selectedRow;
export const selectFormattingOpen = (state: AppStoreState): string | null => state.formattingOpen;
export const selectMenuPinned = (state: AppStoreState): boolean => state.menuPinned;
export const selectMenuOpen = (state: AppStoreState): boolean => state.menuOpen;
export const selectBaseHideHeaderEditor = (state: AppStoreState): boolean => state.hideHeaderEditor;
export const selectHideHeaderEditor = createSelector(
  [selectSettingsHideHeaderEditor, selectBaseHideHeaderEditor],
  (settingsHideHeaderEditor, hideHeaderEditor) => settingsHideHeaderEditor ?? hideHeaderEditor,
);
export const selectPredefinedFilterConfigs = (state: AppStoreState): PredefinedFilter[] => state.predefinedFilters;
export const selectHideDropRows = (state: AppStoreState): boolean => state.hideDropRows;
export const selectArcticConn = (state: AppStoreState): string => state.arcticConn;
export const selectBaseRibbonMenuOpen = (state: AppStoreState): boolean => state.ribbonMenuOpen;
const selectSettingsLockHeaderMenu = createSelector([selectSettings], (settings) => settings?.lock_header_menu);
export const selectLockHeaderMenu = createSelector(
  [selectSettingsLockHeaderMenu, selectBaseLockHeaderMenu],
  (settingsLockHeaderMenu, lockHeaderMenu) => settingsLockHeaderMenu ?? lockHeaderMenu,
);
const selectSettingsHideHeaderMenu = createSelector([selectSettings], (settings) => settings?.hide_header_menu);
export const selectHideHeaderMenu = createSelector(
  [selectSettingsHideHeaderMenu, selectBaseHideHeaderMenu],
  (settingsHideHeaderMenu, hideHeaderMenu) => settingsHideHeaderMenu ?? hideHeaderMenu,
);
const selectSettingsHideMainMenu = createSelector([selectSettings], (settings) => settings?.hide_main_menu);
export const selectHideMainMenu = createSelector(
  [selectSettingsHideMainMenu, selectBaseHideMainMenu],
  (settingsHideMainMenu, hideMainMenu) => settingsHideMainMenu ?? hideMainMenu,
);
const selectSettingsHideColumnMenus = createSelector([selectSettings], (settings) => settings?.hide_column_menus);
export const selectHideColumnMenus = createSelector(
  [selectSettingsHideColumnMenus, selectBaseHideColumnMenus],
  (settingsHideColumnMenus, hideColumnMenus) => settingsHideColumnMenus ?? hideColumnMenus,
);
const selectSettingsEnableCustomFilters = createSelector(
  [selectSettings],
  (settings) => settings?.enable_custom_filters,
);
export const selectEnableCustomFilters = createSelector(
  [selectSettingsEnableCustomFilters, selectBaseEnableCustomFilters],
  (settingsEnableCustomFilters, enableCustomFilters) => settingsEnableCustomFilters ?? enableCustomFilters,
);
export const selectRibbonMenuOpen = createSelector(
  [selectBaseRibbonMenuOpen, selectLockHeaderMenu, selectHideHeaderMenu],
  (ribbonMenuOpen, lockHeaderMenu, hideHeaderMenu) => (ribbonMenuOpen || lockHeaderMenu) && !hideHeaderMenu,
);
export const selectMainTitle = (state: AppStoreState): string | null => state.mainTitle;
export const selectMainTitleFont = (state: AppStoreState): string | null => state.mainTitleFont;
export const selectDataViewerUpdate = (state: AppStoreState): DataViewerUpdate | null => state.dataViewerUpdate;
export const selectMaxRowHeight = (state: AppStoreState): number | null => state.maxRowHeight;
export const selectEditedTextAreaHeight = (state: AppStoreState): number => state.editedTextAreaHeight;
export const selectDragResize = (state: AppStoreState): number | null => state.dragResize;
export const selectXArray = (state: AppStoreState): boolean => state.xarray;
export const selectXArrayDim = (state: AppStoreState): Record<string, any> => state.xarrayDim;
export const selectIFrame = (state: AppStoreState): boolean => state.iframe;
export const selectLanguage = (state: AppStoreState): string => state.language;
export const selectHideShutdown = (state: AppStoreState): boolean => state.hideShutdown;
export const selectQueryEngine = (state: AppStoreState): QueryEngine => state.queryEngine;
export const selectColumnAggregations = (state: AppStoreState): string | null => state.columnAggregations;
