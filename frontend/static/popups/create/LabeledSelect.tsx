import * as React from 'react';
import { createFilter, MultiValue, default as Select, SingleValue } from 'react-select';

import { BaseOption } from '../../redux/state/AppState';

/** Component properties for DtaleSelect */
interface DtaleSelectProps {
  options: Array<BaseOption<any>>;
  isMulti?: boolean;
  isClearable?: boolean;
  value?: BaseOption<any> | Array<BaseOption<any>>;
  onChange?: (state: BaseOption<any> | Array<BaseOption<any>> | undefined) => void;
  noOptionsMessage?: string;
  placeholder?: string | null;
}

export const DtaleSelect = React.forwardRef<Select, DtaleSelectProps>(
  ({ options, value, onChange, noOptionsMessage, isMulti, isClearable, placeholder }, ref) => (
    <Select
      ref={ref as any}
      className="Select is-clearable is-searchable Select--single"
      classNamePrefix="Select"
      options={options}
      getOptionLabel={(option) => option?.label ?? option.value}
      getOptionValue={(option) => option.value}
      {...(onChange
        ? {
            value,
            onChange: (selected: MultiValue<BaseOption<any>> | SingleValue<BaseOption<any>>) =>
              onChange?.(isMulti ? (selected as Array<BaseOption<any>>) : (selected as BaseOption<any>) ?? undefined),
          }
        : {})}
      noOptionsMessage={() => noOptionsMessage ?? 'No options found'}
      filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      isMulti={isMulti}
      isClearable={isClearable}
      placeholder={placeholder}
    />
  ),
);

/** Component properties for LabeledSelect */
interface LabeledSelectProps extends DtaleSelectProps {
  label: string;
  subLabel?: string;
  inputWidth?: number;
  labelWidth?: number;
}

export const LabeledSelect: React.FC<React.PropsWithChildren<LabeledSelectProps>> = ({
  label,
  subLabel,
  children,
  inputWidth,
  labelWidth,
  ...props
}) => (
  <div className="form-group row">
    <label className={`col-md-${labelWidth ?? 3} col-form-label text-right`}>{label}</label>
    <div className={`col-md-${inputWidth ?? 8}`}>
      <DtaleSelect {...props} />
      {subLabel && <small>{subLabel}</small>}
    </div>
    {children}
  </div>
);
