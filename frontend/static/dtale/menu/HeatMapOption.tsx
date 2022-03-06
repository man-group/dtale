import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { AppState } from '../../redux/state/AppState';
import * as gu from '../gridUtils';

import { MenuItem } from './MenuItem';

/** Component properties for HeatMapOption */
export interface HeatMapOptionProps {
  toggleBackground: (mode: string) => void;
}

const HeatMapOption: React.FC<HeatMapOptionProps & WithTranslation> = ({ toggleBackground, t }) => {
  const { showAllHeatmapColumns, settings } = useSelector((state: AppState) => state);
  const heatmapActive = gu.heatmapActive(settings.backgroundMode) || gu.heatmapAllActive(settings.backgroundMode);
  return (
    <MenuItem style={{ color: '#565b68' }} description={t('menu_description:heatmap')}>
      <span className="toggler-action">
        <i className={`fa fa-${heatmapActive ? 'fire-extinguisher' : 'fire-alt'} ml-2 mr-4`} />
      </span>
      <span className={`font-weight-bold pl-2${heatmapActive ? ' flames' : ''}`}>{t('Heat Map', { ns: 'menu' })}</span>
      <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" style={{ fontSize: '75%' }}>
        {[
          ['By Col', `heatmap-col${showAllHeatmapColumns ? '-all' : ''}`],
          ['Overall', `heatmap-all${showAllHeatmapColumns ? '-all' : ''}`],
        ].map(([label, mode]) => (
          <button
            key={label}
            style={{ color: '#565b68' }}
            className="btn btn-primary font-weight-bold"
            onClick={() => toggleBackground(mode)}
          >
            {mode === settings.backgroundMode && <span className="flames">{t(label, { ns: 'menu' })}</span>}
            {mode !== settings.backgroundMode && t(label, { ns: 'menu' })}
          </button>
        ))}
      </div>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(HeatMapOption);
