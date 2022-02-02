import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const DescribeOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:describe')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-view-column" />
        <span className="font-weight-bold">{t('Describe', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(DescribeOption);
