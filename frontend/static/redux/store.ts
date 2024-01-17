import { configureStore, Reducer, Store } from '@reduxjs/toolkit';

import * as actions from './actions/dtale';
import * as mergeActions from './actions/merge';
import { reducers as appReducers, AppStoreState } from './reducers/app';
import { reducers as mergeReducers, MergeStoreState } from './reducers/merge';
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
    devTools: process.env.NODE_ENV !== 'production' && (window as any).devToolsExtension,
  });

export const buildApp = (): Store<AppStoreState> => {
  const store = createAppStore<AppStoreState>(appReducers);
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

export const appStore = buildApp();

export const buildMergeApp = (): Store<MergeStoreState> => {
  const store = createAppStore<MergeState>(mergeReducers);
  mergeActions.init(store.dispatch);
  return store;
};

export const mergeStore = buildMergeApp();
