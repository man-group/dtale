import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectDataId, selectHideHeaderEditor } from '../../redux/selectors';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const selectResult = createSelector([selectDataId, selectHideHeaderEditor], (dataId, hideHeaderEditor) => ({
  dataId,
  hideHeaderEditor,
}));

const HideHeaderEditor: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, hideHeaderEditor } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();

  const setHideHeaderEditor = async (): Promise<void> => {
    const updates = { hide_header_editor: !hideHeaderEditor };
    await serverState.updateSettings(updates, dataId);
    dispatch(settingsActions.updateSettings(updates));
    dispatch(AppActions.UpdateHideHeaderEditor(!hideHeaderEditor));
    dispatch(AppActions.HideRibbonMenuAction());
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
