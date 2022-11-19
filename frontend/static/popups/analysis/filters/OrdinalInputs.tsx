import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { ColumnDef } from '../../../dtale/DataViewerState';
import * as gu from '../../../dtale/gridUtils';
import { BaseOption } from '../../../redux/state/AppState';
import { buildCleanerOptions } from '../../create/CreateCleaning';
import { AnalysisType } from '../ColumnAnalysisState';

import { analysisAggs, sortOptions } from './Constants';
import FilterSelect from './FilterSelect';

const cleanerOpts = (t: TFunction): Array<BaseOption<string>> => [
  {
    value: 'underscore_to_space',
    label: t('Replace underscores w/ space', { ns: 'analysis' }),
  },
  ...buildCleanerOptions(t).filter((option) => option.word_count),
];

/** Component properties for OrdinalInputs */
export interface OrdinalInputsProps {
  type?: AnalysisType;
  colType: gu.ColumnType;
  cols: ColumnDef[];
  selectedCol: string;
  setOrdinalCol: (value?: BaseOption<string>) => void;
  setOrdinalAgg: (value: BaseOption<string>) => void;
  setCleaners: (value: Array<BaseOption<string>>) => void;
}

const OrdinalInputs: React.FC<OrdinalInputsProps & WithTranslation> = ({
  type,
  cols,
  selectedCol,
  colType,
  t,
  ...props
}) => {
  const colOptions: Array<BaseOption<string>> = React.useMemo(
    () =>
      cols
        .filter(
          (c) => c.name !== selectedCol && [gu.ColumnType.FLOAT, gu.ColumnType.INT].includes(gu.findColType(c.dtype)),
        )
        .map((c) => ({ value: c.name }))
        .sort(sortOptions),
    [cols, selectedCol],
  );
  const { cleanerOptions, hiddenChars, analysisAggOptions } = React.useMemo(() => {
    const tmpCleanerptions = cleanerOpts(t);
    return {
      cleanerOptions: tmpCleanerptions,
      hiddenChars: tmpCleanerptions.find((option) => option.value === 'hidden_chars')!,
      analysisAggOptions: analysisAggs(t),
    };
  }, [t]);
  const [ordinalCol, setOrdinalCol] = React.useState<BaseOption<string>>();
  const [ordinalAgg, setOrdinalAgg] = React.useState<BaseOption<string>>(
    analysisAggOptions.find((option) => option.value === 'sum')!,
  );
  const [cleaners, setCleaners] = React.useState<Array<BaseOption<string>>>(
    type && [AnalysisType.WORD_VALUE_COUNTS, AnalysisType.VALUE_COUNTS].includes(type) ? [{ ...hiddenChars }] : [],
  );

  const renderCleaners = (): React.ReactNode => {
    if (
      type &&
      [AnalysisType.WORD_VALUE_COUNTS, AnalysisType.VALUE_COUNTS].includes(type) &&
      colType === gu.ColumnType.STRING
    ) {
      return (
        <div className="row pt-3" data-tip={t('Clean column of extraneous values')}>
          <div className="col-auto text-center pr-4 ml-auto mt-auto mb-auto">
            <b>{t('Cleaner')}</b>
          </div>
          <div className="col pl-0 mr-3 ordinal-dd cleaner-dd">
            <FilterSelect<string>
              value={cleaners}
              options={cleanerOptions}
              onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) => {
                setCleaners(v as Array<BaseOption<string>>);
                props.setCleaners((v as Array<BaseOption<string>>) ?? []);
              }}
              isClearable={true}
              isMulti={true}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col">
      <div className="row">
        <div className="col-auto text-center pr-4">
          <div>
            <b>{t('Ordinal')}</b>
          </div>
          <div style={{ marginTop: '-.5em' }}>
            <small>({t('Choose Col/Agg')})</small>
          </div>
        </div>
        <div data-testid="ordinal-col" className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect<string>
            value={ordinalCol}
            options={colOptions}
            onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) => {
              setOrdinalCol(v as BaseOption<string>);
              props.setOrdinalCol((v as BaseOption<string>) ?? undefined);
            }}
            noOptionsMessage={() => t('analysis:No columns found')}
            isClearable={true}
          />
        </div>
        <div data-testid="ordinal-agg" className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect<string>
            value={ordinalAgg}
            options={analysisAggOptions}
            onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) => {
              setOrdinalAgg(v as BaseOption<string>);
              props.setOrdinalAgg((v as BaseOption<string>) ?? undefined);
            }}
          />
        </div>
      </div>
      {renderCleaners()}
    </div>
  );
};

export default withTranslation(['analysis', 'builders', 'constants'])(OrdinalInputs);
