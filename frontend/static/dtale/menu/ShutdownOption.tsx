import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import { selectHideShutdown } from '../../redux/selectors';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const ShutdownOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => {
  const hideShutdown = useAppSelector(selectHideShutdown);
  if (hideShutdown) {
    return null;
  }
  return (
    <MenuItem description={t('menu_description:shutdown')} onClick={open}>
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i className="fa fa-power-off ml-2 mr-4" />
          <span className="font-weight-bold">{t('Shutdown', { ns: 'menu' })}</span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(ShutdownOption);
