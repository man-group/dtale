import { InstanceSettings } from '../state/AppState';

import { ActionType, AppActions } from './AppActions';

export const updateSettings =
  (settings: Partial<InstanceSettings>, callback?: () => void): AppActions<void> =>
  (dispatch) => {
    const updatedSettings = { ...settings };
    updatedSettings.rangeHighlight = updatedSettings.rangeHighlight
      ? JSON.parse(JSON.stringify(updatedSettings.rangeHighlight))
      : updatedSettings.rangeHighlight;
    dispatch({ type: ActionType.UPDATE_SETTINGS, settings: updatedSettings });
    callback?.();
  };
