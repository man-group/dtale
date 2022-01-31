import { mount } from 'enzyme';
import * as React from 'react';

import { KurtMsg, SkewMsg } from '../../../dtale/column/ColumnMenuHeader';

describe('ColumnMenuHeader tests', () => {
  it('correctly renders skew message', () => {
    expect(
      mount(<SkewMsg skew={0} />)
        .find('span')
        .text(),
    ).toBe('(fairly symmetrical)');
    expect(
      mount(<SkewMsg skew={-0.75} />)
        .find('span')
        .text(),
    ).toBe('(moderately skewed)');
    expect(
      mount(<SkewMsg skew={0.7} />)
        .find('span')
        .text(),
    ).toBe('(moderately skewed)');
    expect(
      mount(<SkewMsg skew={-2} />)
        .find('span')
        .text(),
    ).toBe('(highly skewed)');
    expect(mount(<SkewMsg skew="nan" />).html()).toBeNull();
  });

  it('correctly renders kurtosis message', () => {
    expect(
      mount(<KurtMsg kurt={4} />)
        .find('span')
        .text(),
    ).toBe('(leptokurtic)');
    expect(
      mount(<KurtMsg kurt={3} />)
        .find('span')
        .text(),
    ).toBe('(mesokurtic)');
    expect(
      mount(<KurtMsg kurt={2} />)
        .find('span')
        .text(),
    ).toBe('(platykurtic)');
    expect(mount(<KurtMsg kurt="nan" />).html()).toBeNull();
  });
});
