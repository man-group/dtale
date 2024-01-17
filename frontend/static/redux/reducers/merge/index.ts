import { combineReducers, UnknownAction } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import { chartData } from '../app/chart';

import * as merge from './merge';

export const reducers = combineReducers({
  chartData,
  ...merge,
});

/** Merge redux store state type definition */
export type MergeStoreState = ReturnType<typeof reducers>;

/** Merge redux thunk action type definition */
export type MergeThunk<ReturnType = void> = ThunkAction<ReturnType, MergeStoreState, unknown, UnknownAction>;
