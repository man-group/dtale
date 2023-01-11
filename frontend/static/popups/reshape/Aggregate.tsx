import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { default as Select } from 'react-select';

import ButtonToggle from '../../ButtonToggle';
import { default as ColumnSelect, constructColumnOptionsFilteredByOtherValues } from '../../popups/create/ColumnSelect';
import { AppState, BaseOption } from '../../redux/state/AppState';
import { pivotAggs } from '../analysis/filters/Constants';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { Checkbox } from '../create/LabeledCheckbox';
import { DtaleSelect } from '../create/LabeledSelect';

import { AggregationOperationType, BaseReshapeComponentProps, ReshapeAggregateConfig } from './ReshapeState';

export const validateAggregateCfg = (cfg: ReshapeAggregateConfig): string | undefined => {
  if (cfg.agg.type === AggregationOperationType.FUNC && !cfg.agg.func) {
    return 'Missing an aggregation selection!';
  } else if (
    cfg.agg.type === AggregationOperationType.COL &&
    (!Object.keys(cfg.agg.cols).length ||
      Object.values(cfg.agg.cols || {}).find((aggs: string[]) => !aggs.length) !== undefined)
  ) {
    return 'Missing an aggregation selection!';
  }
  return undefined;
};

export const buildCode = (cfg: ReshapeAggregateConfig): CreateColumnCodeSnippet => {
  const dropna = cfg.dropna ? 'True' : 'False';
  let dfStr = cfg.index?.length ? `df.groupby(['${cfg.index.join("', '")}'], dropna=${dropna})` : 'df';
  const code = [];
  if (cfg.agg.type === AggregationOperationType.FUNC) {
    if (!cfg.agg.func) {
      return undefined;
    }
    const isGmean = cfg.agg.func === 'gmean';
    if (isGmean) {
      code.push('from scipy.stats import gmean');
    }
    if (cfg.agg.cols?.length) {
      dfStr = `${dfStr}['${cfg.agg.cols.join("', '")}']`;
    }
    code.push(isGmean ? `${dfStr}.apply(gmean)` : `${dfStr}.${cfg.agg.func}()`);
  } else if (cfg.agg.type === AggregationOperationType.COL) {
    if (!Object.keys(cfg.agg.cols ?? {}).length) {
      return undefined;
    }
    let aggStr = `${dfStr}.aggregate({`;
    const aggFmt = (agg: string): string => (agg === 'gmean' ? 'gmean' : `'${agg}'`);
    const { cols } = cfg.agg;
    aggStr += Object.keys(cols)
      .map((col: string) => `'${col}': ['${(cols[col] ?? []).map(aggFmt).join("', '")}']`)
      .join(', ');
    aggStr += '})';
    code.push(aggStr);
  }
  if (!cfg.index) {
    code[code.length - 1] = `${code[code.length - 1]}.to_frame().T`;
  }
  return code;
};

const Aggregate: React.FC<BaseReshapeComponentProps & WithTranslation> = ({ columns, updateState, t }) => {
  const pythonVersion = useSelector((state: AppState) => state.pythonVersion);
  const aggregateAggs = React.useMemo(
    () => [...pivotAggs(t), { value: 'gmean', label: t('Geometric Mean', { ns: 'constants' }) }],
    [t],
  );
  const [index, setIndex] = React.useState<Array<BaseOption<string>>>();
  const [dropna, setDropna] = React.useState(true);
  const [type, setType] = React.useState<AggregationOperationType>(AggregationOperationType.COL);
  const [columnConfig, setColumnConfig] = React.useState<Record<string, string[]>>({});
  const [func, setFunc] = React.useState<BaseOption<string>>();
  const [funcCols, setFuncCols] = React.useState<Array<BaseOption<string>>>();

  const currentAggRef = React.useRef<Select>(null);
  const currentColRef = React.useRef<Select>(null);

  React.useEffect(() => {
    let cfg: ReshapeAggregateConfig;
    switch (type) {
      case AggregationOperationType.COL:
        cfg = {
          agg: {
            type: AggregationOperationType.COL,
            cols: Object.keys(columnConfig).reduce(
              (res, key) => (columnConfig[key].length ? { ...res, [key]: columnConfig[key] } : res),
              {},
            ),
          },
          dropna,
        };
        break;
      case AggregationOperationType.FUNC:
      default:
        cfg = {
          agg: { type: AggregationOperationType.FUNC, func: func?.value, cols: funcCols?.map(({ value }) => value) },
          dropna,
        };
        break;
    }
    cfg = { ...cfg, index: index?.map(({ value }) => value) };
    updateState({ cfg, code: buildCode(cfg) });
  }, [index, dropna, type, columnConfig, func, funcCols]);

  const filteredColumnOptions = React.useMemo(
    () => constructColumnOptionsFilteredByOtherValues(columns, [index]),
    [columns, index],
  );

  const addAgg = (): void => {
    const currCol: string = (currentColRef.current as any)?.state?.selectValue?.[0]?.value;
    const currAgg: Array<BaseOption<string>> = (currentAggRef.current as any)?.state?.selectValue;
    if (!currCol || !currAgg) {
      return;
    }
    (currentAggRef.current as any)?.clearValue();
    setColumnConfig({ ...columnConfig, [currCol]: currAgg.map(({ value }) => value) });
  };

  const removeAgg =
    (col: string): (() => void) =>
    (): void => {
      const updatedColumnConfig = { ...columnConfig };
      delete updatedColumnConfig[col];
      setColumnConfig(updatedColumnConfig);
    };

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Column(s) to GroupBy')}
        prop="index"
        parent={{ index }}
        updateState={(updatedState) => setIndex(updatedState.index as Array<BaseOption<string>>)}
        isMulti={true}
        columns={columns}
      >
        {(pythonVersion?.[0] ?? 0) >= 3 && !!index?.length && (
          <div className="row mb-0">
            <label className="col-auto col-form-label pr-3" style={{ fontSize: '85%' }}>
              {`${t('dropna')}?`}
            </label>
            <div className="col-auto p-0">
              <Checkbox value={dropna} setter={setDropna} />
            </div>
          </div>
        )}
      </ColumnSelect>
      <div className="form-group row">
        <div className="col-md-3 text-right mb-auto mt-3">
          <ButtonToggle
            options={[
              { value: AggregationOperationType.COL, label: 'By Column' },
              { value: AggregationOperationType.FUNC, label: 'By Function' },
            ]}
            update={setType}
            defaultValue={type}
            compact={false}
            className="agg-types"
          />
        </div>
        <div className="col-md-8">
          {type === AggregationOperationType.COL && (
            <React.Fragment>
              <div className="row pb-4">
                <div className="col-md-5 pr-2">
                  <div className="input-group mr-3 col-agg-col-input">
                    <span className="pt-4 mr-4">{t('Col')}:</span>
                    <DtaleSelect
                      options={filteredColumnOptions}
                      isMulti={false}
                      isClearable={true}
                      ref={currentColRef}
                    />
                  </div>
                </div>
                <div className="col-md-7 pl-0">
                  <div className="input-group">
                    <span className="pt-4 mr-4">{t('Agg')}:</span>
                    <DtaleSelect options={aggregateAggs} isClearable={true} isMulti={true} ref={currentAggRef} />
                    <i className="ico-add-circle pointer mt-auto mb-auto ml-4" onClick={addAgg} />
                  </div>
                </div>
              </div>
              {Object.keys(columnConfig).map((col) => (
                <div key={`saved-agg-${col}`} className="row">
                  <div className="col-auto pr-2">
                    <div className="input-group mr-3 col-agg-col-input">
                      <span className="mt-auto mb-auto mr-4">{t('Col')}:</span>
                      <span className="font-weight-bold" style={{ minWidth: '10em' }}>
                        {col}
                      </span>
                    </div>
                  </div>
                  <div className="col pl-0">
                    <div className="input-group">
                      <span className="mt-auto mb-auto mr-4">{t('Func')}:</span>
                      <span className="font-weight-bold w-100">{columnConfig[col].join(', ')}</span>
                      <i className="ico-remove-circle pointer mt-auto mb-auto ml-4" onClick={removeAgg(col)} />
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )}
          {type === AggregationOperationType.FUNC && (
            <div className="row pb-4">
              <div className="col-auto pr-2">
                <div className="input-group mr-3 col-agg-col-input">
                  <span className="mt-auto mb-auto mr-4">{t('Func')}:</span>
                  <DtaleSelect
                    options={aggregateAggs}
                    value={func}
                    onChange={(selected) => setFunc(selected as BaseOption<string>)}
                    isClearable={true}
                  />
                </div>
              </div>
              <div className="col pl-0">
                <div className="input-group">
                  <span className="mt-auto mb-auto mr-4">{t('Cols:')}</span>
                  <DtaleSelect
                    options={filteredColumnOptions}
                    value={funcCols}
                    onChange={(selected) => setFuncCols(selected as Array<BaseOption<string>>)}
                    isMulti={true}
                    isClearable={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('reshape')(Aggregate);
