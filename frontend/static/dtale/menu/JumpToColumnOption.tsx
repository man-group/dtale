import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const JumpToColumnOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:jump_to_column')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fa-solid fa-magnifying-glass-plus ml-2 mr-4" />
        <span className="font-weight-bold">{t('Jump To Column', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(JumpToColumnOption);
