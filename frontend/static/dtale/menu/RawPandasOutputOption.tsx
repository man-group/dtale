import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const RawPandasOutputOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:raw_pandas')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-view-column" />
        <span className="font-weight-bold">{t('Raw Pandas Output', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(RawPandasOutputOption);
