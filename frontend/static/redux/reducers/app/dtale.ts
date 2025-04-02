import { createReducer } from '@reduxjs/toolkit';

import { RangeSelection } from '../../../dtale/DataViewerState';
import { AppActions } from '../../actions/AppActions';
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

export const dataId = createReducer('', (builder) =>
  builder
    .addCase(AppActions.InitAction, () => getHiddenValue('data_id') ?? '')
    .addCase(AppActions.LoadPreviewAction, (state, action) => action.payload),
);

export const iframe = createReducer(false, (builder) =>
  builder.addCase(AppActions.InitAction, () => toBool(getHiddenValue('iframe'))),
);

export const editedCell = createReducer<string | null>(null, (builder) =>
  builder
    .addCase(AppActions.EditedCellAction, (state, action) => action.payload ?? null)
    .addCase(AppActions.ToggleColumnMenuAction, () => null)
    .addCase(AppActions.ClearEditAction, () => null),
);

export const editedTextAreaHeight = createReducer(0, (builder) =>
  builder
    .addCase(AppActions.EditedTextAreaHeightAction, (state, action) => action.payload)
    .addCase(AppActions.ToggleColumnMenuAction, () => 0)
    .addCase(AppActions.ClearEditAction, () => 0),
);

export const columnMenuOpen = createReducer(false, (builder) =>
  builder.addCase(AppActions.ToggleColumnMenuAction, () => true).addCase(AppActions.HideColumnMenuAction, () => false),
);

export const selectedCol = createReducer<string | null>(null, (builder) =>
  builder
    .addCase(AppActions.ToggleColumnMenuAction, (state, action) => action.payload.colName ?? null)
    .addCase(AppActions.HideColumnMenuAction, () => null),
);

export const selectedColRef = createReducer<HTMLElement | null>(null, (builder) =>
  builder
    .addCase(AppActions.ToggleColumnMenuAction, (state, action) => action.payload.headerRef ?? null)
    .addCase(AppActions.HideColumnMenuAction, () => null),
);

export const xarray = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('xarray')))
    .addCase(AppActions.ConvertToXarrayAction, () => true),
);

export const xarrayDim = createReducer<Record<string, any>>({}, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toJson<Record<string, any>>(getHiddenValue('xarray_dim')))
    .addCase(AppActions.UpdateXarrayDimAction, (state, action) => action.payload ?? {})
    .addCase(AppActions.ConvertToXarrayAction, () => ({})),
);

export const filteredRanges = createReducer<FilteredRanges>({}, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toJson<FilteredRanges>(getHiddenValue('filtered_ranges')))
    .addCase(AppActions.UpdateFilteredRangesAction, (state, action) => action.payload ?? {}),
);

export const settings = createReducer<InstanceSettings>({ ...BASE_INSTANCE_SETTINGS }, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toJson<InstanceSettings>(getHiddenValue('settings')))
    .addCase(AppActions.UpdateSettingsAction, (state, action) => ({ ...state, ...action.payload })),
);

export const isPreview = createReducer(false, (builder) => builder.addCase(AppActions.LoadPreviewAction, () => true));

export const menuPinned = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('pin_menu')))
    .addCase(AppActions.ToggleMenuPinnedAction, (state) => !state),
);

export const menuTooltip = createReducer<MenuTooltipProps>({ ...initialVisibility }, (builder) =>
  builder
    .addCase(AppActions.ShowMenuTooltipAction, (state, { payload }) => ({
      visible: true,
      element: payload.element,
      content: payload.content,
    }))
    .addCase(AppActions.HideMenuTooltipAction, (state) => ({ ...state, ...initialVisibility }))
    .addCase(AppActions.HideRibbonMenuAction, (state) => ({ ...state, ...initialVisibility }))
    .addCase(AppActions.ClearEditAction, (state) => ({ ...state, ...initialVisibility })),
);

export const ribbonMenuOpen = createReducer(false, (builder) =>
  builder.addCase(AppActions.ShowRibbonMenuAction, () => true).addCase(AppActions.HideRibbonMenuAction, () => false),
);

export const ribbonDropdown = createReducer<RibbonDropdownProps>({ ...initialVisibility }, (builder) =>
  builder
    .addCase(AppActions.OpenRibbonDropdownAction, (state, { payload }) => ({
      visible: true,
      element: payload.element,
      name: payload.name,
    }))
    .addCase(AppActions.HideRibbonMenuAction, (state) => ({ ...state, ...initialVisibility })),
);

export const sidePanel = createReducer<SidePanelProps>({ ...initialVisibility }, (builder) =>
  builder
    .addCase(AppActions.ShowSidePanelAction, (state, { payload }) => ({
      visible: true,
      view: payload.view,
      column: payload.column,
    }))
    .addCase(AppActions.HideSidePanelAction, (state) => ({ ...state, ...initialVisibility }))
    .addCase(AppActions.UpdateSidePanelWidthAction, (state, { payload }) => ({ ...state, offset: payload.offset })),
);

export const dataViewerUpdate = createReducer<DataViewerUpdate | null>(null, (builder) =>
  builder
    .addCase(AppActions.DataViewerUpdateAction, (state, { payload }) => payload)
    .addCase(AppActions.ClearDataViewerUpdateAction, () => null),
);

export const predefinedFilters = createReducer<PredefinedFilter[]>([], (builder) =>
  builder.addCase(AppActions.InitAction, () => toJson<PredefinedFilter[]>(getHiddenValue('predefined_filters'))),
);

export const dragResize = createReducer<number | null>(null, (builder) =>
  builder
    .addCase(AppActions.DragResizeAction, (state, { payload }) => payload)
    .addCase(AppActions.StopResizeAction, () => null),
);

export const rowRange = createReducer<RangeSelection<number> | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.rowRange ?? null),
);

export const columnRange = createReducer<RangeSelection<number> | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.columnRange ?? null),
);

export const rangeSelect = createReducer<RangeSelection<string> | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.rangeSelect ?? null),
);

export const ctrlRows = createReducer<number[] | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.ctrlRows ?? null),
);

export const ctrlCols = createReducer<number[] | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.ctrlCols ?? null),
);

export const selectedRow = createReducer<number | null>(null, (builder) =>
  builder.addCase(AppActions.SetRangeStateAction, (state, { payload }) => payload.selectedRow ?? null),
);

export const formattingOpen = createReducer<string | null>(null, (builder) =>
  builder
    .addCase(AppActions.OpenFormattingAction, (state, { payload }) => payload)
    .addCase(AppActions.CloseFormattingAction, () => null),
);

export const menuOpen = createReducer(false, (builder) =>
  builder.addCase(AppActions.OpenMenuAction, () => true).addCase(AppActions.CloseMenuAction, () => false),
);

export const columnAggregations = createReducer<string | null>(null, (builder) =>
  builder.addCase(AppActions.UpdateColumnAggregations, (state, { payload }) => payload.colName ?? null),
);
