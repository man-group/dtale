import { ActionType, AppActionTypes } from '../../actions/AppActions';
import { ChartData, initialVisibility } from '../../state/AppState';

export const chartData = (state: ChartData = initialVisibility, action: AppActionTypes): ChartData => {
  switch (action.type) {
    case ActionType.OPEN_CHART:
      return { ...action.chartData, visible: true };
    case ActionType.UPDATE_XARRAY_DIM:
    case ActionType.CONVERT_TO_XARRAY:
    case ActionType.CLOSE_CHART:
    case ActionType.LOADING_DATASETS:
      return { visible: false };
    default:
      return state;
  }
  return state;
};
