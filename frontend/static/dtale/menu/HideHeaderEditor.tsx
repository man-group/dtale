import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ActionType } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { AppState } from '../../redux/state/AppState';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const HideHeaderEditor: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, hideHeaderEditor } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    hideHeaderEditor: state.settings?.hide_header_editor ?? state.hideHeaderEditor,
  }));
  const dispatch = useDispatch();

  const setHideHeaderEditor = async (): Promise<void> => {
    const updates = { hide_header_editor: !hideHeaderEditor };
    await serverState.updateSettings(updates, dataId);
    dispatch(settingsActions.updateSettings(updates) as any as AnyAction);
    dispatch({ type: ActionType.UPDATE_HIDE_HEADER_EDITOR, value: !hideHeaderEditor });
    dispatch({ type: ActionType.HIDE_RIBBON_MENU });
  };

  return (
    <MenuItem
      className="hoverable"
      description={t('menu_description:hide_header_editor')}
      onClick={setHideHeaderEditor}
    >
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i className={`ico-check-box${hideHeaderEditor ? '' : '-outline-blank'}`} style={{ marginTop: '-.25em' }} />
          <span className="font-weight-bold" style={{ fontSize: '95%' }}>
            {t('Hide Header Editor', { ns: 'menu' })}
          </span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(HideHeaderEditor);
