import { createReducer } from '@reduxjs/toolkit';

import { AppActions } from '../../actions/AppActions';
import { getHiddenValue, toBool } from '../utils';

export const auth = createReducer(false, (builder) =>
  builder.addCase(AppActions.InitAction, () => toBool(getHiddenValue('auth'))),
);

export const username = createReducer<string | null>(null, (builder) =>
  builder.addCase(AppActions.InitAction, () => getHiddenValue('username') ?? null),
);
