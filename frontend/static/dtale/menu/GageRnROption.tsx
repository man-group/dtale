import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const GageRnROption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:gage_rnr')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fas fa-tachometer-alt ml-2 mr-4" />
        <span className="font-weight-bold">{t('gage_rnr', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(GageRnROption);
