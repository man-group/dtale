import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const MergeOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:merge')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fas fa-object-group pl-3 pr-3" />
        <span className="font-weight-bold">{t('Merge & Stack', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(MergeOption);
