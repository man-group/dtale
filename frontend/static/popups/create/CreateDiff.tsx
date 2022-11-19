import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnType, CreateColumnUpdateState, DiffConfig } from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

export const validateDiffCfg = (t: TFunction, cfg: DiffConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  if (!cfg.periods || !parseInt(cfg.periods, 10)) {
    return t('Please select a valid value for periods!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: DiffConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  if (!cfg.periods || !parseInt(cfg.periods, 10)) {
    return undefined;
  }

  return `df['${cfg.col}'].diff(${cfg.periods})`;
};

const CreateDiff: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [periods, setPeriods] = React.useState('1');

  React.useEffect(() => {
    const cfg: DiffConfig = { col: col?.value, periods };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.DIFF, cfg }, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_diff`;
    }
    updateState(updatedState);
  }, [col, periods]);

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
      <LabeledInput label={t('Periods') ?? ''} value={periods} setter={setPeriods} />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateDiff);
