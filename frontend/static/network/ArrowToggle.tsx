import * as React from 'react';
import { TFunction, withTranslation } from 'react-i18next';

import { ArrowState } from './NetworkState';

/** Component properties for ArrowToggle */
interface ArrowToggleProps {
  updateArrows: (arrowState: Partial<ArrowState>) => void;
  to: boolean;
  from: boolean;
  t: TFunction;
}

export const ArrowToggle: React.FC<ArrowToggleProps> = ({ updateArrows, to, from, t }) => (
  <div className="col-auto pl-0">
    <b>{t('Arrows')}</b>
    <div className="btn-group compact col-auto">
      <button className={`btn btn-primary ${to ? 'active' : 'inactive'}`} onClick={() => updateArrows({ to: !to })}>
        {t('To')}
      </button>
      <button
        className={`btn btn-primary ${from ? 'active' : 'inactive'}`}
        onClick={() => updateArrows({ from: !from })}
      >
        {t('From')}
      </button>
    </div>
  </div>
);
export default withTranslation('network')(ArrowToggle);
