import { ActionType, AppActionTypes } from '../../actions/AppActions';
import { initialPopup, Popups } from '../../state/AppState';

export const chartData = (state: Popups = initialPopup, action: AppActionTypes): Popups => {
  switch (action.type) {
    case ActionType.OPEN_CHART:
      return { ...action.chartData, visible: true };
    case ActionType.UPDATE_XARRAY_DIM:
    case ActionType.CONVERT_TO_XARRAY:
    case ActionType.CLOSE_CHART:
    case ActionType.LOADING_DATASETS:
      return { ...state, visible: false };
    default:
      return state;
  }
  return state;
};
