import { InstanceSettings } from '../state/AppState';

import { ActionType, AppActions } from './AppActions';

export const updateSettings =
  (settings: InstanceSettings, callback?: () => void): AppActions<void> =>
  (dispatch) => {
    dispatch({ type: ActionType.UPDATE_SETTINGS, settings });
    callback?.();
  };
