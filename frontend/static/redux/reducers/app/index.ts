import { combineReducers } from 'redux';

import { AppState } from '../../state/AppState';

import * as auth from './auth';
import { chartData } from './chart';
import * as dtale from './dtale';
import * as settings from './settings';

export default combineReducers<AppState>({
  ...dtale,
  chartData,
  ...auth,
  ...settings,
});
