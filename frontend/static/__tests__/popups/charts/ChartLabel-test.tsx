import { render } from '@testing-library/react';
import * as React from 'react';

import { default as ChartLabel, ChartLabelProps } from '../../../popups/charts/ChartLabel';

describe('ChartLabel tests', () => {
  let result: Element;

  const buildMock = (overrides?: Partial<ChartLabelProps>): void => {
    const props: ChartLabelProps = {
      x: { value: 'foo' },
      y: [{ value: 'bar' }],
      aggregation: 'count',
      rollingWindow: '4',
      ...overrides,
    };
    result = render(<ChartLabel {...props} />).container;
  };

  it('ChartLabel rendering', () => {
    buildMock();
    expect(result.textContent).toBe('Count of bar by foo');
  });

  it('includes rolling computation in label', () => {
    buildMock({
      aggregation: 'rolling',
      rollingComputation: 'corr',
      rollingWindow: '10',
    });
    expect(result.textContent).toBe('Rolling Correlation (window: 10) of bar by foo');
  });

  it('includes group in label', () => {
    buildMock({ group: [{ value: 'z' }] });
    expect(result.textContent).toBe('Count of bar by foo grouped by z');
  });
});
