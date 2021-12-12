import * as serverState from '../../dtale/serverStateManagement';
import { QueryEngine, ThemeType } from '../state/AppState';

import { ActionType, AppActions, InitAction, SidePanelAction } from './AppActions';

export const init = (): InitAction => ({ type: ActionType.INIT_PARAMS });

export const openCustomFilter = (): SidePanelAction => ({ type: ActionType.SHOW_SIDE_PANEL, view: 'filter' });

export const openPredefinedFilters = (): SidePanelAction => ({
  type: ActionType.SHOW_SIDE_PANEL,
  view: 'predefined_filters',
});

export const toggleColumnMenu =
  (colName: string, headerRef: HTMLDivElement): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.TOGGLE_COLUMN_MENU, colName, headerRef });

export const hideColumnMenu =
  (colName: string): AppActions<void> =>
  (dispatch, getState) => {
    const { selectedCol } = getState();
    // when clicking another header cell it calls this after the fact and thus causes the user to click again to show it
    if (selectedCol === colName) {
      dispatch({ type: ActionType.HIDE_COLUMN_MENU, colName });
    }
  };

export const closeColumnMenu = (): AppActions<void> => (dispatch, getState) =>
  dispatch({ type: ActionType.HIDE_COLUMN_MENU, colName: getState().selectedCol });

export const updateXArrayDim =
  (xarrayDim: Record<string, boolean>, callback: () => void): AppActions<void> =>
  (dispatch) => {
    dispatch({ type: ActionType.UPDATE_XARRAY_DIM, xarrayDim });
    callback();
  };

export const convertToXArray =
  (callback: () => void): AppActions<void> =>
  (dispatch) => {
    dispatch({ type: ActionType.CONVERT_TO_XARRAY });
    callback();
  };

export const setTheme =
  (theme: ThemeType): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.SET_THEME, theme });

export const setLanguage =
  (language: string): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.SET_LANGUAGE, language });

export const setQueryEngine =
  (engine: QueryEngine): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.SET_QUERY_ENGINE, engine });

export const isPopup = (): boolean => !!window.location.pathname?.startsWith('/dtale/popup');

export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
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
  (query: string): AppActions<Promise<void>> =>
  async (dispatch, getState) => {
    const { dataId, filteredRanges } = getState();
    const currQuery = filteredRanges?.query ?? '';
    if (currQuery !== query) {
      const ranges = await serverState.loadFilteredRanges(dataId!);
      dispatch({ type: ActionType.UPDATE_FILTERED_RANGES, ranges });
    }
  };

export const updateMaxWidth =
  (width: number): AppActions<void> =>
  (dispatch) => {
    dispatch({ type: ActionType.UPDATE_MAX_WIDTH, width });
    dispatch({ type: ActionType.DATA_VIEWER_UPDATE, update: { type: 'update-max-width', width } });
  };

export const clearMaxWidth = (): AppActions<void> => (dispatch) => {
  dispatch({ type: ActionType.CLEAR_MAX_WIDTH });
  dispatch({ type: ActionType.DATA_VIEWER_UPDATE, update: { type: 'update-max-width', width: null } });
};

export const updateMaxHeight =
  (height: number): AppActions<void> =>
  (dispatch) => {
    dispatch({ type: ActionType.UPDATE_MAX_HEIGHT, height });
    dispatch({ type: ActionType.DATA_VIEWER_UPDATE, update: { type: 'update-max-height', height } });
  };

export const clearMaxHeight = (): AppActions<void> => (dispatch) => {
  dispatch({ type: ActionType.CLEAR_MAX_HEIGHT });
  dispatch({ type: ActionType.DATA_VIEWER_UPDATE, update: { type: 'update-max-height', height: null } });
};

export const updateShowAllHeatmapColumns =
  (showAllHeatmapColumns: boolean): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS, showAllHeatmapColumns });
