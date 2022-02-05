import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

import ButtonToggle from '../../../../ButtonToggle';
import { default as FilterInput, FilterInputProps } from '../../../../dtale/side/predefined_filters/FilterInput';
import ValueSelect from '../../../../filters/ValueSelect';
import { PredefinedFilter, PredfinedFilterInputType } from '../../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../../repository/ColumnFilterRepository';
import reduxUtils from '../../../redux-test-utils';
import { tick } from '../../../test-utils';

describe('FilterInput', () => {
  let wrapper: ShallowWrapper;
  let props: FilterInputProps;
  let loadFilterDataSpy: jest.SpyInstance;

  const inputFilter: PredefinedFilter = {
    name: 'custom_foo1',
    description: 'custom_foo1 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.INPUT,
    active: false,
  };
  const selectFilter: PredefinedFilter = {
    name: 'custom_foo2',
    description: 'custom_foo2 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.SELECT,
    active: false,
  };
  const multiselectFilter: PredefinedFilter = {
    name: 'custom_foo3',
    description: 'custom_foo3 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.MULTISELECT,
    active: false,
  };

  beforeEach(() => {
    loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    props = {
      dataId: '1',
      filter: inputFilter,
      value: { value: '1', active: true },
      columns: reduxUtils.DTYPES.dtypes,
      save: jest.fn(),
    };
    wrapper = shallow(<FilterInput {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('handle input-style filters', () => {
    wrapper.find('button').simulate('click');
    expect(wrapper.find('input')).toHaveLength(1);
    wrapper.find('button').first().simulate('click');
    expect(wrapper.find('input')).toHaveLength(0);
    wrapper.find('button').simulate('click');
    expect(wrapper.find('input')).toHaveLength(1);
    wrapper.find('input').simulate('change', { target: { value: '2' } });
    wrapper.find('button').last().simulate('click');
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '2', true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handles enabling/disabling filters', () => {
    wrapper.find(ButtonToggle).props().update(false);
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '1', false);
    wrapper.find(ButtonToggle).props().update(true);
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '1', true);
  });

  it('handle input-style filter parsing error', () => {
    wrapper.find('button').simulate('click');
    expect(wrapper.find('input')).toHaveLength(1);
    wrapper.find('input').simulate('change', { target: { value: 'a' } });
    wrapper.find('button').last().simulate('click');
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.find('li').map((li) => li.text())).toEqual(['Invalid integer, a!']);
  });

  it('handle input-style float filter', () => {
    wrapper.setProps({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: 'float64' }],
    });
    wrapper.find('button').simulate('click');
    expect(wrapper.find('input')).toHaveLength(1);
    wrapper.find('input').simulate('change', { target: { value: 'a' } });
    wrapper.find('button').last().simulate('click');
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.find('li').map((li) => li.text())).toEqual(['Invalid float, a!']);

    wrapper.find('input').simulate('change', { target: { value: '1.1' } });
    wrapper.find('button').last().simulate('click');
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '1.1', true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handle input-style string filter', () => {
    wrapper.setProps({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: 'str' }],
    });
    wrapper.find('button').simulate('click');
    wrapper.find('input').simulate('change', { target: { value: 'a' } });
    wrapper.find('button').last().simulate('click');
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 'a', true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handle select-style filters', async () => {
    loadFilterDataSpy.mockResolvedValue({ uniques: [1, 2, 3], success: true });
    wrapper.setProps({
      filter: selectFilter,
      value: { value: 1, active: true },
    });
    wrapper.find('button').simulate('click');
    await tick();
    expect(wrapper.find(ValueSelect)).toHaveLength(1);
    wrapper.find(ValueSelect).props().updateState('2');
    wrapper.find('button').last().simulate('click');
    expect(props.save).toHaveBeenCalledWith(selectFilter.name, '2', true);
    expect(loadFilterDataSpy).toHaveBeenCalledTimes(1);
    expect(loadFilterDataSpy).toHaveBeenLastCalledWith('1', 'col1');
  });

  it('handle multiselect-style filters', async () => {
    loadFilterDataSpy.mockResolvedValue({ uniques: [1, 2, 3], success: true });
    wrapper.setProps({
      filter: multiselectFilter,
      value: { value: [1, 2], active: true },
    });
    wrapper.find('button').simulate('click');
    await tick();
    expect(wrapper.find(ValueSelect)).toHaveLength(1);
    wrapper.find(ValueSelect).props().updateState(['2', '3']);
    wrapper.find('button').last().simulate('click');
    expect(props.save).toHaveBeenCalledWith(multiselectFilter.name, ['2', '3'], true);
    expect(loadFilterDataSpy).toHaveBeenCalledTimes(1);
  });
});
