import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { ColumnDef } from '../../../dtale/DataViewerState';
import * as gu from '../../../dtale/gridUtils';
import { BaseOption } from '../../../redux/state/AppState';

import { analysisAggs, sortOptions } from './Constants';
import FilterSelect from './FilterSelect';

/** Component properties for CategoryInputs */
export interface CategoryInputsProps {
  selectedCol: string;
  cols: ColumnDef[];
  setCategoryCol: (value?: BaseOption<string>) => void;
  setCategoryAgg: (value: BaseOption<string>) => void;
}

const CategoryInputs: React.FC<CategoryInputsProps & WithTranslation> = ({ selectedCol, cols, t, ...props }) => {
  const colOpts: Array<BaseOption<string>> = React.useMemo(
    () =>
      cols
        .filter((c) => c.name !== selectedCol && gu.findColType(c.dtype) !== gu.ColumnType.FLOAT)
        .map((c) => ({ value: c.name }))
        .sort(sortOptions),
    [cols, selectedCol],
  );
  const analysisAggOptions = React.useMemo(() => analysisAggs(t).filter((option) => option.value !== 'count'), [t]);

  const [categoryCol, setCategoryCol] = React.useState<BaseOption<string>>(colOpts[0]);
  const [categoryAgg, setCategoryAgg] = React.useState<BaseOption<string>>(
    analysisAggOptions.find((option) => option.value === 'mean')!,
  );

  React.useEffect(() => {
    if (categoryCol) {
      props.setCategoryCol(categoryCol ?? undefined);
    }
  }, []);

  return (
    <React.Fragment>
      <div className="col-auto text-center pr-4">
        <div>
          <b>{t('Category Breakdown', { ns: 'analysis' })}</b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{`(${t('Choose Col/Agg', { ns: 'analysis' })})`}</small>
        </div>
      </div>
      <div data-testid="category-col" className="col-auto pl-0 mr-3 ordinal-dd">
        <FilterSelect<string>
          value={categoryCol}
          options={colOpts}
          onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) => {
            setCategoryCol(v as BaseOption<string>);
            props.setCategoryCol((v as BaseOption<string>) ?? undefined);
          }}
          noOptionsMessage={() => t('No columns found')}
          isClearable={true}
        />
      </div>
      <div data-testid="category-agg" className="col-auto pl-0 mr-3 ordinal-dd">
        <FilterSelect<string>
          value={categoryAgg}
          options={analysisAggOptions}
          onChange={(v?: BaseOption<string> | Array<BaseOption<string>>) => {
            setCategoryAgg(v as BaseOption<string>);
            props.setCategoryAgg((v as BaseOption<string>) ?? undefined);
          }}
        />
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['analysis', 'constants'])(CategoryInputs);
