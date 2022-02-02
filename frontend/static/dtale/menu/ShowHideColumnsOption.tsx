import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const ShowHideColumnsOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-visibility" />
        <span className="font-weight-bold">{t('show_hide', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(ShowHideColumnsOption);
