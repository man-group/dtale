import { applyMiddleware, createStore, Reducer, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import thunk from 'redux-thunk';

const composeEnhancers = composeWithDevTools({
  serialize: false,
});

/**
 * Create a redux store.
 *
 * @param extendedReducers the reducers to be used by this redux store.
 * @return redux store.
 */
export function createAppStore<T>(extendedReducers: Reducer<T>): Store<T> {
  const middlewares = [thunk];
  let middleware: any = applyMiddleware(...middlewares);

  if (process.env.NODE_ENV !== 'production' && (window as any).devToolsExtension) {
    middleware = composeEnhancers(middleware, (window as any).devToolsExtension());
  }

  return createStore(extendedReducers, middleware);
}
