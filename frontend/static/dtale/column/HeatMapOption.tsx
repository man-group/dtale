import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectSettings } from '../../redux/selectors';
import { InstanceSettings } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';

/** Component properties of HeatMapOption */
interface HeatMapOptionProps {
  selectedCol: string;
  colCfg: ColumnDef;
}

const selectResult = createSelector([selectSettings], (settings) => ({ settings }));

const HeatMapOption: React.FC<HeatMapOptionProps & WithTranslation> = ({ selectedCol, colCfg, t }) => {
  const { settings } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): void =>
    dispatch(settingsActions.updateSettings(updatedSettings));
  const heatmapType = `heatmap-col-${selectedCol}`;
  const heatmapActive = settings.backgroundMode === heatmapType;
  const toggleBackground = (): void =>
    updateSettings({ backgroundMode: settings.backgroundMode === heatmapType ? undefined : heatmapType });

  return (
    <React.Fragment>
      {colCfg.hasOwnProperty('min') && (
        <li>
          <span className="toggler-action">
            <button className="btn btn-plain" onClick={toggleBackground}>
              <i className={`fa fa-${heatmapActive ? 'fire-extinguisher' : 'fire-alt'} ml-2 mr-4`} />
              <span className={`font-weight-bold pl-4${heatmapActive ? ' flames' : ''}`}>
                {t('Heat Map', { ns: 'menu' })}
              </span>
            </button>
          </span>
        </li>
      )}
    </React.Fragment>
  );
};

export default withTranslation('menu')(HeatMapOption);
