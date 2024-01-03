import { createSelector } from '@reduxjs/toolkit';

import { RangeSelection } from '../dtale/DataViewerState';

import {
  AppState,
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

export const selectDataId = (state: AppState): string => state.dataId;
export const selectAuth = (state: AppState): boolean => state.auth;
export const selectUsername = (state: AppState): string | null => state.username;
export const selectEditedCell = (state: AppState): string | null => state.editedCell;
export const selectIsVSCode = (state: AppState): boolean => state.isVSCode;
export const selectCtrlRows = (state: AppState): number[] | null => state.ctrlRows;
export const selectCtrlCols = (state: AppState): number[] | null => state.ctrlCols;
export const selectIsArcticDB = (state: AppState): number => state.isArcticDB;
export const selectColumnCount = (state: AppState): number => state.columnCount;
export const selectColumnMenuOpen = (state: AppState): boolean => state.columnMenuOpen;
export const selectSelectedCol = (state: AppState): string | null => state.selectedCol;
export const selectSelectedColRef = (state: AppState): HTMLDivElement | null => state.selectedColRef;
export const selectIsPreview = (state: AppState): boolean => state.isPreview;
export const selectRibbonDropdown = (state: AppState): RibbonDropdownProps => state.ribbonDropdown;
export const selectRibbonDropdownVisible = createSelector(
  [selectRibbonDropdown],
  (ribbonDropdown) => ribbonDropdown.visible,
);
export const selectRibbonDropdownElement = createSelector(
  [selectRibbonDropdown],
  (ribbonDropdown) => ribbonDropdown.element,
);
export const selectRibbonDropdownName = createSelector([selectRibbonDropdown], (ribbonDropdown) => ribbonDropdown.name);
export const selectSettings = (state: AppState): InstanceSettings => state.settings;
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
export const selectBaseLockHeaderMenu = (state: AppState): boolean => state.lockHeaderMenu;
export const selectBaseHideHeaderMenu = (state: AppState): boolean => state.hideHeaderMenu;
export const selectBaseHideMainMenu = (state: AppState): boolean => state.hideMainMenu;
export const selectBaseHideColumnMenus = (state: AppState): boolean => state.hideColumnMenus;
export const selectBaseEnableCustomFilters = (state: AppState): boolean => state.enableCustomFilters;
export const selectEnableWebUploads = (state: AppState): boolean => state.enableWebUploads;
export const selectFilteredRanges = (state: AppState): FilteredRanges => state.filteredRanges;
export const selectShowAllHeatmapColumns = (state: AppState): boolean => state.showAllHeatmapColumns;
export const selectChartData = (state: AppState): Popups => state.chartData;
export const selectSidePanel = (state: AppState): SidePanelProps => state.sidePanel;
export const selectSidePanelVisible = createSelector([selectSidePanel], (sidePanel) => sidePanel.visible);
export const selectSidePanelView = createSelector([selectSidePanel], (sidePanel) => sidePanel.view);
export const selectSidePanelColumn = createSelector([selectSidePanel], (sidePanel) => sidePanel.column);
export const selectSidePanelOffset = createSelector([selectSidePanel], (sidePanel) => sidePanel.offset);
export const selectTheme = (state: AppState): ThemeType => state.theme;
export const selectPythonVersion = (state: AppState): Version | null => state.pythonVersion;
export const selectMaxColumnWidth = (state: AppState): number | null => state.maxColumnWidth;
export const selectAllowCellEdits = (state: AppState): boolean | string[] => state.allowCellEdits;
export const selectRowRange = (state: AppState): RangeSelection<number> | null => state.rowRange;
export const selectColumnRange = (state: AppState): RangeSelection<number> | null => state.columnRange;
export const selectRangeSelect = (state: AppState): RangeSelection<string> | null => state.rangeSelect;
export const selectSelectedRow = (state: AppState): number | null => state.selectedRow;
export const selectFormattingOpen = (state: AppState): string | null => state.formattingOpen;
export const selectMenuPinned = (state: AppState): boolean => state.menuPinned;
export const selectMenuOpen = (state: AppState): boolean => state.menuOpen;
export const selectBaseHideHeaderEditor = (state: AppState): boolean => state.hideHeaderEditor;
export const selectHideHeaderEditor = createSelector(
  [selectSettingsHideHeaderEditor, selectBaseHideHeaderEditor],
  (settingsHideHeaderEditor, hideHeaderEditor) => settingsHideHeaderEditor ?? hideHeaderEditor,
);
export const selectPredefinedFilterConfigs = (state: AppState): PredefinedFilter[] => state.predefinedFilters;
export const selectHideDropRows = (state: AppState): boolean => state.hideDropRows;
export const selectArcticConn = (state: AppState): string => state.arcticConn;
export const selectBaseRibbonMenuOpen = (state: AppState): boolean => state.ribbonMenuOpen;
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
export const selectMainTitle = (state: AppState): string | null => state.mainTitle;
export const selectMainTitleFont = (state: AppState): string | null => state.mainTitleFont;
export const selectDataViewerUpdate = (state: AppState): DataViewerUpdate | null => state.dataViewerUpdate;
export const selectMaxRowHeight = (state: AppState): number | null => state.maxRowHeight;
export const selectEditedTextAreaHeight = (state: AppState): number => state.editedTextAreaHeight;
export const selectDragResize = (state: AppState): number | null => state.dragResize;
export const selectXArray = (state: AppState): boolean => state.xarray;
export const selectXArrayDim = (state: AppState): Record<string, any> => state.xarrayDim;
export const selectIFrame = (state: AppState): boolean => state.iframe;
export const selectLanguage = (state: AppState): string => state.language;
export const selectHideShutdown = (state: AppState): boolean => state.hideShutdown;
export const selectQueryEngine = (state: AppState): QueryEngine => state.queryEngine;
