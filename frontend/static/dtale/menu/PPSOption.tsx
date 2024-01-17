import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import { selectPythonVersion } from '../../redux/selectors';

import { MenuItem } from './MenuItem';
import { MenuOptionProps } from './MenuState';

const PPSOption: React.FC<MenuOptionProps & WithTranslation> = ({ open, t }) => {
  const pythonVersion = useAppSelector(selectPythonVersion);

  if (!pythonVersion || (pythonVersion[0] >= 3 && pythonVersion[1] >= 6)) {
    return (
      <MenuItem description={t('menu_description:pps')} onClick={open}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-bubble-chart" />
            <span className="font-weight-bold">{t('Predictive Power Score', { ns: 'menu' })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
  return null;
};

export default withTranslation(['menu', 'menu_description'])(PPSOption);
