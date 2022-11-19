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
  StandardizedAlgoType,
  StandardizedConfig,
} from './CreateColumnState';
import { LabeledSelect } from './LabeledSelect';

const buildAlgos = (t: TFunction): Array<BaseOption<StandardizedAlgoType>> => [
  { value: StandardizedAlgoType.POWER, label: t('PowerTransformer') },
  { value: StandardizedAlgoType.QUANTILE, label: t('QuantileTransformer') },
  { value: StandardizedAlgoType.ROBUST, label: t('RobustScalar') },
];

export const validateStandardizedCfg = (t: TFunction, cfg: StandardizedConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: StandardizedConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  let code: string[] = [];
  switch (cfg.algo) {
    case StandardizedAlgoType.ROBUST:
      code = code.concat(['from sklearn.preprocessing import Robustscalar', 'transformer = Robustscalar()']);
      break;
    case StandardizedAlgoType.QUANTILE:
      code = code.concat([
        'from sklearn.preprocessing import QuantileTransformer',
        'transformer = QuantileTransformer()',
      ]);
      break;
    case StandardizedAlgoType.POWER:
      code = code.concat([
        'from sklearn.preprocessing import PowerTransformer',
        "transformer = PowerTransformer(method='yeo-johnson', standardize=True)",
      ]);
      break;
    default:
      break;
  }

  code.push(`transformer.fit_transform(df[['${cfg.col}']]).reshape(-1)`);
  return code;
};

const CreateStandardized: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const algos = React.useMemo(() => buildAlgos(t), [t]);
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [algo, setAlgo] = React.useState(algos[0]);

  React.useEffect(() => {
    const cfg: StandardizedConfig = { col: col?.value, algo: algo.value };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.STANDARDIZE, cfg },
      code: buildCode(cfg),
    };
    if (!validateStandardizedCfg(t, cfg) && !namePopulated) {
      updatedState.name = `${cfg.col}_${cfg.algo}`;
    }
    updateState(updatedState);
  }, [col, algo]);

  return (
    <React.Fragment>
      <LabeledSelect
        label={t('Algorithm')}
        options={algos}
        value={algo}
        onChange={(selected) => setAlgo(selected as BaseOption<StandardizedAlgoType>)}
      />
      <ColumnSelect
        label={t('Column')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateStandardized);
