import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledInput } from '../create/LabeledInput';

import { BaseReplacementComponentProps, ImputerConfig, ImputerType, ReplacementType } from './CreateReplacementState';

export const buildCode = (col: string, cfg: ImputerConfig): CreateColumnCodeSnippet => {
  const { type } = cfg;
  const code = [];
  if (type === ImputerType.ITERATIVE) {
    code.push('from sklearn.experimental import enable_iterative_imputer');
    code.push('from sklearn.impute import IterativeImputer');
    code.push('');
    code.push(`output = IterativeImputer().fit_transform(df[['${col}']])`);
  } else if (type === ImputerType.KNN) {
    code.push('from sklearn.impute import KNNImputer');
    code.push('');
    code.push(`output = KNNImputer(n_neighbors=${cfg.nNeighbors ?? 2}).fit_transform(df[['${col}']])`);
  } else if (type === ImputerType.SIMPLE) {
    code.push('from sklearn.impute import SimpleImputer');
    code.push('');
    code.push(`output = SimpleImputer().fit_transform(df[['${col}']])`);
  }
  code.push(`df.loc[:, '${col}'] = pd.DataFrame(output, columns=['${col}'], index=df.index)['${col}']`);
  return code;
};

const Imputer: React.FC<BaseReplacementComponentProps & WithTranslation> = ({
  columns,
  col,
  colType,
  updateState,
  t,
}) => {
  const [type, setType] = React.useState<ImputerType>(ImputerType.ITERATIVE);
  const [nNeighbors, setNNeighbors] = React.useState<number>(2);
  const typeOpts = React.useMemo(
    () => [
      { value: ImputerType.ITERATIVE, label: t('Iterative') },
      { value: ImputerType.KNN, label: t('KNN') },
      { value: ImputerType.SIMPLE, label: t('Simple') },
    ],
    [t],
  );

  React.useEffect(() => {
    const cfg: ImputerConfig = type === ImputerType.KNN ? { type, nNeighbors: nNeighbors ?? 2 } : { type };
    updateState({ cfg: { type: ReplacementType.IMPUTER, cfg }, code: buildCode(col, cfg) });
  }, [type, nNeighbors]);

  return (
    <React.Fragment>
      <div className="form-group row" data-testid="imputer-type">
        <label className="col-md-3 col-form-label text-right">{t('Type')}</label>
        <div className="col-md-8">
          <ButtonToggle options={typeOpts} update={setType} defaultValue={type} compact={false} />
        </div>
      </div>
      {type === ImputerType.KNN && (
        <LabeledInput
          label={t('Neighbors')}
          type="number"
          value={nNeighbors}
          setter={(val) => setNNeighbors(Number(val))}
          subLabel={`${t('Default')}: 2`}
        />
      )}
    </React.Fragment>
  );
};

export default withTranslation('replacement')(Imputer);
