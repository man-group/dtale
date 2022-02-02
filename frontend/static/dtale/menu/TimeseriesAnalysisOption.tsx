import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const TimeseriesAnalysisOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:timeseries_analysis')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-schedule ml-2" />
        <span className="font-weight-bold">{t('Time Series Analysis', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(TimeseriesAnalysisOption);
