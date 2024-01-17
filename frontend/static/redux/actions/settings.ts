import { AppDispatch } from '../helpers';
import { AppThunk } from '../reducers/app';
import { InstanceSettings } from '../state/AppState';

import { AppActions } from './AppActions';

export const updateSettings =
  (settings: Partial<InstanceSettings>, callback?: () => void): AppThunk =>
  (dispatch: AppDispatch) => {
    const updatedSettings = { ...settings };
    updatedSettings.rangeHighlight = updatedSettings.rangeHighlight
      ? JSON.parse(JSON.stringify(updatedSettings.rangeHighlight))
      : updatedSettings.rangeHighlight;
    dispatch(AppActions.UpdateSettingsAction(updatedSettings));
    callback?.();
  };
