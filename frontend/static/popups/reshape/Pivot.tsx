import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { pivotAggs as buildPivotAggs } from '../analysis/filters/Constants';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import ColumnSelect from '../create/ColumnSelect';
import { Checkbox } from '../create/LabeledCheckbox';
import { LabeledSelect } from '../create/LabeledSelect';

import { BaseReshapeComponentProps, ReshapePivotConfig } from './ReshapeState';

export const validatePivotCfg = (cfg: ReshapePivotConfig): string | undefined => {
  if (!cfg.index?.length) {
    return 'Missing an index selection!';
  }
  if (!cfg.columns?.length) {
    return 'Missing a columns selection!';
  }
  if (!cfg.values?.length) {
    return 'Missing a value(s) selection!';
  }
  return undefined;
};

export const buildCode = (cfg: ReshapePivotConfig): CreateColumnCodeSnippet => {
  if (!cfg.index?.length || !cfg.columns?.length || !cfg.values?.length) {
    return undefined;
  }
  let code = 'pd.pivot_table(df, ';
  const buildStr = (vals: string[]): string => `['${vals.join("', '")}']`;
  code += `index=${buildStr(cfg.index)}, columns=${buildStr(cfg.columns)}, values=${buildStr(cfg.values)}`;
  if (cfg.aggfunc) {
    code += `, aggfunc='${cfg.aggfunc}'`;
  }
  code += ')';
  return code;
};

const Pivot: React.FC<BaseReshapeComponentProps & WithTranslation> = ({ updateState, t, ...props }) => {
  const pivotAggs = React.useMemo(() => buildPivotAggs(t), [t]);
  const [index, setIndex] = React.useState<Array<BaseOption<string>>>();
  const [columns, setColumns] = React.useState<Array<BaseOption<string>>>();
  const [values, setValues] = React.useState<Array<BaseOption<string>>>();
  const [func, setFunc] = React.useState<BaseOption<string>>();
  const [columnNameHeaders, setColumnNameHeaders] = React.useState(false);

  React.useEffect(() => {
    const cfg: ReshapePivotConfig = {
      index: index?.map(({ value }) => value),
      columns: columns?.map(({ value }) => value),
      values: values?.map(({ value }) => value),
      aggfunc: func?.value,
      columnNameHeaders,
    };
    updateState({ cfg, code: buildCode(cfg) });
  }, [index, columns, values, func, columnNameHeaders]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Rows')}
        prop="index"
        otherProps={['columns', 'values']}
        parent={{ index, columns, values }}
        updateState={(updatedState) => setIndex(updatedState.index as Array<BaseOption<string>>)}
        columns={props.columns}
        isMulti={true}
      />
      <ColumnSelect
        label={t('Columns')}
        prop="columns"
        otherProps={['index', 'values']}
        parent={{ index, columns, values }}
        updateState={(updatedState) => setColumns(updatedState.columns as Array<BaseOption<string>>)}
        columns={props.columns}
        isMulti={true}
      >
        <div className="row mb-0">
          <label className="col-auto col-form-label pr-3" style={{ fontSize: '85%' }}>
            {t('Include Column Names in Headers?')}
          </label>
          <div className="col-auto p-0">
            <Checkbox value={columnNameHeaders} setter={setColumnNameHeaders} />
          </div>
        </div>
      </ColumnSelect>
      <ColumnSelect
        label={t('Value(s)')}
        prop="values"
        otherProps={['index', 'columns']}
        parent={{ index, columns, values }}
        updateState={(updatedState) => setValues(updatedState.values as Array<BaseOption<string>>)}
        columns={props.columns}
        isMulti={true}
      />
      <LabeledSelect
        label={t('Aggregation')}
        options={pivotAggs}
        value={func}
        onChange={(selected) => setFunc(selected as BaseOption<string>)}
      />
    </React.Fragment>
  );
};

export default withTranslation('reshape')(Pivot);
