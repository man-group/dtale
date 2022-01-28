import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { ColumnDef } from '../../dtale/DataViewerState';
import { BaseOption } from '../../redux/state/AppState';
import { resampleAggs } from '../analysis/filters/Constants';
import ColumnSelect from '../create/ColumnSelect';
import { LabeledSelect } from '../create/LabeledSelect';

import { BaseComponentProps, BaseTimeseriesConfig } from './TimeseriesAnalysisState';

export const validate = (cfg: BaseTimeseriesConfig): string | undefined => {
  const { index, col } = cfg;
  if (!index) {
    return 'Missing an index selection!';
  }
  if (!col) {
    return 'Missing a column selection!';
  }
  return undefined;
};

export const buildCode = (cfg: BaseTimeseriesConfig): string => {
  const { agg, index, col } = cfg;
  if (agg) {
    return `s = df.groupby('${index}')['${col}'].${agg}()`;
  }
  return `s = df.set_index('${index}')['${col}']`;
};

/** Component properties of BaseInputs */
export interface BaseInputProps extends BaseComponentProps<BaseTimeseriesConfig> {
  columns: ColumnDef[];
}

const BaseInputs: React.FC<BaseInputProps & WithTranslation> = ({ columns, cfg, updateState, t }) => {
  const aggs = React.useMemo(() => resampleAggs(t), [t]);
  const [index, setIndex] = React.useState<BaseOption<string> | undefined>(
    cfg?.index ? { value: cfg.index } : undefined,
  );
  const [col, setCol] = React.useState<BaseOption<string> | undefined>(cfg?.col ? { value: cfg.col } : undefined);
  const [agg, setAgg] = React.useState<BaseOption<string> | undefined>(cfg?.agg ? { value: cfg.agg } : undefined);

  React.useEffect(() => {
    updateState({
      index: index?.value,
      col: col?.value,
      agg: agg?.value,
    });
  }, [index, col, agg]);

  return (
    <>
      <div className="col-md-4">
        <ColumnSelect
          label={t('timeseries:Index')}
          prop="index"
          parent={{ index }}
          updateState={(updates: { index?: BaseOption<string> }) => setIndex(updates.index)}
          columns={columns}
          dtypes={['date']}
        />
      </div>
      <div className="col-md-4">
        <ColumnSelect
          label={t('timeseries:Column')}
          prop="col"
          parent={{ col }}
          updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
          columns={columns}
          dtypes={['int', 'float']}
        />
      </div>
      <div className="col-md-4">
        <LabeledSelect
          label={t('timeseries:Agg')}
          options={aggs}
          value={agg}
          onChange={(selected) => setAgg(selected as BaseOption<string>)}
          isClearable={true}
        />
      </div>
    </>
  );
};

export default withTranslation(['timeseries', 'constants'])(BaseInputs);
