import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const CleanOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('builders:cleaning')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="fas fa-pump-soap ml-3 mr-4" />
        <span className="font-weight-bold">{t('Clean Column', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'builders'])(CleanOption);
