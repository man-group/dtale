import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';

const NewTabOption: React.FC<WithTranslation> = ({ t }) => (
  <React.Fragment>
    {global.top !== global.self && (
      <MenuItem onClick={() => window.open(window.location.pathname?.replace('/iframe/', '/main/'), '_blank')}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-open-in-new" />
            <span className="font-weight-bold">{t('Open In New Tab', { ns: 'menu' })}</span>
          </button>
        </span>
      </MenuItem>
    )}
  </React.Fragment>
);

export default withTranslation(['menu', 'menu_description'])(NewTabOption);
