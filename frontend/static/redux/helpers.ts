import { ActionCreatorWithPreparedPayload, createAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { AppStoreState } from './reducers/app';
import { MergeStoreState } from './reducers/merge';

const withPayloadType =
  <T>() =>
  (t: T) => ({ payload: t });

export const createActionWithPayload = <T = void>(
  action: string,
): ActionCreatorWithPreparedPayload<[t: T], T, string, never, never> => createAction(action, withPayloadType<T>());

/** App dispatch type definition */
export type AppDispatch = ThunkDispatch<AppStoreState, any, UnknownAction>;

/** Merge dispatch type definition */
export type MergeDispatch = ThunkDispatch<MergeStoreState, any, UnknownAction>;
