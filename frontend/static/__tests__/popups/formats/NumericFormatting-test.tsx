import { act, render } from '@testing-library/react';
import * as React from 'react';

import NumericFormatting from '../../../popups/formats/NumericFormatting';

describe('NumericFormatting', () => {
  it('build state correctly from pre-existing formatting', async () => {
    const columnFormats = {
      col1: { fmt: '0,000.000', style: { currency: 'USD' } },
    };
    const updateState = jest.fn();
    await act(
      async () =>
        await render(<NumericFormatting {...{ columnFormats, selectedCol: 'col1', updateState }} />).container,
    );
    expect(updateState).toHaveBeenCalledWith({ fmt: '$0,000.000', style: { currency: 'USD', redNegs: false } });
  });
});
