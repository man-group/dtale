import * as React from 'react';
import { TFunction, withTranslation, WithTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnUpdateState, ReplaceConfig } from './CreateColumnState';
import { LabeledCheckbox } from './LabeledCheckbox';
import { LabeledInput } from './LabeledInput';

export const validateReplaceCfg = (t: TFunction, cfg: ReplaceConfig): string | undefined => {
  if (!cfg.col) {
    return t('Missing a column selection!');
  }
  if (!cfg.search) {
    return t('You must enter a substring to search for!');
  }
  if (!cfg.replacement) {
    return t('You must enter a replacement!');
  }
  return undefined;
};

export const buildCode = (cfg: ReplaceConfig): CreateColumnCodeSnippet => {
  if (!cfg.col || !cfg.search || !cfg.replacement) {
    return undefined;
  }
  let code = `df['${cfg.col}'].str.replace('${cfg.search}', '${cfg.replacement}'`;
  if (cfg.caseSensitive) {
    code += `, case=True`;
  }
  if (cfg.regex) {
    code += `, regex=True`;
  }
  return code + ')';
};

const CreateReplace: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [search, setSearch] = React.useState('');
  const [replacement, setReplacement] = React.useState('');
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [regex, setRegex] = React.useState(false);

  React.useEffect(() => {
    const cfg: ReplaceConfig = { col: col?.value, search, replacement, caseSensitive, regex };
    const updatedState: CreateColumnUpdateState = { cfg, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_replace`;
    }
    updateState(updatedState);
  }, [col, search, replacement, caseSensitive, regex]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Column')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['string']}
      />
      <LabeledInput label={t('Search For')} value={search} setter={setSearch} />
      <LabeledInput label={t('Replacement')} value={replacement} setter={setReplacement} />
      <LabeledCheckbox label={t('Case Sensitive')} value={caseSensitive} setter={setCaseSensitive} rowClass="mb-0" />
      <LabeledCheckbox label={t('Regex')} value={regex} setter={setRegex} rowClass="mb-0" />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateReplace);
