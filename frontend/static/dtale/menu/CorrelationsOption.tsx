import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const CorrelationsOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:corr')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-bubble-chart" />
        <span className="font-weight-bold">{t('Correlations', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(CorrelationsOption);
