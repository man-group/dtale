import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import { LabeledInput } from '../create/LabeledInput';

import { BaseReplacementComponentProps, ReplacementType, StringsConfig } from './CreateReplacementState';

export const validateStringsCfg = (t: TFunction, cfg: StringsConfig): string | undefined => {
  const { value, replace } = cfg;
  if (!value) {
    return t('Please enter a character or substring!') ?? undefined;
  }
  if (!replace) {
    return t('Please enter a replacement value!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (col: string, colType: string, cfg: StringsConfig): CreateColumnCodeSnippet => {
  const { value, isChar, ignoreCase, replace } = cfg;
  if (!value || !replace) {
    return undefined;
  }
  let flags = 're.UNICODE';
  if (ignoreCase) {
    flags += ' | re.IGNORECASE';
  }
  let valStr = `' + re.escape('${value}') + '`;
  if (isChar) {
    valStr = `[${valStr}]+`;
  }

  let replaceVal = replace;
  if (replaceVal.toLowerCase() === 'nan') {
    replaceVal = 'np.nan';
  } else if (colType === 'string') {
    replaceVal = `'${replaceVal}'`;
  }

  return [
    'import re',
    '',
    `regex_pat = re.compile(r'^.*${valStr}.*$', flags=${flags})`,
    `df.loc[:, '${col}'] = df['${col}'].replace(regex_pat, ${replaceVal}, regex=True)`,
  ];
};

const Strings: React.FC<BaseReplacementComponentProps & WithTranslation> = ({
  columns,
  col,
  colType,
  updateState,
  t,
}) => {
  const [value, setValue] = React.useState<string>();
  const [isChar, setIsChar] = React.useState(false);
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [replace, setReplace] = React.useState<string>();

  React.useEffect(() => {
    const cfg: StringsConfig = { value, isChar, ignoreCase, replace };
    updateState({
      cfg: { type: ReplacementType.STRINGS, cfg },
      code: buildCode(col, colType, cfg),
    });
  }, [value, isChar, ignoreCase, replace]);

  return (
    <React.Fragment>
      <LabeledInput rowClass="mb-0" label={t('Search For')} value={value} setter={setValue} />
      <LabeledCheckbox rowClass="mb-0" label={t('Is Character?')} value={isChar} setter={setIsChar} />
      <LabeledCheckbox rowClass="mb-0" label={t('Ignore case?')} value={ignoreCase} setter={setIgnoreCase} />
      <LabeledInput label={t('Replace With')} value={replace} setter={setReplace} subLabel={t('replace_missings')} />
    </React.Fragment>
  );
};

export default withTranslation('replacement')(Strings);
