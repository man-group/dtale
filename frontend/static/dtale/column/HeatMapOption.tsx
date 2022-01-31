import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as bu from '../backgroundUtils';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';

/** Component properties of HeatMapOption */
interface HeatMapOptionProps {
  selectedCol: string;
  backgroundMode?: string;
  propagateState: DataViewerPropagateState;
  colCfg: ColumnDef;
}

const HeatMapOption: React.FC<HeatMapOptionProps & WithTranslation> = ({
  selectedCol,
  backgroundMode,
  propagateState,
  colCfg,
  t,
}) => {
  const heatmapType = `heatmap-col-${selectedCol}`;
  const heatmapActive = backgroundMode === heatmapType;
  const toggleBackground = (): void =>
    propagateState({
      backgroundMode: backgroundMode === heatmapType ? undefined : heatmapType,
      triggerBgResize: backgroundMode && bu.RESIZABLE.includes(backgroundMode),
    });

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
