import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { aggregationOpts, rollingComps } from '../analysis/filters/Constants';

/** Component properties for ChartLabel */
export interface ChartLabelProps {
  x?: BaseOption<string>;
  y?: Array<BaseOption<string>>;
  group?: Array<BaseOption<string>>;
  aggregation?: string;
  rollingWindow?: string;
  rollingComputation?: string;
}

const ChartLabel: React.FC<ChartLabelProps & WithTranslation> = ({
  x,
  y,
  group,
  aggregation,
  rollingWindow,
  rollingComputation,
  t,
}) => {
  const label = React.useMemo(() => {
    const yLabel = (y ?? []).map(({ value }) => value).join(', ');
    let labelStr = yLabel;
    if (aggregation) {
      const aggLabel = aggregationOpts(t).find((option) => option.value === aggregation)?.label;
      if (aggregation === 'rolling') {
        const compLabel = rollingComps(t).find((option) => option.value === rollingComputation)?.label;
        labelStr = `${aggLabel} ${compLabel} (${t('window')}: ${rollingWindow}) ${t('of')} ${yLabel}`;
      } else {
        labelStr = `${aggLabel} of ${yLabel}`;
      }
    }
    labelStr = `${labelStr} ${t('by')} ${x?.value}`;
    if (group?.length) {
      labelStr = `${labelStr} ${t('grouped by')} ${group.map(({ value }) => value).join(', ')}`;
    }
    return labelStr;
  }, [x, y, group, aggregation, rollingWindow, rollingComputation, t]);

  return (
    <div className="pt-5 pb-5 inline">
      <b style={{ color: 'black' }}>{label}</b>
    </div>
  );
};

export default withTranslation(['constants', 'charts'])(ChartLabel);
