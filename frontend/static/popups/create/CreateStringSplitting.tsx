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
  StringSplittingConfig,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

export const validateStringSplittingCfg = (t: TFunction, cfg: StringSplittingConfig): string | undefined => {
  if (!cfg.col) {
    return t('Missing a column selection!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: StringSplittingConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  return `df['${cfg.col}'].str.split('${cfg.delimiter}', expand=True)`;
};

const CreateStringSplitting: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [delimiter, setDelimiter] = React.useState('');

  React.useEffect(() => {
    const cfg: StringSplittingConfig = { col: col?.value, delimiter };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.SPLIT, cfg }, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_split`;
    }
    updateState(updatedState);
  }, [col, delimiter]);

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
      <LabeledInput label={t('Delimiter')} value={delimiter} setter={setDelimiter} />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateStringSplitting);
