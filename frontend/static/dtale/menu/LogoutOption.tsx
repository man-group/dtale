import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import { selectAuth, selectUsername } from '../../redux/selectors';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const selectResult = createSelector([selectAuth, selectUsername], (auth, username) => ({ auth, username }));

const LogoutOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => {
  const { auth, username } = useAppSelector(selectResult);
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
