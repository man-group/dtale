import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const AboutOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:about')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fa fa-info-circle la-lg mr-4 ml-1" />
        <span className="font-weight-bold">{t('About', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(AboutOption);
