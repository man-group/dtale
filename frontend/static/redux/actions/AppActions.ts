import { Action, AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';

import {
  AppState,
  DataViewerUpdate,
  FilteredRanges,
  InstanceSettings,
  Popups,
  QueryEngine,
  RangeState,
  RibbonDropdownType,
  SidePanelType,
  ThemeType,
} from '../state/AppState';

/** Different application events */
export enum ActionType {
  INIT_PARAMS = 'init-params',
  LOAD_PREVIEW = 'load-preview',
  EDIT_CELL = 'edit-cell',
  TOGGLE_COLUMN_MENU = 'toggle-column-menu',
  OPEN_MENU = 'open-menu',
  CLOSE_MENU = 'close-menu',
  OPEN_FORMATTING = 'open-formatting',
  CLOSE_FORMATTING = 'close-formatting',
  TOGGLE_MENU_PINNED = 'toggle-menu-pinned',
  HIDE_COLUMN_MENU = 'hide-column-menu',
  CLEAR_EDIT = 'clear-edit',
  EDITED_CELL_TEXTAREA_HEIGHT = 'edited-cell-textarea-height',
  CONVERT_TO_XARRAY = 'convert-to-xarray',
  UPDATE_XARRAY_DIM = 'update-xarray-dim',
  UPDATE_FILTERED_RANGES = 'update-filtered-ranges',
  UPDATE_SETTINGS = 'update-settings',
  SHOW_MENU_TOOLTIP = 'show-menu-tooltip',
  HIDE_MENU_TOOLTIP = 'hide-menu-tooltip',
  SHOW_RIBBON_MENU = 'show-ribbon-menu',
  HIDE_RIBBON_MENU = 'hide-ribbon-menu',
  OPEN_RIBBON_DROPDOWN = 'open-ribbon-dropdown',
  SHOW_SIDE_PANEL = 'show-side-panel',
  HIDE_SIDE_PANEL = 'hide-side-panel',
  UPDATE_SIDE_PANEL_WIDTH = 'update-side-panel-width',
  DATA_VIEWER_UPDATE = 'data-viewer-update',
  CLEAR_DATA_VIEWER_UPDATE = 'clear-data-viewer-update',
  DRAG_RESIZE = 'drag-resize',
  STOP_RESIZE = 'stop-resize',
  OPEN_CHART = 'open-chart',
  CLOSE_CHART = 'close-chart',
  LOADING_DATASETS = 'loading-datasets',
  SET_THEME = 'set-theme',
  SET_LANGUAGE = 'set-language',
  UPDATE_MAX_WIDTH = 'update-max-width',
  CLEAR_MAX_WIDTH = 'clear-max-width',
  UPDATE_MAX_HEIGHT = 'update-max-height',
  CLEAR_MAX_HEIGHT = 'clear-max-height',
  SET_QUERY_ENGINE = 'set-query-engine',
  UPDATE_SHOW_ALL_HEATMAP_COLUMNS = 'update-show-all-heatmap-columns',
  SET_RANGE_STATE = 'set-range-state',
  UPDATE_HIDE_SHUTDOWN = 'update-hide-shutdown',
  UPDATE_ALLOW_CELL_EDITS = 'update-allow-cell-edits',
  UPDATE_HIDE_HEADER_EDITOR = 'update-hide-header-editor',
}

/** Action fired when a range is selected */
export type SetRangeStateAction = Action<typeof ActionType.SET_RANGE_STATE> & RangeState;

/** Action fired when application initially loads */
export type InitAction = Action<typeof ActionType.INIT_PARAMS>;

/** Action fired when user cancels a cell edit */
export type ClearEditAction = Action<typeof ActionType.CLEAR_EDIT>;

/** Action fired when user wants to convert their data to XArray */
export type ConvertToXarrayAction = Action<typeof ActionType.CONVERT_TO_XARRAY>;

/** Action fired to hide menu item tooltips */
export type HideMenuTooltipAction = Action<typeof ActionType.HIDE_MENU_TOOLTIP>;

/** Action fired to show the ribbon menu */
export type ShowRibbonMenuAction = Action<typeof ActionType.SHOW_RIBBON_MENU>;

/** Action fired to hide the ribbon menu */
export type HideRibbonMenuAction = Action<typeof ActionType.HIDE_RIBBON_MENU>;

/** Action fired to hide the side panel */
export type HideSidePanelAction = Action<typeof ActionType.HIDE_SIDE_PANEL>;

/** Action fired to clear any executed data viewer updates */
export type ClearDataViewerUpdateAction = Action<typeof ActionType.CLEAR_DATA_VIEWER_UPDATE>;

/** Action fired to stop resizing columns */
export type StopResizeAction = Action<typeof ActionType.STOP_RESIZE>;

/** Action fired to close a popup */
export type CloseChartAction = Action<typeof ActionType.CLOSE_CHART>;

/** Action fired when a dataset is being loaded */
export type LoadingDatasetsAction = Action<typeof ActionType.LOADING_DATASETS>;

/** Action fired when clearing max width setting */
export type ClearMaxWidthAction = Action<typeof ActionType.CLEAR_MAX_WIDTH>;

/** Action fired when clearing max height setting */
export type ClearMaxHeightAction = Action<typeof ActionType.CLEAR_MAX_HEIGHT>;

/** Action fired when toggling the state of the main menu being pinned or not */
export type ToggleMenuPinnedAction = Action<typeof ActionType.TOGGLE_MENU_PINNED>;

/** Action fired when D-Tale is loaded in "preview" mode */
export interface LoadPreviewAction extends Action<typeof ActionType.LOAD_PREVIEW> {
  dataId: string;
}

/** Action fired when a user edits a cell */
export interface EditedCellAction extends Action<typeof ActionType.EDIT_CELL> {
  editedCell?: string;
}

/** Action fired for sizing the height of textarea for cell editing */
export interface EditedTextAreaHeightAction extends Action<typeof ActionType.EDITED_CELL_TEXTAREA_HEIGHT> {
  height: number;
}

/** Action fired for toggling the display of a column menu */
export interface ToggleColumnAction extends Action<typeof ActionType.TOGGLE_COLUMN_MENU | ActionType.HIDE_COLUMN_MENU> {
  colName?: string;
  headerRef?: HTMLDivElement;
}

/** Action fired for toggling the display of the main menu */
export type ToggleMenuAction = Action<typeof ActionType.OPEN_MENU | ActionType.CLOSE_MENU>;

/** Action fired for opening the formatting menu */
export interface OpenFormattingAction extends Action<typeof ActionType.OPEN_FORMATTING> {
  selectedCol: string;
}

/** Action fired for closing the formatting menu */
export type CloseFormattingAction = Action<typeof ActionType.CLOSE_FORMATTING>;

/** Action fired when updating xarray dimensions */
export interface UpdateXarrayDimAction extends Action<typeof ActionType.UPDATE_XARRAY_DIM> {
  xarrayDim: Record<string, boolean>;
}

/** Action fired when updating filtered ranges */
export interface UpdateFilteredRangesAction extends Action<typeof ActionType.UPDATE_FILTERED_RANGES> {
  ranges: FilteredRanges;
}

/** Action fired when updating instance settings */
export interface UpdateSettingsAction extends Action<typeof ActionType.UPDATE_SETTINGS> {
  settings: Partial<InstanceSettings>;
}

/** Action fired when showing a main menu tooltip */
export interface ShowMenuTooltipAction extends Action<typeof ActionType.SHOW_MENU_TOOLTIP> {
  element: HTMLElement;
  content: React.ReactNode;
}

/** Action fired when opening a ribbon dropdown */
export interface OpenRibbonDropdownAction extends Action<typeof ActionType.OPEN_RIBBON_DROPDOWN> {
  element: HTMLDivElement;
  name: RibbonDropdownType;
}

/** Action fired when showing or updating the width of the side panel */
export interface SidePanelAction
  extends Action<typeof ActionType.SHOW_SIDE_PANEL | ActionType.UPDATE_SIDE_PANEL_WIDTH> {
  view?: SidePanelType;
  column?: string;
  offset?: number;
}

/** Action fired when executing a data viewer update */
export interface DataViewerUpdateAction extends Action<typeof ActionType.DATA_VIEWER_UPDATE> {
  update: DataViewerUpdate;
}

/** Action fired when dragging/resizing a column */
export interface DragResizeAction extends Action<typeof ActionType.DRAG_RESIZE> {
  x: number;
}

/** Action fired when setting a theme */
export interface SetThemeAction extends Action<typeof ActionType.SET_THEME> {
  theme: ThemeType;
}

/** Action fired when setting a language */
export interface SetLanguageAction extends Action<typeof ActionType.SET_LANGUAGE> {
  language: string;
}

/** Action fired when updating the maximum column width */
export interface UpdateMaxColumnWidthAction extends Action<typeof ActionType.UPDATE_MAX_WIDTH> {
  width: number;
}

/** Action fired when updating the maximum row height */
export interface UpdateMaxRowHeightAction extends Action<typeof ActionType.UPDATE_MAX_HEIGHT> {
  height: number;
}

/** Action fired when setting the query engine for custom filters */
export interface SetQueryEngineAction extends Action<typeof ActionType.SET_QUERY_ENGINE> {
  engine: QueryEngine;
}

/** Action fired when updating whether to show all columns when in "heatmap" mode */
export interface UpdateShowAllHeatmapColumnsAction extends Action<typeof ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS> {
  showAllHeatmapColumns: boolean;
}

/** Action fired when opening a chart popup */
export interface OpenChartAction extends Action<typeof ActionType.OPEN_CHART> {
  chartData: Popups;
}

/** Action fired when updating the hide_shutdown flag */
export interface UpdateHideShutdown extends Action<typeof ActionType.UPDATE_HIDE_SHUTDOWN> {
  value: boolean;
}

/** Action fired when updating the allow_cell_edits flag */
export interface UpdateAllowCellEdits extends Action<typeof ActionType.UPDATE_ALLOW_CELL_EDITS> {
  value: boolean;
}

/** Action fired when updating the hide_header_editor flag */
export interface UpdateHideHeaderEditor extends Action<typeof ActionType.UPDATE_HIDE_HEADER_EDITOR> {
  value: boolean;
}

/** Type definition encompassing all application actions */
export type AppActionTypes =
  | InitAction
  | ClearEditAction
  | ConvertToXarrayAction
  | HideMenuTooltipAction
  | ShowRibbonMenuAction
  | HideRibbonMenuAction
  | HideSidePanelAction
  | ClearDataViewerUpdateAction
  | StopResizeAction
  | CloseChartAction
  | LoadingDatasetsAction
  | ClearMaxWidthAction
  | ClearMaxHeightAction
  | ToggleMenuPinnedAction
  | LoadPreviewAction
  | EditedCellAction
  | EditedTextAreaHeightAction
  | ToggleColumnAction
  | ToggleMenuAction
  | OpenFormattingAction
  | CloseFormattingAction
  | UpdateXarrayDimAction
  | UpdateFilteredRangesAction
  | UpdateSettingsAction
  | ShowMenuTooltipAction
  | OpenRibbonDropdownAction
  | SidePanelAction
  | DataViewerUpdateAction
  | DragResizeAction
  | SetThemeAction
  | SetLanguageAction
  | UpdateMaxColumnWidthAction
  | UpdateMaxRowHeightAction
  | SetQueryEngineAction
  | UpdateShowAllHeatmapColumnsAction
  | OpenChartAction
  | SetRangeStateAction
  | UpdateHideShutdown
  | UpdateAllowCellEdits
  | UpdateHideHeaderEditor;

/** Type definition for redux application actions */
export type AppActions<R> = ThunkAction<R, AppState, Record<string, unknown>, AnyAction>;
