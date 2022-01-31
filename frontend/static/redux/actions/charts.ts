import { Popups } from '../state/AppState';

import { ActionType, AppActions, CloseChartAction, OpenChartAction } from './AppActions';

export const openChart =
  (chartData: Popups): AppActions<void> =>
  (dispatch): OpenChartAction =>
    dispatch({ type: ActionType.OPEN_CHART, chartData });

export const closeChart =
  (chartData: Popups): AppActions<void> =>
  (dispatch): CloseChartAction =>
    dispatch({ type: ActionType.CLOSE_CHART, chartData });
