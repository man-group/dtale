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
  SimilarityAlgoType,
  SimilarityConfig,
} from './CreateColumnState';
import { LabeledCheckbox } from './LabeledCheckbox';
import { LabeledInput } from './LabeledInput';
import { LabeledSelect } from './LabeledSelect';

const buildAlgos = (t: TFunction): Array<BaseOption<SimilarityAlgoType>> => [
  { value: SimilarityAlgoType.LEVENSHTEIN, label: t('Levenshtein') },
  { value: SimilarityAlgoType.DAMERAU_LEVENSHTEIN, label: t('Damerau-Leveneshtein') },
  { value: SimilarityAlgoType.JARO_WINKLER, label: t('Jaro-Winkler') },
  { value: SimilarityAlgoType.JACCARD, label: t('Jaccard Index') },
];

export const validateSimilarityCfg = (t: TFunction, cfg: SimilarityConfig): string | undefined => {
  if (!cfg.left) {
    return t('Please select a left column!') ?? undefined;
  }
  if (!cfg.right) {
    return t('Please select a right column!') ?? undefined;
  }
  if (cfg.algo === SimilarityAlgoType.JACCARD && (!cfg.k || parseInt(cfg.k, 10) < 1)) {
    return t('Please select a valid value for k!') ?? undefined;
  }
  return undefined;
};

const buildNormalizedCode = (code: string[], normalized = false): string[] =>
  normalized
    ? [
        'from dtale.column_builders import SimilarityNormalizeWrapper',
        ...code,
        'similarity = SimilarityNormalizeWrapper(similarity)',
      ]
    : code;

export const buildCode = (cfg: SimilarityConfig): CreateColumnCodeSnippet => {
  if (!cfg.left || !cfg.right) {
    return undefined;
  }
  if (cfg.algo === SimilarityAlgoType.JACCARD && (!cfg.k || parseInt(cfg.k, 10) < 1)) {
    return undefined;
  }
  let code: string[] = [];
  switch (cfg.algo) {
    case SimilarityAlgoType.LEVENSHTEIN: {
      const packageName = cfg.normalized ? 'normalized_levenshtein' : 'levenshtein';
      const className = cfg.normalized ? 'NormalizedLevenshtein' : 'Levenshtein';
      code = code.concat([`from strsimpy.${packageName} import ${className}`, `similarity = ${className}()`]);
      break;
    }
    case SimilarityAlgoType.DAMERAU_LEVENSHTEIN:
      code = code.concat(
        buildNormalizedCode(['from strsimpy.damerau import Damerau', 'similarity = Damerau()'], cfg.normalized),
      );
      break;
    case SimilarityAlgoType.JARO_WINKLER:
      code = code.concat(['from strsimpy.jaro_winkler import JaroWinkler', 'similarity = JaroWinkler()']);
      break;
    case SimilarityAlgoType.JACCARD:
      code = code.concat(
        buildNormalizedCode(['from strsimpy.jaccard import Jaccard', `similarity = Jaccard(${cfg.k})`], cfg.normalized),
      );
      break;
    default:
      break;
  }
  code.push(`df[['${cfg.left}', '${cfg.right}']].fillna('').apply(lambda rec: similarity.distance(*rec), axis=1)`);
  return code;
};

const CreateSimilarity: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const algos = React.useMemo(() => buildAlgos(t), [t]);
  const [left, setLeft] = React.useState<BaseOption<string>>();
  const [right, setRight] = React.useState<BaseOption<string>>();
  const [algo, setAlgo] = React.useState<BaseOption<SimilarityAlgoType>>(algos[0]);
  const [k, setK] = React.useState('3');
  const [normalized, setNormalized] = React.useState(false);

  React.useEffect(() => {
    const cfg: SimilarityConfig = {
      left: left?.value,
      right: right?.value,
      algo: algo.value,
      k: algo.value === SimilarityAlgoType.JACCARD ? k : undefined,
      normalized: algo.value !== SimilarityAlgoType.JARO_WINKLER ? normalized : undefined,
    };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.SIMILARITY, cfg },
      code: buildCode(cfg),
    };
    if (!validateSimilarityCfg(t, cfg) && !namePopulated) {
      updatedState.name = `${cfg.left}_${cfg.right}_distance`;
    }
    updateState(updatedState);
  }, [left, right, algo, k, normalized]);

  return (
    <React.Fragment>
      <LabeledSelect
        label={t('Algorithm')}
        options={algos}
        value={algo}
        onChange={(selected) => setAlgo(selected as BaseOption<SimilarityAlgoType>)}
      />
      <ColumnSelect
        label={t('Left')}
        prop="left"
        otherProps={['right']}
        parent={{ left, right }}
        updateState={(updates: { left?: BaseOption<string> }) => setLeft(updates.left)}
        columns={columns}
        dtypes={['string']}
      />
      <ColumnSelect
        label={t('Right')}
        prop="right"
        otherProps={['left']}
        parent={{ left, right }}
        updateState={(updates: { right?: BaseOption<string> }) => setRight(updates.right)}
        columns={columns}
        dtypes={['string']}
      />
      {algo.value !== SimilarityAlgoType.JARO_WINKLER && (
        <LabeledCheckbox label={t('Normalized')} value={normalized} setter={setNormalized} />
      )}
      {algo.value === SimilarityAlgoType.JACCARD && (
        <LabeledInput type="number" label={t('n-gram')} value={k} setter={setK} />
      )}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateSimilarity);
