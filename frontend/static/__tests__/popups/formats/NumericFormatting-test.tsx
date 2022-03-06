import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import NumericFormatting from '../../../popups/formats/NumericFormatting';
import { tickUpdate } from '../../test-utils';

describe('NumericFormatting', () => {
  it('build state correctly from pre-existing formatting', async () => {
    const columnFormats = {
      col1: { fmt: '0,000.000', style: { currency: 'USD' } },
    };
    const updateState = jest.fn();
    let result = mount(<NumericFormatting {...{ columnFormats, selectedCol: 'col1', updateState }} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(updateState).toHaveBeenCalledWith({ fmt: '$0,000.000', style: { currency: 'USD', redNegs: false } });
  });
});
