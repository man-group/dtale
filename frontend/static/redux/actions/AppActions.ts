import { createActionWithPayload } from '../helpers';
import {
  DataViewerUpdate,
  FilteredRanges,
  InstanceSettings,
  Popups,
  QueryEngine,
  RangeState,
  RibbonDropdownProps,
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
  UPDATE_LOCK_HEADER_MENU = 'update-lock-header-menu',
  UPDATE_HIDE_HEADER_MENU = 'update-hide-header-menu',
  UPDATE_HIDE_MAIN_MENU = 'update-hide-main-menu',
  UPDATE_HIDE_COLUMN_MENUS = 'update-hide-column-menus',
  UPDATE_ENABLE_CUSTOM_FILTERS = 'update-enable-custom-filters',
  UPDATE_COLUMN_AGGREGATIONS = 'update-column-aggregations',
}

/** Side panel action properties */
export interface SidePanelActionProps {
  view?: SidePanelType;
  column?: string;
  offset?: number;
}

export const AppActions = {
  SetRangeStateAction: createActionWithPayload<RangeState>(ActionType.SET_RANGE_STATE),
  InitAction: createActionWithPayload(ActionType.INIT_PARAMS),
  ClearEditAction: createActionWithPayload(ActionType.CLEAR_EDIT),
  ConvertToXarrayAction: createActionWithPayload(ActionType.CONVERT_TO_XARRAY),
  HideMenuTooltipAction: createActionWithPayload(ActionType.HIDE_MENU_TOOLTIP),
  ShowRibbonMenuAction: createActionWithPayload(ActionType.SHOW_RIBBON_MENU),
  HideRibbonMenuAction: createActionWithPayload(ActionType.HIDE_RIBBON_MENU),
  HideSidePanelAction: createActionWithPayload(ActionType.HIDE_SIDE_PANEL),
  ClearDataViewerUpdateAction: createActionWithPayload(ActionType.CLEAR_DATA_VIEWER_UPDATE),
  StopResizeAction: createActionWithPayload(ActionType.STOP_RESIZE),
  CloseChartAction: createActionWithPayload(ActionType.CLOSE_CHART),
  LoadingDatasetsAction: createActionWithPayload(ActionType.LOADING_DATASETS),
  ClearMaxWidthAction: createActionWithPayload(ActionType.CLEAR_MAX_WIDTH),
  ClearMaxHeightAction: createActionWithPayload(ActionType.CLEAR_MAX_HEIGHT),
  ToggleMenuPinnedAction: createActionWithPayload(ActionType.TOGGLE_MENU_PINNED),
  LoadPreviewAction: createActionWithPayload<string>(ActionType.LOAD_PREVIEW),
  EditedCellAction: createActionWithPayload<string | undefined>(ActionType.EDIT_CELL),
  EditedTextAreaHeightAction: createActionWithPayload<number>(ActionType.EDITED_CELL_TEXTAREA_HEIGHT),
  ToggleColumnMenuAction: createActionWithPayload<{
    colName?: string;
    headerRef?: HTMLElement;
  }>(ActionType.TOGGLE_COLUMN_MENU),
  HideColumnMenuAction: createActionWithPayload<{
    colName?: string;
    headerRef?: HTMLElement;
  }>(ActionType.HIDE_COLUMN_MENU),
  OpenMenuAction: createActionWithPayload(ActionType.OPEN_MENU),
  CloseMenuAction: createActionWithPayload(ActionType.CLOSE_MENU),
  UpdateColumnAggregations: createActionWithPayload<{ colName?: string }>(ActionType.UPDATE_COLUMN_AGGREGATIONS),
  OpenFormattingAction: createActionWithPayload<string>(ActionType.OPEN_FORMATTING),
  CloseFormattingAction: createActionWithPayload(ActionType.CLOSE_FORMATTING),
  UpdateXarrayDimAction: createActionWithPayload<Record<string, any>>(ActionType.UPDATE_XARRAY_DIM),
  UpdateFilteredRangesAction: createActionWithPayload<FilteredRanges>(ActionType.UPDATE_FILTERED_RANGES),
  UpdateSettingsAction: createActionWithPayload<Partial<InstanceSettings>>(ActionType.UPDATE_SETTINGS),
  ShowMenuTooltipAction: createActionWithPayload<{
    element: HTMLElement;
    content: React.ReactNode;
  }>(ActionType.SHOW_MENU_TOOLTIP),
  OpenRibbonDropdownAction: createActionWithPayload<RibbonDropdownProps>(ActionType.OPEN_RIBBON_DROPDOWN),
  ShowSidePanelAction: createActionWithPayload<SidePanelActionProps>(ActionType.SHOW_SIDE_PANEL),
  UpdateSidePanelWidthAction: createActionWithPayload<SidePanelActionProps>(ActionType.UPDATE_SIDE_PANEL_WIDTH),
  DataViewerUpdateAction: createActionWithPayload<DataViewerUpdate>(ActionType.DATA_VIEWER_UPDATE),
  DragResizeAction: createActionWithPayload<number>(ActionType.DRAG_RESIZE),
  SetThemeAction: createActionWithPayload<ThemeType>(ActionType.SET_THEME),
  SetLanguageAction: createActionWithPayload<string>(ActionType.SET_LANGUAGE),
  UpdateMaxColumnWidthAction: createActionWithPayload<number>(ActionType.UPDATE_MAX_WIDTH),
  UpdateMaxRowHeightAction: createActionWithPayload<number>(ActionType.UPDATE_MAX_HEIGHT),
  SetQueryEngineAction: createActionWithPayload<QueryEngine>(ActionType.SET_QUERY_ENGINE),
  UpdateShowAllHeatmapColumnsAction: createActionWithPayload<boolean>(ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS),
  OpenChartAction: createActionWithPayload<Popups>(ActionType.OPEN_CHART),
  UpdateHideShutdown: createActionWithPayload<boolean>(ActionType.UPDATE_HIDE_SHUTDOWN),
  UpdateAllowCellEdits: createActionWithPayload<boolean | string[]>(ActionType.UPDATE_ALLOW_CELL_EDITS),
  UpdateHideHeaderEditor: createActionWithPayload<boolean>(ActionType.UPDATE_HIDE_HEADER_EDITOR),
  UpdateLockHeaderMenu: createActionWithPayload<boolean>(ActionType.UPDATE_LOCK_HEADER_MENU),
  UpdateHideHeaderMenu: createActionWithPayload<boolean>(ActionType.UPDATE_HIDE_HEADER_MENU),
  UpdateHideMainMenu: createActionWithPayload<boolean>(ActionType.UPDATE_HIDE_MAIN_MENU),
  UpdateHideColumnMenus: createActionWithPayload<boolean>(ActionType.UPDATE_HIDE_COLUMN_MENUS),
  UpdateEnableCustomFilters: createActionWithPayload<boolean>(ActionType.UPDATE_ENABLE_CUSTOM_FILTERS),
};
