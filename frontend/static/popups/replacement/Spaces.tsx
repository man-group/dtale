import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledInput } from '../create/LabeledInput';

import { BaseReplacementComponentProps, ReplacementType, SpacesConfig } from './CreateReplacementState';

export const buildCode = (col: string, cfg: SpacesConfig): CreateColumnCodeSnippet => {
  let replaceVal = cfg.replace;
  if (replaceVal.toLowerCase() === 'nan') {
    replaceVal = 'np.nan';
  } else {
    replaceVal = `'${replaceVal}'`;
  }
  return `df.loc[:, '${col}'] = df['${col}'].replace(r'^\\\\s+$', ${replaceVal}, regex=True)`;
};

const Spaces: React.FC<BaseReplacementComponentProps & WithTranslation> = ({ col, updateState, t }) => {
  const [replace, setReplace] = React.useState('nan');

  React.useEffect(() => {
    // this is because when we initialize "Spaces" we already have enough state for a cfg
    updateState({ cfg: { type: ReplacementType.SPACES, cfg: { replace } } });
  }, []);

  React.useEffect(() => {
    const cfg: SpacesConfig = { replace };
    updateState({ cfg: { type: ReplacementType.SPACES, cfg }, code: buildCode(col, cfg) });
  }, [replace]);

  return (
    <LabeledInput label={t('Replace With')} value={replace} setter={setReplace} subLabel={t('replace_missings')} />
  );
};

export default withTranslation('replacement')(Spaces);
