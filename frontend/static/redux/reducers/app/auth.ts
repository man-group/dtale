import { ActionType, AppActionTypes } from '../../actions/AppActions';
import { getHiddenValue, toBool } from '../utils';

export const auth = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('auth'));
    default:
      return state;
  }
};

export const username = (state: string | null = null, action: AppActionTypes): string | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return getHiddenValue('username') ?? null;
    default:
      return state;
  }
};
