import { combineReducers } from 'redux';

import { MergeState } from '../../state/MergeState';
import { chartData } from '../app/chart';

import * as merge from './merge';

export default combineReducers<MergeState>({
  chartData,
  ...merge,
});
