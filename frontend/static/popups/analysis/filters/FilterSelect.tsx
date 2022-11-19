import * as React from 'react';
import { createFilter, default as Select } from 'react-select';

import { BaseOption } from '../../../redux/state/AppState';

/** Component properties for FilterSelect */
export interface FilterSelectProps<T> {
  isMulti?: boolean;
  isClearable?: boolean;
  onChange: (v?: BaseOption<T> | Array<BaseOption<T>>) => void;
  noOptionsMessage?: () => string;
  value?: BaseOption<T> | Array<BaseOption<T>>;
  options: Array<BaseOption<T>>;
}

/** Filtered react-select dropdown */
export default class FilterSelect<T> extends React.Component<FilterSelectProps<T>, Record<string, unknown>> {
  /** @override */
  public constructor(props: FilterSelectProps<T>) {
    super(props);
  }

  /** @override */
  public render(): JSX.Element {
    const { value, isClearable, options, noOptionsMessage } = this.props;
    const props = {
      className: 'Select is-clearable is-searchable Select--single',
      classNamePrefix: 'Select',
      isClearable,
      getOptionLabel: (option: BaseOption<T>) => option.label ?? String(option.value),
      filterOption: createFilter({ ignoreAccents: false }), // required for performance reasons!
      options,
      noOptionsMessage,
    };
    return (
      <React.Fragment>
        {!this.props.isMulti && (
          <Select
            isMulti={false}
            {...props}
            value={value ?? null}
            onChange={(option) => this.props.onChange(option ?? undefined)}
          />
        )}
        {this.props.isMulti === true && (
          <Select
            isMulti={true}
            {...props}
            value={value ?? null}
            onChange={(option) => this.props.onChange((option as Array<BaseOption<T>>) ?? undefined)}
          />
        )}
      </React.Fragment>
    );
  }
}
