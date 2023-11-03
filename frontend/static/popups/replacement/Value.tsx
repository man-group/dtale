import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import { capitalize } from '../../stringUtils';
import { pivotAggs as buildPivotAggs } from '../analysis/filters/Constants';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { ColumnSelectInput } from '../create/ColumnSelect';
import { DtaleSelect } from '../create/LabeledSelect';

import { BaseReplacementComponentProps, ReplacementType, ValueConfig, ValueConfigType } from './CreateReplacementState';

export const validateValueCfg = (t: TFunction, cfgs: ValueConfig[]): string | undefined =>
  !cfgs.length ? t('Please add (+) a replacement!') ?? undefined : undefined;

export const validateCfg = (
  t: TFunction,
  cfgs: ValueConfig[],
  type: ValueConfigType,
  value?: any,
  replace?: any,
): string | undefined => {
  if (!value) {
    return t('Please select a value to search for!') ?? undefined;
  }
  if (!replace && type !== ValueConfigType.RAW) {
    if (type === ValueConfigType.COL) {
      return t('Please select a column!') ?? undefined;
    }
    return t('Please select an aggregation!') ?? undefined;
  }
  if (type === ValueConfigType.RAW && cfgs.find((cfg) => cfg.type === ValueConfigType.RAW && cfg.value === value)) {
    return `${t('A replacement for')} ${value} ${t('already exists, please remove it before adding this one!')}`;
  }
  return undefined;
};

const valConverter = (val: string | number, colType: string, quote = "'"): string => {
  if (`${val}`.toLowerCase() === 'nan') {
    return 'np.nan';
  } else if (colType === 'string') {
    return `${quote}${val}${quote}`;
  }
  return `${val}`;
};

export const buildCode = (col: string, colType: string, cfgs: ValueConfig[]): CreateColumnCodeSnippet => {
  let code = [`s = df['${col}']`];
  const replacements: string[] = [];
  const colReplacements: string[] = [];
  cfgs.forEach(({ type, value, replace }) => {
    if (!value) {
      return;
    }
    const valStr = valConverter(value, colType);
    if (type === ValueConfigType.AGG) {
      replacements.push(`\t${valStr}: getattr(df['${col}'], '${replace}')(),`);
    } else if (type === ValueConfigType.RAW) {
      replacements.push(`\t${valStr}: ${valConverter(replace, colType)},`);
    } else {
      colReplacements.push(`s = np.where(s == ${valStr}, data['${replace}'], s)`);
    }
  });
  if (replacements.length) {
    code.push('s = s.replace({');
    code = [...code, ...replacements];
    code.push('})');
  }
  if (colReplacements.length) {
    code = [...code, ...colReplacements];
  }
  if (code.length === 1) {
    return undefined;
  }
  return code;
};

const Value: React.FC<BaseReplacementComponentProps & WithTranslation> = ({
  columns,
  colType,
  updateState,
  t,
  ...props
}) => {
  const aggs = React.useMemo(() => buildPivotAggs(t), [t]);
  const [value, setValue] = React.useState('nan');
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [raw, setRaw] = React.useState<string>();
  const [agg, setAgg] = React.useState<BaseOption<string>>();
  const [type, setType] = React.useState<ValueConfigType>(ValueConfigType.RAW);
  const [cfgs, setCfgs] = React.useState<ValueConfig[]>([]);

  const addCfg = (): void => {
    let replace: any;
    let finalVal: string | number = value;
    if (finalVal !== 'nan' && colType === 'float') {
      finalVal = parseFloat(finalVal);
    } else if (finalVal !== 'nan' && colType === 'int') {
      finalVal = parseInt(finalVal, 10);
    }
    if (type === ValueConfigType.COL) {
      replace = col?.value;
    } else if (type === ValueConfigType.RAW) {
      replace =
        raw === 'nan'
          ? raw
          : colType === 'float'
          ? raw
            ? parseFloat(raw)
            : 'nan'
          : colType === 'int'
          ? raw
            ? parseInt(raw, 10)
            : 'nan'
          : raw ?? '';
    } else {
      replace = agg?.value;
    }
    const newCfg = { type, value: finalVal, replace };
    const error = validateCfg(t, cfgs, type, finalVal, replace);
    if (error) {
      updateState({ error: <RemovableError error={error} /> });
      return;
    }
    const currCfgs = [...cfgs, newCfg];
    const code = buildCode(props.col, colType, currCfgs);
    setCfgs(currCfgs);
    setValue('nan');
    setCol(undefined);
    setRaw(undefined);
    setAgg(undefined);
    setType(ValueConfigType.RAW);
    updateState({ error: undefined, cfg: { type: ReplacementType.VALUE, cfg: currCfgs }, code });
  };

  const removeCfg = (idx: number): void => setCfgs([...cfgs.filter((_cfg, i) => i !== idx)]);

  const addBtn = <i className="ico-add-circle pointer mt-auto mb-auto ml-4" onClick={addCfg} />;
  return (
    <React.Fragment>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Search For', { ns: 'replacement' })}</label>
        <div className="col-md-8">
          <input type="text" className="form-control" value={value || ''} onChange={(e) => setValue(e.target.value)} />
          <small>{t('replacement:replace_missings')}</small>
        </div>
      </div>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Replace With', { ns: 'replacement' })}</label>
        <div className="col-md-8">
          <div className="row">
            <ButtonToggle
              options={Object.values(ValueConfigType).map((configType) => ({
                value: configType,
                label: t(capitalize(configType), { ns: 'replacement' }),
              }))}
              update={setType}
              defaultValue={type}
              compact={false}
              style={{ height: 'fit-content' }}
            />
            <div className="col">
              {type === ValueConfigType.COL && (
                <div className="input-group">
                  <ColumnSelectInput
                    prop="col"
                    otherProps={['parentCol']}
                    parent={{ col, parentCol: { value: props.col } }}
                    updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
                    columns={columns}
                    dtypes={['int', 'float'].includes(colType) ? ['int', 'float'] : [colType]}
                  />
                  {addBtn}
                </div>
              )}
              {type === ValueConfigType.AGG && (
                <div className="input-group">
                  <DtaleSelect
                    options={aggs}
                    value={agg}
                    onChange={(selected) => setAgg(selected as BaseOption<string>)}
                    isClearable={true}
                  />
                  {addBtn}
                </div>
              )}
              {type === ValueConfigType.RAW && (
                <React.Fragment>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control numeric-input"
                      value={raw ?? ''}
                      onChange={(e) => setRaw(e.target.value)}
                    />
                    {addBtn}
                  </div>
                  <small>{t('replacement:replace_missings')}</small>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      </div>
      {cfgs.map((cfg, i) => {
        let replaceStr;
        if (cfg.type === ValueConfigType.RAW) {
          replaceStr = valConverter(cfg.replace, colType, `"`);
        } else if (cfg.type === ValueConfigType.COL) {
          replaceStr = `${t('values from column', { ns: 'replacement' })} "${cfg.replace}"`;
        } else {
          replaceStr = `${t('replacement:the')} ${cfg.replace} ${t('replacement:of column')} "${props.col}"`;
        }
        return (
          <div key={i} className="row">
            <div className="col-md-3" />
            <div className="col-md-8">
              <i className="ico-remove-circle pointer mt-auto mb-auto mr-4" onClick={() => removeCfg(i)} />
              <span>
                {`${t('Search for', { ns: 'replacement' })} `}
                <b>{valConverter(cfg.value, colType, `"`)}</b>
                {` ${t('and replace it with', { ns: 'replacement' })} `}
                <b>{replaceStr}</b>
              </span>
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default withTranslation(['replacement', 'constant'])(Value);
