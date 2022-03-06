import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { AppState } from '../../redux/state/AppState';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const LogoutOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => {
  const { auth, username } = useSelector((state: AppState) => ({ auth: state.auth, username: state.username }));
  if (auth) {
    return (
      <MenuItem description={t('menu_description:logout')} onClick={open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fas fa-sign-out-alt ml-2 mr-4" />
            <span className="font-weight-bold">{`${t('Logout', {
              ns: 'menu',
            })}, ${username}`}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
  return null;
};

export default withTranslation(['menu', 'menu_description'])(LogoutOption);
