import * as React from 'react';
import { TFunction, WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { pivotAggs } from '../analysis/filters/Constants';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnUpdateState, TransformConfig } from './CreateColumnState';
import { LabeledSelect } from './LabeledSelect';

export const validateTransformCfg = (t: TFunction, cfg: TransformConfig): string | undefined => {
  if (!cfg.group?.length) {
    return t('Please select a group!');
  }
  if (!cfg.col) {
    return t('Please select a column to transform!');
  }
  if (!cfg.agg) {
    return t('Please select an aggregation!');
  }
  return undefined;
};

export const buildCode = (cfg: TransformConfig): CreateColumnCodeSnippet => {
  if (!cfg.col || !cfg.group?.length || !cfg.agg) {
    return undefined;
  }

  return `df.groupby(['${cfg.group?.join("', '")}'])['${cfg.col}'].transform('${cfg.agg}')`;
};

const CreateTransform: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const aggs = React.useMemo(() => pivotAggs(t), [t]);
  const [group, setGroup] = React.useState<Array<BaseOption<string>>>();
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [agg, setAgg] = React.useState<BaseOption<string>>();

  React.useEffect(() => {
    const cfg: TransformConfig = { group: group?.map(({ value }) => value), col: col?.value, agg: agg?.value };
    const updatedState: CreateColumnUpdateState = { cfg, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_transform`;
    }
    updateState(updatedState);
  }, [group, col, agg]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Group By')}
        prop="group"
        otherProps={['col']}
        parent={{ col, group }}
        updateState={(updates: { group?: Array<BaseOption<string>> }) => setGroup(updates.group)}
        columns={columns}
        isMulti={true}
      />
      <ColumnSelect
        label={t('Col')}
        prop="col"
        otherProps={['group']}
        parent={{ col, group }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <LabeledSelect
        label={t('Aggregation')}
        options={aggs}
        value={agg}
        onChange={(selected) => setAgg(selected as BaseOption<string>)}
      />
    </React.Fragment>
  );
};

export default withTranslation(['builders', 'constants'])(CreateTransform);
