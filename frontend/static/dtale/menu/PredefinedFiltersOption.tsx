import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import { selectPredefinedFilterConfigs } from '../../redux/selectors';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const PredefinedFiltersOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => {
  const predefinedFilters = useAppSelector(selectPredefinedFilterConfigs);
  if (predefinedFilters.length) {
    return (
      <MenuItem description={t('menu_description:predefined_filters')} onClick={open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="fa fa-filter ml-2 mr-4" />
            <span className="font-weight-bold">{t('Predefined Filters', { ns: 'menu' })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
  return null;
};

export default withTranslation(['menu', 'menu_description'])(PredefinedFiltersOption);
