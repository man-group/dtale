import * as React from 'react';
import { createFilter } from 'react-select';
import AsyncSelect from 'react-select/async';

import * as ColumnFilterRepository from '../repository/ColumnFilterRepository';

/** Component properties for AsyncValueSelect */
export interface AsyncValueSelectProps<T> {
  uniques: T[];
  missing?: boolean;
  updateState: (selected?: T | T[]) => void;
  dataId: string;
  selectedCol: string;
  selected?: T | T[];
  isMulti?: boolean;
}

/** State properties for AsyncValueSelect */
interface AsyncValueSelectState<T> {
  selected?: T | T[];
}

/** Option properties */
export interface AsyncOption<T> {
  label: string;
  value: T;
}

/** Dropdown w/ support for asynchronous option loading */
export default class AsyncValueSelect<T> extends React.Component<AsyncValueSelectProps<T>, AsyncValueSelectState<T>> {
  /** @override */
  public constructor(props: AsyncValueSelectProps<T>) {
    super(props);
    this.state = { selected: props.selected };
    this.updateState = this.updateState.bind(this);
    this.loadOptions = this.loadOptions.bind(this);
  }

  /** @override */
  public componentDidUpdate(
    prevProps: Readonly<AsyncValueSelectProps<T>>,
    prevState: Readonly<AsyncValueSelectState<T>>,
  ): void {
    if (this.state !== prevState) {
      return;
    }

    if (this.props.selected !== prevProps.selected) {
      this.setState({ selected: this.props.selected });
    }
  }

  /** @override */
  public render(): React.ReactNode {
    const { missing, uniques } = this.props;
    const isMulti = this.props.isMulti ?? true;
    const { selected } = this.state;
    const props = {
      isDisabled: missing ?? false,
      className: 'Select is-clearable is-searchable Select--single',
      classNamePrefix: 'Select',
      isClearable: true,
      cacheOptions: true,
      filterOption: createFilter({ ignoreAccents: false }), // required for performance reasons!
      defaultOptions: uniques.map((unique) => ({ label: String(unique), value: unique })),
      loadOptions: this.loadOptions,
    };
    return (
      <React.Fragment>
        {!isMulti && (
          <AsyncSelect
            isMulti={false}
            {...props}
            value={selected ? { label: String(selected), value: selected as T } : null}
            onChange={(option) => this.updateState(option?.value)}
          />
        )}
        {isMulti && (
          <AsyncSelect
            isMulti={true}
            {...props}
            value={selected ? (selected as T[]).map((s) => ({ label: String(s), value: s })) : null}
            onChange={(option) =>
              this.updateState(option ? (Array.isArray(option) ? option : [option]).map((o) => o.value) : undefined)
            }
          />
        )}
      </React.Fragment>
    );
  }

  /**
   * Update state and parent state.
   *
   * @param selected selected value
   */
  private updateState(selected?: T | T[]): void {
    this.setState({ selected }, () => this.props.updateState(selected));
  }

  /**
   * Asynchronous loader for AsyncSelect options.
   *
   * @param input user input from AsyncSelect
   * @return filtered AsyncSelect options
   */
  private loadOptions(input: string): Promise<Array<{ label: string; value: T }>> {
    return ColumnFilterRepository.loadAsyncData<T>(this.props.dataId, this.props.selectedCol, input).then(
      (response) => response!,
    );
  }
}
