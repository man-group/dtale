import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  EncoderAlgoType,
  EncoderConfig,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';
import { LabeledSelect } from './LabeledSelect';

const buildAlgoOptions = (t: TFunction): Array<BaseOption<EncoderAlgoType>> => [
  { value: EncoderAlgoType.LABEL, label: t('LabelEncoder') },
  { value: EncoderAlgoType.ONE_HOT, label: t('OneHotEncoder') },
  { value: EncoderAlgoType.ORDINAL, label: t('OrdinalEncoder') },
  { value: EncoderAlgoType.FEATURE_HASHER, label: t('FeatureHasher') },
];

export const validateEncoderCfg = (t: TFunction, cfg: EncoderConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  if (cfg.algo === EncoderAlgoType.FEATURE_HASHER && (!cfg.n || parseInt(cfg.n, 10) < 1)) {
    return t('Features must be an integer greater than zero!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: EncoderConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  if (cfg.algo === EncoderAlgoType.FEATURE_HASHER && (!cfg.n || parseInt(cfg.n, 10) < 1)) {
    return undefined;
  }
  if (cfg.algo === EncoderAlgoType.ONE_HOT) {
    return `pd.get_dummies(df, columns=['${cfg.col}'], drop_first=True)`;
  } else if (cfg.algo === 'ordinal') {
    return [
      'from sklearn.preprocessing import OrdinalEncoder',
      `is_nan = df['${cfg.col}'].isnull()`,
      `pd.Series(OrdinalEncoder().fit_transform(df[['${cfg.col}']]).reshape(-1), index=df.index).where(~is_nan, 0)`,
    ];
  } else if (cfg.algo === EncoderAlgoType.LABEL) {
    return [
      'from sklearn.preprocessing import LabelEncoder',
      `is_nan = df['${cfg.col}'].isnull()`,
      `pd.Series(LabelEncoder().fit_transform(df['${cfg.col}']), index=df.index).where(~is_nan, 0)`,
    ];
  } else if (cfg.algo === EncoderAlgoType.FEATURE_HASHER) {
    return [
      'from sklearn.feature_extraction import FeatureHasher',
      `FeatureHasher(n_features=${cfg.n}, input_type='string').transform(data['${cfg.col}'].astype('str'))`,
    ];
  }
  return undefined;
};

const CreateEncoder: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const algos = React.useMemo(() => buildAlgoOptions(t), [t]);
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [algo, setAlgo] = React.useState(algos[0]);
  const [n, setN] = React.useState('1');

  React.useEffect(() => {
    const cfg: EncoderConfig = {
      col: col?.value,
      algo: algo.value,
      n: algo.value === EncoderAlgoType.FEATURE_HASHER ? n : undefined,
    };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.ENCODER, cfg },
      code: buildCode(cfg),
    };
    if (!validateEncoderCfg(t, cfg) && !namePopulated) {
      updatedState.name = `${cfg.col}_${cfg.algo}`;
    }
    updateState(updatedState);
  }, [col, algo, n]);

  return (
    <React.Fragment>
      <LabeledSelect
        label={t('Encoder')}
        options={algos}
        value={algo}
        onChange={(selected) => setAlgo(selected as BaseOption<EncoderAlgoType>)}
        isClearable={false}
      />
      <ColumnSelect
        label={t('Col')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['string', 'int']}
      />
      {algo.value === EncoderAlgoType.FEATURE_HASHER && (
        <LabeledInput type="number" label={t('Features') ?? ''} value={n} setter={setN} />
      )}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateEncoder);
