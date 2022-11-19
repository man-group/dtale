import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { BaseOption } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  DatetimeConfig,
  DatetimeConversionType,
  DatetimeOperation,
  DatetimePropertyType,
} from './CreateColumnState';

export const validateDatetimeCfg = (t: TFunction, cfg: DatetimeConfig): string | undefined => {
  const { col } = cfg;
  if (!col) {
    return t('Missing a column selection!') ?? undefined;
  }
  return undefined;
};

const FREQ_MAPPING: Record<string, string> = { month: "'M'", quarter: "'Q'", year: "'Y'" };

export const buildCode = (cfg: DatetimeConfig): CreateColumnCodeSnippet => {
  const { col, operation, property, conversion } = cfg;
  if (!col) {
    return undefined;
  }
  let code = '';
  if (operation === DatetimeOperation.PROPERTY) {
    if (!property) {
      return undefined;
    }
    code = `df['${col}'].dt.${property}`;
  } else {
    if (!conversion) {
      return undefined;
    }
    const [freq, how] = conversion.split('_');
    code = `df['${col}'].dt.to_period(${FREQ_MAPPING[freq]}).dt.to_timestamp(how='${how}')`;
  }
  return code;
};

const operationLabelBuilder = (t: TFunction, option: string): string => t(option.split('_').map(capitalize).join(' '));

const CreateDatetime: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [operationOptions, propertyOptions, conversionOptions] = React.useMemo(() => {
    return [
      Object.values(DatetimeOperation).map((value) => ({ value, label: capitalize(value) })),
      Object.values(DatetimePropertyType).map((value) => ({ value, label: operationLabelBuilder(t, value) })),
      Object.values(DatetimeConversionType).map((value) => ({ value, label: operationLabelBuilder(t, value) })),
    ];
  }, [t]);
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [operation, setOperation] = React.useState(DatetimeOperation.PROPERTY);
  const [property, setProperty] = React.useState<DatetimePropertyType>();
  const [conversion, setConversion] = React.useState<DatetimeConversionType>();

  React.useEffect(() => {
    const cfg: DatetimeConfig = {
      col: col?.value,
      operation,
      property: operation === DatetimeOperation.PROPERTY ? property : undefined,
      conversion: operation === DatetimeOperation.CONVERSION ? conversion : undefined,
    };
    updateState({ cfg: { type: CreateColumnType.DATETIME, cfg }, code: buildCode(cfg) });
  }, [col, operation, property, conversion]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Column')}
        prop="col"
        parent={{ col }}
        updateState={(updatedState: { col?: BaseOption<string> }) => setCol(updatedState.col)}
        columns={columns}
        dtypes={['date']}
      />
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Operation')}</label>
        <div className="col-md-8">
          <ButtonToggle options={operationOptions} update={setOperation} defaultValue={operation} compact={false} />
        </div>
      </div>
      {operation === DatetimeOperation.PROPERTY && (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Properties')}</label>
          <div className="col-md-8">
            <ButtonToggle options={propertyOptions} update={setProperty} defaultValue={property} compact={false} />
          </div>
        </div>
      )}
      {operation === DatetimeOperation.CONVERSION && (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Conversions')}</label>
          <div className="col-md-8">
            <ButtonToggle
              options={conversionOptions}
              update={setConversion}
              defaultValue={conversion}
              compact={false}
            />
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateDatetime);
