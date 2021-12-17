import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { default as Select } from 'react-select';

import { ColumnFilter } from '../../dtale/DataViewerState';
import { NE_OPTION } from '../../filters/NumericFilter';
import { default as StringFilter, StringFilterProps } from '../../filters/StringFilter';
import ValueSelect from '../../filters/ValueSelect';
import { tickUpdate } from '../test-utils';

describe('StringFilter', () => {
  let wrapper: ReactWrapper<StringFilterProps>;
  let updateState: jest.Mock<Promise<void>, [ColumnFilter?]>;
  let props: StringFilterProps;

  beforeEach(async () => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');
    updateState = jest.fn((state?: ColumnFilter) => Promise.resolve(undefined));
    props = {
      selectedCol: 'foo',
      columnFilter: { type: 'string', value: ['a'], action: 'equals', operand: 'ne' },
      updateState,
      uniques: ['a', 'b', 'c'],
      missing: false,
      uniqueCt: 3,
    };
    wrapper = mount(<StringFilter {...props} />);
    await act(async () => await tickUpdate(wrapper));
  });

  afterEach(jest.restoreAllMocks);

  it('reads presets successfully', () => {
    expect(wrapper.find('button.active').first().text()).toBe(NE_OPTION.label);
    expect(wrapper.find(Select).first().props().value.value).toBe('equals');
    expect(wrapper.find(ValueSelect).last().props().selected).toEqual(['a']);
  });

  it('handles case-sensitive update', async () => {
    await act(async () => {
      wrapper.find('button').last().simulate('click');
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ caseSensitive: true }));
  });

  it('handles action/raw update', async () => {
    await act(async () => {
      wrapper.find(Select).first().props().onChange({ value: 'startswith' });
    });
    wrapper = wrapper.update();
    expect(wrapper.find('input.form-control')).toHaveLength(1);
    await act(async () => {
      wrapper
        .find('input')
        .last()
        .simulate('change', { target: { value: 'b' } });
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper.find('input').last().simulate('keyDown', { key: 'Enter' });
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: 'b' }));
  });

  it('handles length check', async () => {
    await act(async () => {
      wrapper.find(Select).first().props().onChange({ value: 'length' });
    });
    wrapper = wrapper.update();
    expect(wrapper.find('input.form-control')).toHaveLength(1);
    updateState.mockReset();
    await act(async () => {
      wrapper
        .find('input')
        .last()
        .simulate('change', { target: { value: 'b' } });
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper.find('input').last().simulate('keyDown', { key: 'Enter' });
    });
    wrapper = wrapper.update();
    expect(updateState).not.toHaveBeenCalled();
    await act(async () => {
      wrapper
        .find('input')
        .last()
        .simulate('change', { target: { value: '1,3' } });
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper.find('input').last().simulate('keyDown', { key: 'Enter' });
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: '1,3' }));
  });
});
