import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { BaseOption } from '../../redux/state/AppState';

import { buildCleaningCode as buildCode } from './codeSnippets';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CaseType,
  CleanerType,
  CleaningConfig,
  CreateColumnType,
  CreateColumnUpdateState,
} from './CreateColumnState';
import { LabeledInput } from './LabeledInput';
import { LabeledSelect } from './LabeledSelect';
import Languages from './nltk-languages.json';

export const validateCleaningCfg = (t: TFunction, cfg: CleaningConfig): string | undefined => {
  const { col, cleaners, stopwords, caseType } = cfg;
  if (!col) {
    return t('Please select a column to clean!') ?? undefined;
  }
  if (!cleaners.length) {
    return t('Please apply function(s)!') ?? undefined;
  }
  if (cleaners.includes(CleanerType.UPDATE_CASE) && !caseType) {
    return t('Please select a case to apply!') ?? undefined;
  }
  if (cleaners.includes(CleanerType.STOPWORDS) && !stopwords) {
    return t('Please enter a comma-separated string of stop words!') ?? undefined;
  }
  return undefined;
};

/** Cleaner option properties */
interface CleanerOption {
  value: CleanerType;
  label: string;
  word_count?: boolean;
}

export const buildCleanerOptions = (t: TFunction): CleanerOption[] => [
  {
    value: CleanerType.DROP_MULTISPACE,
    label: t('Replace Multi-Space w/ Single-Space', { ns: 'builders' }),
  },
  {
    value: CleanerType.DROP_PUNCTUATION,
    label: t('Remove Punctuation', { ns: 'builders' }),
    word_count: true,
  },
  { value: CleanerType.STOPWORDS, label: t('Drop Stop Words', { ns: 'builders' }) },
  {
    value: CleanerType.NLTK_STOPWORDS,
    label: t('Drop NLTK Stop Words', { ns: 'builders' }),
  },
  {
    value: CleanerType.DROP_NUMBERS,
    label: t('Remove Numbers', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.KEEP_ALPHA,
    label: t('Keep Only Alpha', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.NORMALIZE_ACCENTS,
    label: t('Normalize Accent Characters', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.DROP_ALL_SPACE,
    label: t('Remove Spaces', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.DROP_REPEATED_WORDS,
    label: t('Drop Repeated Words', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.ADD_WORD_NUMBER_SPACE,
    label: t('Add Space Between Word and Numbers', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.DROP_REPEATED_CHARS,
    label: t('Remove Repeated Chars', { ns: 'builders' }),
    word_count: true,
  },
  { value: CleanerType.UPDATE_CASE, label: t('Update Word Case', { ns: 'builders' }) },
  {
    value: CleanerType.SPACE_VALS_TO_EMPTY,
    label: t('Update Space Values to Empty String', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.HIDDEN_CHARS,
    label: t('Remove Hidden Characters', { ns: 'builders' }),
    word_count: true,
  },
  {
    value: CleanerType.REPLACE_HYPHEN_W_SPACE,
    label: t('Replace Hyphens w/ Space', { ns: 'builders' }),
    word_count: true,
  },
];

/** Component properties for CreateCleaning */
interface CreateCleaningProps extends BaseCreateComponentProps {
  prePopulated?: CleaningConfig;
}

/** State properties for CreateCleaning */
interface CreateCleaningState {
  col?: BaseOption<string>;
  cleaners: CleanerType[];
  language: BaseOption<string>;
  caseType?: CaseType;
  stopwords?: string;
}

const CreateCleaning: React.FC<CreateCleaningProps & WithTranslation> = ({
  columns,
  namePopulated,
  prePopulated,
  updateState,
  t,
}) => {
  const [state, setState] = React.useState<CreateCleaningState>({
    cleaners: [CleanerType.HIDDEN_CHARS],
    language: { value: 'english' },
  });
  const [description, setDescription] = React.useState<string>();
  const cleanerOptions = React.useMemo(() => buildCleanerOptions(t), [t]);

  React.useEffect(() => {
    if (prePopulated?.col) {
      setState({ ...state, col: { value: prePopulated.col } });
    }
  }, []);

  React.useEffect(() => {
    const cfg: CleaningConfig = {
      col: state.col?.value,
      cleaners: state.cleaners,
    };
    if (state.cleaners.includes(CleanerType.UPDATE_CASE)) {
      cfg.caseType = state.caseType;
    }
    if (state.cleaners.includes(CleanerType.STOPWORDS)) {
      cfg.stopwords = (state.stopwords ?? '').split(',');
    }
    if (state.cleaners.includes(CleanerType.NLTK_STOPWORDS)) {
      cfg.language = state.language.value;
    }
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.CLEANING, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_cleaned`;
    }
    updateState(updatedState);
  }, [state]);

  const updateCleaners = (newCleaner: CleanerType): void => {
    if (state.cleaners.includes(newCleaner)) {
      setState({ ...state, cleaners: state.cleaners.filter((cleaner) => cleaner !== newCleaner) });
    } else {
      setState({ ...state, cleaners: [...state.cleaners, newCleaner] });
    }
  };

  const prePopulatedCol = prePopulated?.col;
  return (
    <React.Fragment>
      {!prePopulatedCol && (
        <ColumnSelect
          label={t('Col')}
          prop="col"
          parent={state}
          updateState={(updatedState) => setState({ ...state, ...updatedState })}
          columns={columns}
          dtypes={['string']}
        />
      )}
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Function(s)')}</label>
        <div className="col-md-8 builders">
          <div className="row">
            {cleanerOptions.map((cleaner, i) => {
              const buttonProps: React.HTMLAttributes<HTMLButtonElement> = {
                className: 'btn w-100',
                style: {
                  padding: '0.45rem 0.3rem',
                  fontSize: '85%',
                  whiteSpace: 'pre-wrap',
                  height: '42px',
                },
                onClick: () => updateCleaners(cleaner.value),
                onMouseEnter: () => setDescription(t(cleaner.value) ?? undefined),
                onMouseLeave: () => setDescription(undefined),
              };
              if (state.cleaners.includes(cleaner.value)) {
                buttonProps.className += ' btn-primary active';
              } else {
                buttonProps.className += ' btn-light inactive pointer';
                buttonProps.style = { ...buttonProps.style, border: 'solid 1px #a7b3b7' };
              }
              return (
                <div key={i} className="col-md-3 p-1">
                  <button {...buttonProps}>{cleaner.label}</button>
                </div>
              );
            })}
          </div>
          <label className="col-auto col-form-label pl-3 pr-3 row" style={{ fontSize: '85%' }}>
            {description}
          </label>
        </div>
      </div>
      {state.cleaners.includes(CleanerType.STOPWORDS) && (
        <LabeledInput
          label={t('Stop Words') ?? ''}
          value={state.stopwords}
          setter={(value) => setState({ ...state, stopwords: value })}
        />
      )}
      {state.cleaners.includes(CleanerType.NLTK_STOPWORDS) && (
        <LabeledSelect
          label={t('NLTK Language')}
          options={Languages.map((l) => ({ value: l }))}
          value={state.language}
          onChange={(selected) => setState({ ...state, language: selected as BaseOption<string> })}
        />
      )}
      {state.cleaners.includes(CleanerType.UPDATE_CASE) && (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Case')}</label>
          <div className="col-md-8">
            <ButtonToggle
              options={[
                { value: CaseType.UPPER, label: t('Upper') },
                { value: CaseType.LOWER, label: t('Lower') },
                { value: CaseType.TITLE, label: t('Title') },
              ]}
              update={(value: CaseType) => setState({ ...state, caseType: value })}
              defaultValue={state.caseType}
              compact={false}
            />
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateCleaning);
