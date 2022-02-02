import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const CodeExportOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:code')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-code" />
        <span className="font-weight-bold">{t('Code Export', { ns: 'code_export' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(CodeExportOption);
