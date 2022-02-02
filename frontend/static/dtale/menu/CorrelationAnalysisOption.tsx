import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const CorrelationAnalysisOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:corr_analysis')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-bubble-chart" />
        <span className="font-weight-bold">{t('Feature Analysis', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(CorrelationAnalysisOption);
