import { render } from '@testing-library/react';
import * as React from 'react';

import CorrelationsTsOptions, { CorrelationsTsOptionsProps } from '../../popups/correlations/CorrelationsTsOptions';

describe('CorrelationsTsOptions tests', () => {
  const props: CorrelationsTsOptionsProps = {
    hasDate: false,
    rolling: false,
    useRolling: false,
    dates: [],
    selectedCols: [],
    window: 10,
    minPeriods: 3,
    buildTs: jest.fn(),
  };
  it('CorrelationsTsOptions hasDate == false', () => {
    const { container } = render(<CorrelationsTsOptions {...props} />);
    expect(container.innerHTML).toBe('');
  });

  it('CorrelationsTsOptions selectedCols empty', () => {
    const { container } = render(<CorrelationsTsOptions {...{ ...props, hasDate: true }} />);
    expect(container.innerHTML).toBe('');
  });
});
