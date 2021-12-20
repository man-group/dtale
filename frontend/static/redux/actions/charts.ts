import { Popups } from '../state/AppState';

import { ActionType, AppActions } from './AppActions';

export const openChart =
  (chartData: Popups): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.OPEN_CHART, chartData });

export const closeChart =
  (chartData: Popups): AppActions<void> =>
  (dispatch) =>
    dispatch({ type: ActionType.CLOSE_CHART, chartData });
