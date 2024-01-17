import { PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectLanguage } from '../../redux/selectors';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

const LanguageOption: React.FC<RibbonOptionProps & WithTranslation> = ({ ribbonWrapper = (func) => func, t, i18n }) => {
  const language = useAppSelector(selectLanguage);
  const dispatch = useAppDispatch();
  const setLanguage = (updatedLanguage: string): PayloadAction<string> =>
    dispatch(AppActions.SetLanguageAction(updatedLanguage));

  const updateLanguage =
    (newLanguage: string): (() => Promise<void>) =>
    async () => {
      await serverState.updateLanguage(newLanguage);
      setLanguage(newLanguage);
      i18n.changeLanguage(newLanguage);
    };

  return (
    <MenuItem style={{ color: '#565b68' }} description={t('menu_description:language')}>
      <span className="toggler-action">
        <i className="fas fa-language" />
      </span>
      <span className="font-weight-bold pl-2">{t('Language')}</span>
      <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" data-testid="language-options">
        {Object.keys(i18n.options.resources ?? {}).map((value) => (
          <button
            key={value}
            style={{ color: '#565b68' }}
            className={`btn btn-primary ${value === language ? 'active' : ''} font-weight-bold`}
            onClick={value === language ? () => ({}) : ribbonWrapper(updateLanguage(value))}
          >
            {t(value, { ns: 'menu' })}
          </button>
        ))}
      </div>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(LanguageOption);
