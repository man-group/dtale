import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import selectEvent from 'react-select-event';

import { default as CategoryInputs, CategoryInputsProps } from '../../../../popups/analysis/filters/CategoryInputs';
import { mockColumnDef } from '../../../mocks/MockColumnDef';
import { selectOption } from '../../../test-utils';

describe('CategoryInputs tests', () => {
  afterEach(jest.resetAllMocks);

  it('calls updateCategory', async () => {
    const props: CategoryInputsProps = {
      selectedCol: 'foo',
      cols: [mockColumnDef({ name: 'foo', dtype: 'str' }), mockColumnDef({ name: 'bar', dtype: 'str' })],
      setCategoryCol: jest.fn(),
      setCategoryAgg: jest.fn(),
    };
    const result = render(<CategoryInputs {...props} />).container;
    const selects = result.getElementsByClassName('Select');
    await selectOption(selects[0] as HTMLElement, 'bar');
    await selectOption(selects[1] as HTMLElement, 'Mean');
    expect(props.setCategoryCol).toHaveBeenCalled();
    expect(props.setCategoryCol).toHaveBeenCalledWith({ value: 'bar' });
    expect(props.setCategoryAgg).toHaveBeenCalledWith({ value: 'mean', label: 'Mean' });
  });

  it('displays no options message', async () => {
    const props: CategoryInputsProps = {
      selectedCol: 'foo',
      cols: [],
      setCategoryCol: jest.fn(),
      setCategoryAgg: jest.fn(),
    };
    const result = render(<CategoryInputs {...props} />).container;
    const select = result.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect(screen.getByText('No columns found')).toBeDefined();
  });
});
