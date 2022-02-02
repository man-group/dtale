import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const NetworkOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:network')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fas fa-project-diagram ml-2 mr-2" />
        <span className="font-weight-bold">{t('Network Viewer', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(NetworkOption);
