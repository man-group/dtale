import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ActionType } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { AppState } from '../../redux/state/AppState';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const VerticalColumnHeaders: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, verticalHeaders } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    verticalHeaders: state.settings?.verticalHeaders ?? false,
  }));
  const dispatch = useDispatch();

  const setVerticalHeaders = async (): Promise<void> => {
    const updates = { verticalHeaders: !verticalHeaders };
    await serverState.updateSettings(updates, dataId);
    dispatch(settingsActions.updateSettings(updates) as any as AnyAction);
    dispatch({ type: ActionType.HIDE_RIBBON_MENU });
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
