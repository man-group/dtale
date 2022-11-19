import { render } from '@testing-library/react';
import * as React from 'react';

import { KurtMsg, SkewMsg } from '../../../dtale/column/ColumnMenuHeader';

describe('ColumnMenuHeader tests', () => {
  it('renders fairly symmetrical', () => {
    expect(render(<SkewMsg skew={0} />).container.textContent).toBe('(fairly symmetrical)');
    expect(render(<SkewMsg skew={-0.75} />).container.textContent).toBe('(moderately skewed)');
    expect(render(<SkewMsg skew={0.7} />).container.textContent).toBe('(moderately skewed)');
    expect(render(<SkewMsg skew={-2} />).container.textContent).toBe('(highly skewed)');
    expect(render(<SkewMsg skew="nan" />).container.innerHTML).toBe('');
  });

  it('correctly renders kurtosis message', () => {
    expect(render(<KurtMsg kurt={4} />).container.textContent).toBe('(leptokurtic)');
    expect(render(<KurtMsg kurt={3} />).container.textContent).toBe('(mesokurtic)');
    expect(render(<KurtMsg kurt={2} />).container.textContent).toBe('(platykurtic)');
    expect(render(<KurtMsg kurt="nan" />).container.innerHTML).toBe('');
  });
});
