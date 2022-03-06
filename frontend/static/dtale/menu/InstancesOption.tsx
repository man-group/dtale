import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { getHiddenValue } from '../../redux/reducers/utils';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const InstancesOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => (
  <MenuItem description={t('menu_description:instances')} onClick={open}>
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i className="ico-apps" />
        <span className="font-weight-bold">
          {`${t('Instances', { ns: 'menu' })} `}
          <span className="badge badge-secondary">{getHiddenValue('processes')}</span>
        </span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(InstancesOption);
