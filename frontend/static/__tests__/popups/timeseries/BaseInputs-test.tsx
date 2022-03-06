import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import ColumnSelect from '../../../popups/create/ColumnSelect';
import { LabeledSelect } from '../../../popups/create/LabeledSelect';
import { BaseInputProps, default as BaseInputs } from '../../../popups/timeseries/BaseInputs';

describe('BaseInputs', () => {
  let wrapper: ReactWrapper;
  let props: BaseInputProps;

  beforeEach(() => {
    props = {
      columns: [{ dtype: 'int', name: 'foo', index: 0 }],
      cfg: {},
      updateState: jest.fn(),
    };
    wrapper = mount(<BaseInputs {...props} />);
  });

  it('renders successfully', () => {
    expect(wrapper.find('div.col-md-4')).toHaveLength(3);
  });

  it('updates state', async () => {
    await act(async () => {
      wrapper
        .find(ColumnSelect)
        .first()
        .props()
        .updateState({ index: { value: 'date' } });
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper
        .find(ColumnSelect)
        .last()
        .props()
        .updateState({ col: { value: 'foo' } });
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper.find(LabeledSelect).props().onChange?.({ value: 'sum' });
    });
    wrapper = wrapper.update();
    expect(props.updateState).toHaveBeenLastCalledWith({
      index: 'date',
      col: 'foo',
      agg: 'sum',
    });
  });
});
