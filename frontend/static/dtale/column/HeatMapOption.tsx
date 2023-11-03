import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import * as settingsActions from '../../redux/actions/settings';
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
  const { settings } = useSelector(selectResult);
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);
  const heatmapType = `heatmap-col-${selectedCol}`;
  const heatmapActive = settings.backgroundMode === heatmapType;
  const toggleBackground = (): AnyAction =>
    updateSettings({ backgroundMode: settings.backgroundMode === heatmapType ? undefined : heatmapType });

  return (
    <React.Fragment>
      {colCfg.hasOwnProperty('min') && (
        <li>
          <span className="toggler-action">
            <button className="btn btn-plain" onClick={toggleBackground}>
              <i className={`fa fa-${heatmapActive ? 'fire-extinguisher' : 'fire-alt'} ml-2 mr-4`} />
              <span className={`font-weight-bold pl-3${heatmapActive ? ' flames' : ''}`}>
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
