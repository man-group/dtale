import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { ColumnDef } from '../../dtale/DataViewerState';
import * as gu from '../../dtale/gridUtils';
import { BaseOption } from '../../redux/state/AppState';
import { sortOptions } from '../analysis/filters/Constants';

export const constructColumnOptionsFilteredByOtherValues = (
  columns: ColumnDef[],
  otherValues?: Array<BaseOption<string> | Array<BaseOption<string>> | undefined>,
): Array<BaseOption<string>> => {
  const alreadySelected: string[] = [];
  (otherValues ?? []).forEach((otherValue) => {
    if (Array.isArray(otherValue)) {
      otherValue.forEach(({ value }) => {
        if (value) {
          alreadySelected.push(value);
        }
      });
    } else {
      if (otherValue) {
        alreadySelected.push(otherValue.value);
      }
    }
  });
  return columns
    ?.filter(({ name }) => !alreadySelected.includes(name))
    .map(({ name, label }) => ({ value: name, label }))
    .sort(sortOptions);
};

export const constructColumnOptionsFilteredByDtypeAndOtherValues = (
  columns: ColumnDef[],
  dataTypes?: string[],
  otherValues?: Array<BaseOption<string> | Array<BaseOption<string>> | undefined>,
): Array<BaseOption<string>> => {
  const filteredColumnOptions = dataTypes
    ? columns.filter(({ dtype }) => dataTypes.includes(gu.findColType(dtype)))
    : columns;
  return constructColumnOptionsFilteredByOtherValues(filteredColumnOptions, otherValues);
};

export const buildAllOption = (t: TFunction): BaseOption<string> => ({
  value: 'all',
  label: t('Apply To All Columns', { ns: 'range_highlight' }),
});

/** Component properties for ColumnSelectInput */
interface ColumnSelectInputProps {
  columns: ColumnDef[];
  isMulti?: boolean;
  otherProps?: string[];
  prop: string;
  parent: Record<string, any>;
  updateState: (state: Record<string, BaseOption<string> | Array<BaseOption<string>> | undefined>) => void;
  dtypes?: string[];
  includeAllOption?: boolean;
}

export const BaseColumnSelectInput: React.FC<ColumnSelectInputProps & WithTranslation> = ({
  columns,
  dtypes,
  isMulti,
  otherProps,
  parent,
  prop,
  updateState,
  includeAllOption,
  t,
}) => {
  const [dtypesStr, columnOptions] = React.useMemo(() => {
    const otherValues = otherProps?.map(
      (otherProp) => parent[otherProp] as BaseOption<string> | Array<BaseOption<string>> | undefined,
    );
    const options = constructColumnOptionsFilteredByDtypeAndOtherValues(columns, dtypes, otherValues);
    if (includeAllOption) {
      options.push(buildAllOption(t));
    }
    return [dtypes ? ` ${t('for the following dtypes')}: ${dtypes.join(', ')}` : '', options];
  }, [dtypes, columns, parent, otherProps, includeAllOption]);

  return (
    <Select
      isMulti={isMulti ?? false}
      className="Select is-clearable is-searchable Select--single"
      classNamePrefix="Select"
      options={columnOptions}
      getOptionLabel={(o) => o.label ?? o.value}
      getOptionValue={(o) => o.value}
      value={parent[prop] ?? null}
      onChange={(selected?: BaseOption<string> | Array<BaseOption<string>>) => updateState({ [prop]: selected })}
      isClearable={true}
      filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      noOptionsMessage={() => `${t('No columns available')}${dtypesStr}!`}
    />
  );
};

export const ColumnSelectInput = withTranslation(['builders', 'range_highlight'])(BaseColumnSelectInput);

/** Component properties for ColumnSelect */
interface ColumnSelectProps extends ColumnSelectInputProps {
  label: React.ReactNode;
}

const ColumnSelect: React.FC<React.PropsWithChildren<ColumnSelectProps & WithTranslation>> = ({
  label,
  children,
  t,
  ...inputProps
}) => (
  <div className="form-group row">
    <label className="col-md-3 col-form-label text-right">{label || inputProps.prop}</label>
    <div className="col-md-8">
      <div className="input-group">
        <ColumnSelectInput {...inputProps} />
      </div>
      {children}
    </div>
  </div>
);

export default withTranslation(['builders', 'range_highlight'])(ColumnSelect);
