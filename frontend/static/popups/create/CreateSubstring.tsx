import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  SubstringConfig,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

const parseRange = (cfg: SubstringConfig): { start: number; end: number } => ({
  start: parseInt(cfg.start, 10),
  end: parseInt(cfg.end, 10),
});

export const validateSubstringCfg = (t: TFunction, cfg: SubstringConfig): string | undefined => {
  if (!cfg.col) {
    return t('Missing a column selection!') ?? undefined;
  }
  const { start, end } = parseRange(cfg);
  if (isNaN(start) || isNaN(end) || start === end || start > end) {
    return t('Invalid range specification, start must be less than end!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: SubstringConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  const { start, end } = parseRange(cfg);
  if (isNaN(start) || isNaN(end) || start === end || start > end) {
    return undefined;
  }
  if (start === 0) {
    return `df['${cfg.col}'].str[:${end}]`;
  }
  return `df['${cfg.col}'].str.slice(${start}, ${end})`;
};

const CreateSubstring: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [start, setStart] = React.useState('0');
  const [end, setEnd] = React.useState('0');

  React.useEffect(() => {
    const cfg: SubstringConfig = { col: col?.value, start, end };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.SUBSTRING, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_substring`;
    }
    updateState(updatedState);
  }, [col, start, end]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={`${t('Column')}*`}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['string']}
      />
      <LabeledInput type="number" label={t('Start')} value={start} setter={setStart} />
      <LabeledInput type="number" label={t('End')} value={end} setter={setEnd} />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateSubstring);
