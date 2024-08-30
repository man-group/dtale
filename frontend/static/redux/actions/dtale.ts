import { PayloadAction, Store } from '@reduxjs/toolkit';

import * as serverState from '../../dtale/serverStateManagement';
import { SidePanelActionProps } from '../actions/AppActions';
import { AppDispatch } from '../helpers';
import { AppStoreState, AppThunk } from '../reducers/app';
import {
  DataViewerUpdateType,
  InstanceSettings,
  QueryEngine,
  SidePanelType,
  UpdateMaxHeightDataViewerUpdate,
  UpdateMaxWidthDataViewerUpdate,
} from '../state/AppState';

import { AppActions } from './AppActions';

export const init = (): PayloadAction<void> => AppActions.InitAction();

export const loadBackgroundMode = (store: Store<AppStoreState>): void => {
  const { settings } = store.getState();
  store.dispatch(
    AppActions.UpdateSettingsAction({
      backgroundMode: settings.backgroundMode ?? (!!settings.rangeHighlight?.length ? 'range' : undefined),
    } as Partial<InstanceSettings>),
  );
};

export const loadHideShutdown = (store: Store<AppStoreState>): void => {
  const { settings, hideShutdown } = store.getState();
  store.dispatch(AppActions.UpdateHideShutdown(hideShutdown ?? settings.hide_shutdown ?? hideShutdown));
};

export const loadAllowCellEdits = (store: Store<AppStoreState>): void => {
  const { settings, allowCellEdits } = store.getState();
  store.dispatch(AppActions.UpdateAllowCellEdits(settings.allow_cell_edits ?? allowCellEdits));
};

export const loadHideHeaderEditor = (store: Store<AppStoreState>): void => {
  const { settings, hideHeaderEditor } = store.getState();
  store.dispatch(
    AppActions.UpdateHideHeaderEditor(hideHeaderEditor ?? settings.hide_header_editor ?? hideHeaderEditor),
  );
};

export const loadLockHeaderMenu = (store: Store<AppStoreState>): void => {
  const { settings, lockHeaderMenu } = store.getState();
  store.dispatch(AppActions.UpdateLockHeaderMenu(lockHeaderMenu ?? settings.lock_header_menu ?? lockHeaderMenu));
};

export const loadHideHeaderMenu = (store: Store<AppStoreState>): void => {
  const { settings, hideHeaderMenu } = store.getState();
  store.dispatch(AppActions.UpdateHideHeaderMenu(hideHeaderMenu ?? settings.hide_header_menu ?? hideHeaderMenu));
};

export const loadHideMainMenu = (store: Store<AppStoreState>): void => {
  const { settings, hideMainMenu } = store.getState();
  store.dispatch(AppActions.UpdateHideMainMenu(hideMainMenu ?? settings.hide_main_menu ?? hideMainMenu));
};

export const loadHideColumnMenus = (store: Store<AppStoreState>): void => {
  const { settings, hideColumnMenus } = store.getState();
  store.dispatch(AppActions.UpdateHideColumnMenus(hideColumnMenus ?? settings.hide_column_menus ?? hideColumnMenus));
};

export const loadEnableCustomFilters = (store: Store<AppStoreState>): void => {
  const { settings, enableCustomFilters } = store.getState();
  store.dispatch(
    AppActions.UpdateEnableCustomFilters(enableCustomFilters ?? settings.enable_custom_filters ?? enableCustomFilters),
  );
};

export const openCustomFilter = (): PayloadAction<SidePanelActionProps> =>
  AppActions.ShowSidePanelAction({ view: SidePanelType.FILTER });

export const openPredefinedFilters = (): PayloadAction<SidePanelActionProps> =>
  AppActions.ShowSidePanelAction({
    view: SidePanelType.PREDEFINED_FILTERS,
  });

export const toggleColumnMenu = (
  colName: string,
  headerRef: HTMLElement,
): PayloadAction<{
  colName?: string;
  headerRef?: HTMLElement;
}> =>
  AppActions.ToggleColumnMenuAction({
    colName,
    headerRef,
  });

export const hideColumnMenu =
  (colName: string): AppThunk =>
  (dispatch: AppDispatch, getState: () => AppStoreState) => {
    const { selectedCol } = getState();
    // when clicking another header cell it calls this after the fact and thus causes the user to click again to show it
    if (selectedCol === colName) {
      dispatch(AppActions.HideColumnMenuAction({ colName }));
    }
  };

export const closeColumnMenu = (): AppThunk => (dispatch: AppDispatch, getState: () => AppStoreState) =>
  dispatch(AppActions.HideColumnMenuAction({ colName: getState().selectedCol ?? undefined }));

export const updateXArrayDimAction = (xarrayDim: Record<string, any>): PayloadAction<Record<string, any>> =>
  AppActions.UpdateXarrayDimAction(xarrayDim);

export const updateXArrayDim =
  (xarrayDim: Record<string, boolean>, callback: () => void): AppThunk =>
  (dispatch: AppDispatch) => {
    dispatch(updateXArrayDimAction(xarrayDim));
    callback();
  };

export const convertToXArray =
  (callback: () => void): AppThunk =>
  (dispatch: AppDispatch) => {
    dispatch(AppActions.ConvertToXarrayAction());
    callback();
  };

export const setQueryEngine = (engine: QueryEngine): PayloadAction<QueryEngine> =>
  AppActions.SetQueryEngineAction(engine);

export const isPopup = (): boolean => !!window.location.pathname?.startsWith('/dtale/popup');

export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
};

export const getParams = (): Record<string, string | string[]> => {
  const search = location.search.substring(1);
  if (!search) {
    return {};
  }
  const params = JSON.parse(
    '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}',
  );
  return Object.keys(params).reduce((res: Record<string, string | string[]>, key: string) => {
    const value = `${params[key]}`;
    if (value) {
      if (value.includes(',') && !isJSON(value)) {
        return { ...res, [key]: value.split(',') };
      }
      return { ...res, [key]: value };
    }
    return res;
  }, {});
};

export const updateFilteredRanges =
  (query: string): AppThunk =>
  async (dispatch: AppDispatch, getState: () => AppStoreState) => {
    const { dataId, filteredRanges, isArcticDB, columnCount } = getState();
    if (!!isArcticDB && (isArcticDB >= 1_000_000 || columnCount > 100)) {
      return;
    }
    const currQuery = filteredRanges?.query ?? '';
    if (currQuery !== query) {
      const ranges = await serverState.loadFilteredRanges(dataId!);
      if (ranges?.ranges) {
        dispatch(AppActions.UpdateFilteredRangesAction(ranges.ranges));
      }
    }
  };

export const updateMaxWidth =
  (width: number): AppThunk =>
  (dispatch) => {
    dispatch(AppActions.UpdateMaxColumnWidthAction(width));
    dispatch(
      AppActions.DataViewerUpdateAction({
        type: DataViewerUpdateType.UPDATE_MAX_WIDTH,
        width,
      } as UpdateMaxWidthDataViewerUpdate),
    );
  };

export const clearMaxWidth = (): AppThunk => (dispatch) => {
  dispatch(AppActions.ClearMaxWidthAction());
  dispatch(
    AppActions.DataViewerUpdateAction({
      type: DataViewerUpdateType.UPDATE_MAX_WIDTH,
    } as UpdateMaxWidthDataViewerUpdate),
  );
};

export const updateMaxHeight =
  (height: number): AppThunk =>
  (dispatch) => {
    dispatch(AppActions.UpdateMaxRowHeightAction(height));
    dispatch(
      AppActions.DataViewerUpdateAction({
        type: DataViewerUpdateType.UPDATE_MAX_HEIGHT,
        height,
      } as UpdateMaxHeightDataViewerUpdate),
    );
  };

export const clearMaxHeight = (): AppThunk => (dispatch) => {
  dispatch(AppActions.ClearMaxHeightAction());
  dispatch(
    AppActions.DataViewerUpdateAction({
      type: DataViewerUpdateType.UPDATE_MAX_HEIGHT,
      height: null,
    } as UpdateMaxHeightDataViewerUpdate),
  );
};

export const updateShowAllHeatmapColumns = (showAllHeatmapColumns: boolean): PayloadAction<boolean> =>
  AppActions.UpdateShowAllHeatmapColumnsAction(showAllHeatmapColumns);
