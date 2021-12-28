import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

import { default as CategoryInputs, CategoryInputsProps } from '../../../../popups/analysis/filters/CategoryInputs';
import FilterSelect from '../../../../popups/analysis/filters/FilterSelect';

describe('CategoryInputs tests', () => {
  let result: ShallowWrapper<CategoryInputsProps>;
  let props: CategoryInputsProps;

  beforeEach(() => {
    props = {
      selectedCol: 'foo',
      cols: [
        { name: 'foo', dtype: 'str', locked: false, unique_ct: 10 },
        { name: 'bar', dtype: 'str', locked: false, unique_ct: 10 },
      ],
      setCategoryCol: jest.fn(),
      setCategoryAgg: jest.fn(),
    };
    result = shallow(<CategoryInputs {...props} />);
  });

  afterEach(jest.resetAllMocks);

  it('calls updateCategory', () => {
    result.find(FilterSelect).first().props().onChange({ value: 'bar' });
    result.find(FilterSelect).last().props().onChange({ value: 'mean' });
    expect(props.setCategoryCol).toHaveBeenCalled();
    expect(props.setCategoryCol).toHaveBeenCalledWith({ value: 'bar' });
    expect(props.setCategoryAgg).toHaveBeenCalledWith({ value: 'mean' });
    expect(result.find(FilterSelect).first().props().noOptionsText()).toBe('No columns found');
  });
});
