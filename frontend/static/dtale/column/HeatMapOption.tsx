import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { AppActions } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';

/** Component properties of HeatMapOption */
interface HeatMapOptionProps {
  selectedCol: string;
  colCfg: ColumnDef;
}

const HeatMapOption: React.FC<HeatMapOptionProps & WithTranslation> = ({ selectedCol, colCfg, t }) => {
  const { settings } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AppActions<void> =>
    dispatch(settingsActions.updateSettings(updatedSettings));
  const heatmapType = `heatmap-col-${selectedCol}`;
  const heatmapActive = settings.backgroundMode === heatmapType;
  const toggleBackground = (): AppActions<void> =>
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
