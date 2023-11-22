import { configureStore } from '@reduxjs/toolkit';
import { Reducer, Store } from 'redux';

import * as actions from './actions/dtale';
import * as mergeActions from './actions/merge';
import appReducers from './reducers/app';
import mergeReducers from './reducers/merge';
import { AppState } from './state/AppState';
import { MergeState } from './state/MergeState';

/**
 * Create a redux store.
 *
 * @param extendedReducers the reducers to be used by this redux store.
 * @return redux store.
 */
export const createAppStore = <T>(extendedReducers: Reducer<T>): Store<T> =>
  configureStore({
    reducer: extendedReducers,
    devTools: process.env.NODE_ENV !== 'production' && (window as any).devToolsExtension,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: {
          ignoredPaths: [
            'selectedColRef',
            'instances',
            'menuTooltip.element',
            'menuTooltip.content',
            'ribbonDropdown.element',
            'chartData',
            'settings',
            'dataViewerUpdate',
            'rowRange',
            'columnRange',
            'rangeSelect',
            'ctrlCols',
            'ctrlRows',
            'xarrayDim',
          ],
        },
      }),
  });

export const buildApp = (): Store => {
  const store = createAppStore<AppState>(appReducers);
  store.dispatch(actions.init());
  actions.loadBackgroundMode(store);
  actions.loadHideShutdown(store);
  actions.loadAllowCellEdits(store);
  actions.loadHideHeaderEditor(store);
  actions.loadLockHeaderMenu(store);
  actions.loadHideHeaderMenu(store);
  actions.loadHideMainMenu(store);
  actions.loadHideColumnMenus(store);
  actions.loadEnableCustomFilters(store);
  return store;
};

export const buildMergeApp = (): Store => {
  const store = createAppStore<MergeState>(mergeReducers);
  mergeActions.init(store.dispatch);
  return store;
};
