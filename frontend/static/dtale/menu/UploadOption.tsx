import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const UploadOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:upload')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-file-upload" />
        <span className="font-weight-bold">{t('Load Data', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(UploadOption);
