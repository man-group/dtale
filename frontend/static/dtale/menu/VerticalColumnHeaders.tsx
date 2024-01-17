import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectDataId, selectVerticalHeaders } from '../../redux/selectors';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const selectResult = createSelector([selectDataId, selectVerticalHeaders], (dataId, verticalHeaders) => ({
  dataId,
  verticalHeaders: verticalHeaders ?? false,
}));

const VerticalColumnHeaders: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, verticalHeaders } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();

  const setVerticalHeaders = async (): Promise<void> => {
    const updates = { verticalHeaders: !verticalHeaders };
    await serverState.updateSettings(updates, dataId);
    dispatch(settingsActions.updateSettings(updates));
    dispatch(AppActions.HideRibbonMenuAction());
  };

  return (
    <MenuItem className="hoverable" description={t('menu_description:vertical_headers')} onClick={setVerticalHeaders}>
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i className={`ico-check-box${verticalHeaders ? '' : '-outline-blank'}`} style={{ marginTop: '-.25em' }} />
          <span className="font-weight-bold" style={{ fontSize: '95%' }}>
            {t('Vertical Column Headers', { ns: 'menu' })}
          </span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(VerticalColumnHeaders);
