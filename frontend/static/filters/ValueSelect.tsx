import * as React from 'react';
import { createFilter, default as Select } from 'react-select';

/** Component properties for ValueSelect */
export interface ValueSelectProps<T> {
  uniques: T[];
  missing?: boolean;
  updateState: (selected?: T | T[]) => void;
  selected?: T | T[];
  isMulti?: boolean;
}

/** State properties for ValueSelect */
interface ValueSelectState<T> {
  selected?: T | T[];
}

/** Wrapper component for react-select */
export default class ValueSelect<T> extends React.Component<ValueSelectProps<T>, ValueSelectState<T>> {
  /** @override */
  public constructor(props: ValueSelectProps<T>) {
    super(props);
    this.state = { selected: props.selected };
    this.updateState = this.updateState.bind(this);
  }

  /** @override */
  public componentDidUpdate(prevProps: Readonly<ValueSelectProps<T>>, prevState: Readonly<ValueSelectState<T>>): void {
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
      filterOption: createFilter({ ignoreAccents: false }), // required for performance reasons!
      options: uniques.map((unique) => ({ label: String(unique), value: unique })),
    };
    return (
      <React.Fragment>
        {!isMulti && (
          <Select
            isMulti={false}
            {...props}
            value={selected ? { label: String(selected as T), value: selected as T } : null}
            onChange={(option) => this.updateState(option?.value)}
          />
        )}
        {isMulti && (
          <Select
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
}
