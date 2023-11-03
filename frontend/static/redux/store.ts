import { configureStore } from '@reduxjs/toolkit';
import { Reducer, Store } from 'redux';

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
          ],
        },
      }),
  });
