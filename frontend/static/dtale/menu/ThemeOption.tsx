import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectTheme } from '../../redux/selectors';
import { ThemeType } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

const ReactThemeOption: React.FC<RibbonOptionProps & WithTranslation> = ({ ribbonWrapper = (func) => func, t }) => {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();
  const updateTheme = (newTheme: ThemeType) => async () => {
    await serverState.updateTheme(newTheme);
    dispatch(AppActions.SetThemeAction(newTheme));
  };

  return (
    <MenuItem style={{ color: '#565b68' }} description={t('menu_description:theme')}>
      <span className="toggler-action">
        <i className="fas fa-adjust" />
      </span>
      <span className="font-weight-bold pl-2">Theme</span>
      <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
        {Object.values(ThemeType).map((value) => (
          <button
            key={value}
            style={{ color: '#565b68' }}
            className={`btn btn-primary ${value === theme ? 'active' : ''} font-weight-bold`}
            onClick={value === theme ? () => ({}) : ribbonWrapper(updateTheme(value))}
          >
            {t(capitalize(value), { ns: 'menu' })}
          </button>
        ))}
      </div>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(ReactThemeOption);
