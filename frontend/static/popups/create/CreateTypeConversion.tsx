import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { ColumnType, findColType, getDtype } from '../../dtale/gridUtils';
import { BaseOption } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';

import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  TypeConversionConfig,
  TypeConversionUnit,
} from './CreateColumnState';
import { Checkbox } from './LabeledCheckbox';
import { LabeledInput } from './LabeledInput';
import { LabeledSelect } from './LabeledSelect';
import { buildCode, isMixed } from './typeConversionCodeUtils';

const TYPE_MAP: Record<string, string[]> = {
  string: ['date', 'int', 'float', 'bool', 'category'],
  int: ['date', 'float', 'bool', 'category', 'str', 'hex'],
  float: ['int', 'str', 'hex'],
  date: ['int', 'str'],
  bool: ['int', 'str'],
  category: ['int', 'bool', 'str'],
};

const getColType = (col: BaseOption<string> | undefined, columns: ColumnDef[]): string | undefined => {
  const dtype = getDtype(col?.value, columns);
  const colType = findColType(dtype);
  if ([ColumnType.CATEGORY, ColumnType.UNKNOWN].includes(colType)) {
    return dtype;
  }
  return colType;
};
const getConversions = (col: BaseOption<string> | undefined, columns: ColumnDef[]): [string[], string | undefined] => {
  const colType = getColType(col, columns);
  if (isMixed(colType)) {
    return [TYPE_MAP.string.filter((typeMapping) => typeMapping !== ColumnType.INT), colType];
  }
  return [TYPE_MAP[colType ?? ''] ?? [], colType];
};

export const validateTypeConversionCfg = (t: TFunction, cfg: TypeConversionConfig): string | undefined => {
  const { col, to, from, unit } = cfg;
  if (!col) {
    return t('Missing a column selection!') ?? undefined;
  }
  if (!to) {
    return t('Missing a conversion selection!') ?? undefined;
  }
  const colType = findColType(from);
  if ((colType === ColumnType.INT && to === 'date') || (colType === ColumnType.DATE && to === 'int')) {
    if (!unit) {
      return t('Missing a unit selection!') ?? undefined;
    }
    if (colType === ColumnType.DATE && to === 'int' && ['D', 's', 'us', 'ns'].includes(unit)) {
      return t("Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'") ?? undefined;
    }
  }
  return undefined;
};

/** Component properties for CreateTypeConversion */
interface TypeConversionProps extends BaseCreateComponentProps {
  prePopulated?: TypeConversionConfig;
}

const CreateTypeConversion: React.FC<TypeConversionProps & WithTranslation> = ({
  prePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [conversion, setConversion] = React.useState<string>();
  const [fmt, setFmt] = React.useState<string>();
  const [unit, setUnit] = React.useState<BaseOption<TypeConversionUnit>>();
  const [applyAllType, setApplyAllType] = React.useState(false);

  React.useEffect(() => {
    if (prePopulated?.col) {
      setCol({ value: prePopulated.col });
    }
  }, []);

  React.useEffect(() => {
    const cfg: TypeConversionConfig = {
      col: col?.value,
      to: conversion,
      from: getDtype(col?.value, columns),
      fmt,
      unit: unit?.value,
      applyAllType,
    };
    updateState({ cfg: { type: CreateColumnType.TYPE_CONVERSION, cfg }, code: buildCode(cfg) });
  }, [col, conversion, fmt, unit, applyAllType]);

  const renderConversions = (): React.ReactNode => {
    if (col) {
      const [conversionOptions, dtype] = getConversions(col, columns);
      return (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Convert To')}</label>
          <div className="col-md-8">
            {!!conversionOptions.length ? (
              <ButtonToggle
                options={conversionOptions.map((value) => ({ value, label: capitalize(value) }))}
                update={setConversion}
                defaultValue={conversion}
                compact={false}
              />
            ) : (
              <span>
                {`${t('No conversion mappings available for dtype')}:`}
                <b className="pl-3">{dtype}</b>
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderConversionInputs = (): React.ReactNode => {
    if (!col) {
      return null;
    }
    const colType = getColType(col, columns);
    if (
      (colType === ColumnType.STRING && conversion === 'date') ||
      (colType === ColumnType.DATE && conversion === 'date')
    ) {
      return <LabeledInput label={t('Date Format')} value={fmt ?? '%Y%m%d'} setter={setFmt} />;
    }
    if (
      (colType === ColumnType.INT && conversion === 'date') ||
      (colType === ColumnType.DATE && conversion === 'int')
    ) {
      const units =
        colType === ColumnType.INT
          ? Object.values(TypeConversionUnit)
          : [TypeConversionUnit.DATE, TypeConversionUnit.MILLISECOND];
      return (
        <LabeledSelect
          label={t('Unit/Format')}
          options={units.map((u) => ({ value: u }))}
          value={unit}
          onChange={(selected) => setUnit(selected as BaseOption<TypeConversionUnit>)}
          isClearable={true}
        />
      );
    }
    return null;
  };

  const colType = getDtype(col?.value, columns);
  const prePopulatedCol = prePopulated?.col;
  return (
    <React.Fragment>
      {!prePopulatedCol && (
        <ColumnSelect
          label={t('Column To Convert')}
          prop="col"
          parent={{ col }}
          updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
          columns={columns}
        />
      )}
      {renderConversions()}
      {renderConversionInputs()}
      {isMixed(colType) && (
        <div className="form-group row">
          <div className={`col-md-${prePopulatedCol ? '1' : '3'}`} />
          <div className={`col-md-${prePopulatedCol ? '10' : '8'} mt-auto mb-auto`}>
            <label className="col-form-label text-right pr-3">
              {`${t('Apply Conversion to all columns of type')} "${colType}"?`}
            </label>
            <Checkbox value={applyAllType} setter={setApplyAllType} />
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateTypeConversion);
