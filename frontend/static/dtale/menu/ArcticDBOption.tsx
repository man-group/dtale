import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const ArcticDBOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:arcticdb')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fa-solid fa-database ml-2 mr-4" />
        <span className="font-weight-bold">{t('Load ArcticDB Data', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(ArcticDBOption);
