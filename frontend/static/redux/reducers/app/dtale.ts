import { RangeSelection } from '../../../dtale/DataViewerState';
import { ActionType, AppActionTypes } from '../../actions/AppActions';
import {
  BASE_INSTANCE_SETTINGS,
  DataViewerUpdate,
  FilteredRanges,
  initialVisibility,
  InstanceSettings,
  MenuTooltipProps,
  PredefinedFilter,
  RibbonDropdownProps,
  SidePanelProps,
} from '../../state/AppState';
import { getHiddenValue, toBool, toJson } from '../utils';

/**
 * Reducer managing the dataId property.
 *
 * @param state the current redux state of dataId.
 * @param action application event.
 * @return the updated dataId.
 */
export function dataId(state = '', action: AppActionTypes): string {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return getHiddenValue('data_id') ?? '';
    case ActionType.LOAD_PREVIEW:
      return action.dataId;
    default:
      return state;
  }
}

/**
 * Reducer managing the iframe flag.
 *
 * @param state the current redux state of iframe flag.
 * @param action application event.
 * @return the updated iframe flag.
 */
export function iframe(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('iframe'));
    default:
      return state;
  }
}

/**
 * Reducer managing the editedCell identifier.
 *
 * @param state the current redux state of editedCell.
 * @param action application event.
 * @return the updated editedCell.
 */
export function editedCell(state: string | null = null, action: AppActionTypes): string | null {
  switch (action.type) {
    case ActionType.EDIT_CELL:
      return action.editedCell ?? null;
    case ActionType.TOGGLE_COLUMN_MENU:
    case ActionType.CLEAR_EDIT:
      return null;
    default:
      return state;
  }
}

/**
 * Reducer managing the editedTextAreaHeight property.
 *
 * @param state the current redux state of editedTextAreaHeight.
 * @param action application event.
 * @return the updated editedTextAreaHeight.
 */
export function editedTextAreaHeight(state = 0, action: AppActionTypes): number {
  switch (action.type) {
    case ActionType.EDITED_CELL_TEXTAREA_HEIGHT:
      return action.height;
    case ActionType.TOGGLE_COLUMN_MENU:
    case ActionType.CLEAR_EDIT:
      return 0;
    default:
      return state;
  }
}

/**
 * Reducer managing the columnMenuOpen flag.
 *
 * @param state the current redux state of columnMenuOpen.
 * @param action application event.
 * @return the updated columnMenuOpen.
 */
export function columnMenuOpen(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.TOGGLE_COLUMN_MENU:
      return true;
    case ActionType.HIDE_COLUMN_MENU:
      return false;
    default:
      return state;
  }
}

/**
 * Reducer managing the selectedCol property.
 *
 * @param state the current redux state of selectedCol.
 * @param action application event.
 * @return the updated selectedCol.
 */
export function selectedCol(state: string | null = null, action: AppActionTypes): string | null {
  switch (action.type) {
    case ActionType.TOGGLE_COLUMN_MENU:
      return action.colName ?? null;
    case ActionType.HIDE_COLUMN_MENU:
      return null;
    default:
      return state;
  }
}

/**
 * Reducer managing the reference to any selected column header.
 *
 * @param state the current redux state of selectedColRef.
 * @param action application event.
 * @return the updated selectedColRef.
 */
export function selectedColRef(state: HTMLDivElement | null = null, action: AppActionTypes): HTMLDivElement | null {
  switch (action.type) {
    case ActionType.TOGGLE_COLUMN_MENU:
      return action.headerRef ?? null;
    case ActionType.HIDE_COLUMN_MENU:
      return null;
    default:
      return state;
  }
}

/**
 * Reducer managing the xarray flag.
 *
 * @param state the current redux state of xarray.
 * @param action application event.
 * @return the updated xarray.
 */
export function xarray(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('xarray'));
    case ActionType.CONVERT_TO_XARRAY:
      return true;
    default:
      return state;
  }
}

/**
 * Reducer managing the xarray dimensions property.
 *
 * @param state the current redux state of xarray dimensions.
 * @param action application event.
 * @return the updated xarray dimensions.
 */
export function xarrayDim(state = {}, action: AppActionTypes): Record<string, boolean> {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toJson<Record<string, boolean>>(getHiddenValue('xarray_dim'));
    case ActionType.UPDATE_XARRAY_DIM:
      return action.xarrayDim ?? {};
    case ActionType.CONVERT_TO_XARRAY:
      return {};
    default:
      return state;
  }
}

/**
 * Reducer managing the filteredRanges property.
 *
 * @param state the current redux state of filteredRanges.
 * @param action application event.
 * @return the updated filteredRanges.
 */
export function filteredRanges(state: FilteredRanges = {}, action: AppActionTypes): FilteredRanges {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toJson<FilteredRanges>(getHiddenValue('filtered_ranges'));
    case ActionType.UPDATE_FILTERED_RANGES:
      return action.ranges ?? {};
    default:
      return state;
  }
}

/**
 * Reducer managing instance settings.
 *
 * @param state the current redux state of instance settings.
 * @param action application event.
 * @return the updated instance settings.
 */
export function settings(
  state: InstanceSettings = { ...BASE_INSTANCE_SETTINGS },
  action: AppActionTypes,
): InstanceSettings {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toJson<InstanceSettings>(getHiddenValue('settings'));
    case ActionType.UPDATE_SETTINGS:
      return { ...state, ...action.settings };
    default:
      return state;
  }
}

/**
 * Reducer managing the isPreview flag.
 *
 * @param state the current redux state of isPreview.
 * @param action application event.
 * @return the updated isPreview.
 */
export function isPreview(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.LOAD_PREVIEW:
      return true;
    default:
      return state;
  }
}

/**
 * Reducer managing the menuPinned flag.
 *
 * @param state the current redux state of menuPinned.
 * @param action application event.
 * @return the updated menuPinned.
 */
export function menuPinned(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('pin_menu'));
    case ActionType.TOGGLE_MENU_PINNED:
      return !state;
    default:
      return state;
  }
}

/**
 * Reducer managing the menuTooltip properties.
 *
 * @param state the current redux state of menuTooltip.
 * @param action application event.
 * @return the updated menuTooltip.
 */
export function menuTooltip(
  state: MenuTooltipProps = { ...initialVisibility },
  action: AppActionTypes,
): MenuTooltipProps {
  switch (action.type) {
    case ActionType.SHOW_MENU_TOOLTIP:
      return { visible: true, element: action.element, content: action.content };
    case ActionType.HIDE_MENU_TOOLTIP:
    case ActionType.HIDE_RIBBON_MENU:
    case ActionType.CLEAR_EDIT:
      return { ...state, ...initialVisibility };
    default:
      return state;
  }
}

/**
 * Reducer managing the ribbonMenuOpen flag.
 *
 * @param state the current redux state of ribbonMenuOpen.
 * @param action application event.
 * @return the updated ribbonMenuOpen.
 */
export function ribbonMenuOpen(state = false, action: AppActionTypes): boolean {
  switch (action.type) {
    case ActionType.SHOW_RIBBON_MENU:
      return true;
    case ActionType.HIDE_RIBBON_MENU:
      return false;
    default:
      return state;
  }
}

/**
 * Reducer managing the ribbonDropdown property.
 *
 * @param state the current redux state of ribbonDropdown.
 * @param action application event.
 * @return the updated ribbonDropdown.
 */
export function ribbonDropdown(
  state: RibbonDropdownProps = { ...initialVisibility },
  action: AppActionTypes,
): RibbonDropdownProps {
  switch (action.type) {
    case ActionType.OPEN_RIBBON_DROPDOWN:
      return { visible: true, element: action.element, name: action.name };
    case ActionType.HIDE_RIBBON_MENU:
      return { ...state, ...initialVisibility };
    default:
      return state;
  }
}

/**
 * Reducer managing the sidePanel property.
 *
 * @param state the current redux state of sidePanel.
 * @param action application event.
 * @return the updated sidePanel.
 */
export function sidePanel(state: SidePanelProps = { ...initialVisibility }, action: AppActionTypes): SidePanelProps {
  switch (action.type) {
    case ActionType.SHOW_SIDE_PANEL:
      return { visible: true, view: action.view, column: action.column };
    case ActionType.HIDE_SIDE_PANEL:
      return { ...state, ...initialVisibility };
    case ActionType.UPDATE_SIDE_PANEL_WIDTH:
      return { ...state, offset: action.offset };
    default:
      return state;
  }
}

/**
 * Reducer managing the dataViewerUpdate property.
 *
 * @param state the current redux state of dataViewerUpdate.
 * @param action application event.
 * @return the updated dataViewerUpdate.
 */
export function dataViewerUpdate(
  state: DataViewerUpdate | null = null,
  action: AppActionTypes,
): DataViewerUpdate | null {
  switch (action.type) {
    case ActionType.DATA_VIEWER_UPDATE:
      return action.update;
    case ActionType.CLEAR_DATA_VIEWER_UPDATE:
      return null;
    default:
      return state;
  }
}

/**
 * Reducer managing the predefinedFilters property.
 *
 * @param state the current redux state of predefinedFilters.
 * @param action application event.
 * @return the updated predefinedFilters.
 */
export function predefinedFilters(state: PredefinedFilter[] = [], action: AppActionTypes): PredefinedFilter[] {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toJson<PredefinedFilter[]>(getHiddenValue('predefined_filters'));
    default:
      return state;
  }
}

/**
 * Reducer managing any pixels a column header has been dragged by.
 *
 * @param state the current redux state of dragResize.
 * @param action application event.
 * @return the updated dragResize.
 */
export function dragResize(state: number | null = null, action: AppActionTypes): number | null {
  switch (action.type) {
    case ActionType.DRAG_RESIZE:
      return action.x;
    case ActionType.STOP_RESIZE:
      return null;
    default:
      return state;
  }
}

export const rowRange = (
  state: RangeSelection<number> | null = null,
  action: AppActionTypes,
): RangeSelection<number> | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.rowRange ?? null;
    default:
      return state;
  }
};

export const columnRange = (
  state: RangeSelection<number> | null = null,
  action: AppActionTypes,
): RangeSelection<number> | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.columnRange ?? null;
    default:
      return state;
  }
};

export const rangeSelect = (
  state: RangeSelection<string> | null = null,
  action: AppActionTypes,
): RangeSelection<string> | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.rangeSelect ?? null;
    default:
      return state;
  }
};

export const ctrlRows = (state: number[] | null = null, action: AppActionTypes): number[] | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.ctrlRows ?? null;
    default:
      return state;
  }
};

export const ctrlCols = (state: number[] | null = null, action: AppActionTypes): number[] | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.ctrlCols ?? null;
    default:
      return state;
  }
};

export const selectedRow = (state: number | null = null, action: AppActionTypes): number | null => {
  switch (action.type) {
    case ActionType.SET_RANGE_STATE:
      return action.selectedRow ?? null;
    default:
      return state;
  }
};

export const formattingOpen = (state: string | null = null, action: AppActionTypes): string | null => {
  switch (action.type) {
    case ActionType.OPEN_FORMATTING:
      return action.selectedCol;
    case ActionType.CLOSE_FORMATTING:
      return null;
    default:
      return state;
  }
};

export const menuOpen = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.OPEN_MENU:
      return true;
    case ActionType.CLOSE_MENU:
      return false;
    default:
      return state;
  }
};
