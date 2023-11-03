import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { default as GeoFilters, GeoFiltersProps } from '../../../../popups/analysis/filters/GeoFilters';
import { mockColumnDef } from '../../../mocks/MockColumnDef';
import { selectOption } from '../../../test-utils';

describe('GeoFilters tests', () => {
  let result: Element;
  let props: GeoFiltersProps;

  const buildMock = (overrides?: Partial<GeoFiltersProps>): void => {
    props = {
      col: 'lat',
      columns: [
        mockColumnDef({ name: 'lat', coord: 'lat', dtype: 'float' }),
        mockColumnDef({ name: 'lon', coord: 'lon', dtype: 'float' }),
        mockColumnDef({ name: 'lat2', coord: 'lat', dtype: 'float' }),
        mockColumnDef({ name: 'lat3', coord: 'lat', dtype: 'float' }),
        mockColumnDef({ name: 'lon2', coord: 'lon', dtype: 'float' }),
      ],
      setLatCol: jest.fn(),
      setLonCol: jest.fn(),
      latCol: { value: 'lat' },
      lonCol: { value: 'lon' },
      ...overrides,
    };
    result = render(<GeoFilters {...props} />).container;
  };

  it('renders longitude dropdown', async () => {
    buildMock();
    const lonInput = screen.getByTestId('lon-input');
    expect(lonInput).toBeDefined();
    await selectOption(lonInput.querySelector('.Select')! as HTMLElement, 'lon2');
    expect(props.setLonCol).toHaveBeenLastCalledWith({ value: 'lon2' });
  });

  it('renders latitude dropdown', async () => {
    buildMock({ col: 'lon' });
    const latInput = screen.getByTestId('lat-input');
    expect(latInput).toBeDefined();
    await selectOption(latInput.querySelector('.Select')! as HTMLElement, 'lat2');
    expect(props.setLatCol).toHaveBeenLastCalledWith({ value: 'lat2' });
  });

  it('renders text', () => {
    buildMock({
      columns: [mockColumnDef({ name: 'lat', coord: 'lat' }), mockColumnDef({ name: 'lon', coord: 'lon' })],
    });
    expect(result.textContent).toBe('Latitude:latLongitude:lon');
  });
});
