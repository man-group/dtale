import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, SetLanguageAction } from '../../redux/actions/AppActions';
import { AppState } from '../../redux/state/AppState';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

const LanguageOption: React.FC<RibbonOptionProps & WithTranslation> = ({ ribbonWrapper = (func) => func, t, i18n }) => {
  const language = useSelector((state: AppState) => state.language);
  const dispatch = useDispatch();
  const setLanguage = (updatedLanguage: string): SetLanguageAction =>
    dispatch({ type: ActionType.SET_LANGUAGE, language: updatedLanguage });

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
