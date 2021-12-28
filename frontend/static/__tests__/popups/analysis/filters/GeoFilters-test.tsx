import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

import FilterSelect from '../../../../popups/analysis/filters/FilterSelect';
import { default as GeoFilters, GeoFiltersProps } from '../../../../popups/analysis/filters/GeoFilters';

describe('GeoFilters tests', () => {
  let result: ShallowWrapper;
  let props: GeoFiltersProps;

  beforeEach(() => {
    props = {
      col: 'lat',
      columns: [
        { name: 'lat', coord: 'lat', dtype: 'float', locked: false, unique_ct: 10 },
        { name: 'lon', coord: 'lon', dtype: 'float', locked: false, unique_ct: 10 },
        { name: 'lat2', coord: 'lat', dtype: 'float', locked: false, unique_ct: 10 },
        { name: 'lat3', coord: 'lat', dtype: 'float', locked: false, unique_ct: 10 },
        { name: 'lon2', coord: 'lon', dtype: 'float', locked: false, unique_ct: 10 },
      ],
      setLatCol: jest.fn(),
      setLonCol: jest.fn(),
      latCol: { value: 'lat' },
      lonCol: { value: 'lon' },
    };
    result = shallow(<GeoFilters {...props} />);
  });

  it('renders longitude dropdown', () => {
    expect(result.find(FilterSelect).length).toBe(1);
    result.find(FilterSelect).first().props().onChange({ value: 'lon2' });
    expect(props.setLonCol).toHaveBeenLastCalledWith({ value: 'lon2' });
  });

  it('renders latitude dropdown', () => {
    result.setProps({ col: 'lon' });
    expect(result.find(FilterSelect).length).toBe(1);
    result.find(FilterSelect).first().props().onChange({ value: 'lat2' });
    expect(props.setLatCol).toHaveBeenLastCalledWith({ value: 'lat2' });
  });

  it('renders text', () => {
    result.setProps({
      columns: [
        { name: 'lat', coord: 'lat' },
        { name: 'lon', coord: 'lon' },
      ],
    });
    expect(result.text()).toBe('Latitude:latLongitude:lon');
  });
});
