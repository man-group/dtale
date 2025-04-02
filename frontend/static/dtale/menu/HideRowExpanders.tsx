import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectDataId, selectHideRowExpanders } from '../../redux/selectors';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const selectResult = createSelector([selectDataId, selectHideRowExpanders], (dataId, hideRowExpanders) => ({
  dataId,
  hideRowExpanders,
}));

const HideRowExpanders: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, hideRowExpanders } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();

  const setHideRowExpanders = async (): Promise<void> => {
    const updates = { hide_row_expanders: !hideRowExpanders };
    await serverState.updateSettings(updates, dataId);
    dispatch(settingsActions.updateSettings(updates));
    dispatch(AppActions.UpdateHideRowExpanders(!hideRowExpanders));
    dispatch(AppActions.HideRibbonMenuAction());
  };

  return (
    <MenuItem
      className="hoverable"
      description={t('menu_description:hide_row_expanders')}
      onClick={setHideRowExpanders}
    >
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i
            className={`ico-check-box${hideRowExpanders ? '' : '-outline-blank'} pr-2`}
            style={{ marginTop: '-.25em' }}
          />
          <span className="font-weight-bold" style={{ fontSize: '95%' }}>
            {t('Hide Row Expanders', { ns: 'menu' })}
          </span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(HideRowExpanders);
