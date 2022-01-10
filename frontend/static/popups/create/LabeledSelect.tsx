import * as React from 'react';
import { createFilter, MultiValue, default as Select, SingleValue } from 'react-select';

import { BaseOption } from '../../redux/state/AppState';

/** Component properties for LabeledSelect */
interface LabeledSelectProps {
  label: string;
  options: Array<BaseOption<any>>;
  isMulti?: boolean;
  isClearable?: boolean;
  value?: BaseOption<any> | Array<BaseOption<any>>;
  onChange: (state: BaseOption<any> | Array<BaseOption<any>> | undefined) => void;
  subLabel?: string;
  noOptionsMessage?: string;
  selectSize?: string;
}

export const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  options,
  isMulti,
  isClearable,
  onChange,
  value,
  subLabel,
  children,
  noOptionsMessage,
  selectSize,
}) => (
  <div className="form-group row">
    <label className="col-md-3 col-form-label text-right">{label}</label>
    <div className={`col-md-${selectSize ?? '8'}`}>
      <Select
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={options}
        getOptionLabel={(option) => option?.label ?? option.value}
        getOptionValue={(option) => option.value}
        value={value ?? null}
        onChange={(selected: MultiValue<BaseOption<any>> | SingleValue<BaseOption<any>>) =>
          onChange(isMulti ? (selected as Array<BaseOption<any>>) : (selected as BaseOption<any>) ?? undefined)
        }
        noOptionsMessage={() => noOptionsMessage ?? 'No options found'}
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
        isMulti={isMulti}
        isClearable={isClearable}
      />
      {subLabel && <small>{subLabel}</small>}
    </div>
    {children}
  </div>
);
