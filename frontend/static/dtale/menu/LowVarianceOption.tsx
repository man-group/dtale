import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { MenuItem } from './MenuItem';

require('./LowVarianceOption.css');

/** Component properties for LowVarianceOption */
interface LowVarianceOptionProps {
  backgroundMode?: string;
  toggleLowVarianceBackground: () => void;
}

const LowVarianceOption: React.FC<LowVarianceOptionProps & WithTranslation> = ({
  backgroundMode,
  toggleLowVarianceBackground,
  t,
}) => (
  <MenuItem
    className="hoverable low-variance"
    description={
      <>
        <span>{t('menu_description:low_variance_1')}</span>
        <ul className="low-variance-conditions">
          <li>{t('menu_description:low_variance_2')}</li>
          <li>{t('menu_description:low_variance_3')}</li>
        </ul>
        <span>{t('menu_description:low_variance_4')}</span>
      </>
    }
    onClick={toggleLowVarianceBackground}
  >
    <span className="toggler-action">
      <button className="btn btn-plain">
        <i
          className={`ico-check-box${backgroundMode === 'lowVariance' ? '' : '-outline-blank'}`}
          style={{ marginTop: '-.25em' }}
        />
        <span className="font-weight-bold">{t('Low Variance Flag', { ns: 'menu' })}</span>
      </button>
    </span>
  </MenuItem>
);

export default withTranslation(['menu', 'menu_description'])(LowVarianceOption);
