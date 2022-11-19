import { Popups } from '../state/AppState';

import { ActionType, CloseChartAction, OpenChartAction } from './AppActions';

export const openChart = (chartData: Popups): OpenChartAction => ({ type: ActionType.OPEN_CHART, chartData });

export const closeChart = (chartData: Popups): CloseChartAction => ({ type: ActionType.CLOSE_CHART });
