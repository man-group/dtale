import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { BaseInputProps, default as BaseInputs } from '../../../popups/timeseries/BaseInputs';
import { selectOption } from '../../test-utils';

describe('BaseInputs', () => {
  let wrapper: Element;
  let props: BaseInputProps;

  beforeEach(() => {
    props = {
      columns: [
        { dtype: 'int', name: 'foo', index: 0 },
        { dtype: 'datetime', name: 'date', index: 1 },
      ],
      cfg: {},
      updateState: jest.fn(),
    };
    wrapper = render(<BaseInputs {...props} />).container;
  });

  it('renders successfully', () => {
    expect(wrapper.querySelectorAll('div.col-md-4')).toHaveLength(3);
  });

  it('updates state', async () => {
    await selectOption(
      screen.getByText('Index').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'date',
    );
    await selectOption(
      screen.getByText('Column').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'foo',
    );
    await selectOption(
      screen.getByText('Agg').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Sum',
    );
    expect(props.updateState).toHaveBeenLastCalledWith({
      index: 'date',
      col: 'foo',
      agg: 'sum',
    });
  });
});
