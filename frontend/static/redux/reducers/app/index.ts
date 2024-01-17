import { combineReducers, UnknownAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import * as auth from './auth';
import * as chart from './chart';
import * as dtale from './dtale';
import * as settings from './settings';

export const reducers = combineReducers({
  ...dtale,
  ...chart,
  ...auth,
  ...settings,
});

/** App redux store state type definition */
export type AppStoreState = ReturnType<typeof reducers>;

/** App redux thunk action type definition */
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppStoreState, unknown, UnknownAction>;
