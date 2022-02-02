import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';

const ReloadOption: React.FC<WithTranslation> = ({ t }) => (
  <MenuItem description={t('menu_description:reload_data')} onClick={() => window.location.reload()}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-sync" />
        <span className="font-weight-bold">{t('Reload Data', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(ReloadOption);
