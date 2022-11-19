import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { pivotAggs } from '../analysis/filters/Constants';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  ExpandingConfig,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';
import { LabeledSelect } from './LabeledSelect';

export const validateExpandingCfg = (t: TFunction, cfg: ExpandingConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  if (!cfg.agg) {
    return t('Please select an aggregation!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: ExpandingConfig): CreateColumnCodeSnippet => {
  if (!cfg.col || !cfg.agg) {
    return undefined;
  }
  return `df['${cfg.col}'].expanding(${cfg.periods ?? 1}).${cfg.agg}()`;
};

const CreateExpanding: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const aggs = React.useMemo(() => pivotAggs(t), [t]);
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [periods, setPeriods] = React.useState(1);
  const [agg, setAgg] = React.useState<BaseOption<string>>();

  React.useEffect(() => {
    const cfg: ExpandingConfig = { col: col?.value, periods, agg: agg?.value };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.EXPANDING, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_expansion`;
    }
    updateState(updatedState);
  }, [col, periods, agg]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Col')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <LabeledInput
        type="number"
        label={t('Min Periods') ?? ''}
        value={periods}
        setter={(value) => setPeriods(Number(value))}
      />
      <LabeledSelect
        label={t('Aggregation')}
        options={aggs}
        value={agg}
        onChange={(selected) => setAgg(selected as BaseOption<string>)}
        isClearable={true}
      />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateExpanding);
