import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';

import { default as ChartLabel, ChartLabelProps } from '../../../popups/charts/ChartLabel';

describe('ChartLabel tests', () => {
  let result: ShallowWrapper;

  beforeEach(() => {
    const props: ChartLabelProps = {
      x: { value: 'foo' },
      y: [{ value: 'bar' }],
      aggregation: 'count',
      rollingWindow: '4',
    };
    result = shallow(<ChartLabel {...props} />);
  });

  it('ChartLabel rendering', () => {
    expect(result.text()).toBe('Count of bar by foo');
  });

  it('includes rolling computation in label', () => {
    result.setProps({
      aggregation: 'rolling',
      rollingComputation: 'corr',
      rollingWindow: 10,
    });
    expect(result.text()).toBe('Rolling Correlation (window: 10) of bar by foo');
  });

  it('includes group in label', () => {
    result.setProps({ group: [{ value: 'z' }] });
    expect(result.text()).toBe('Count of bar by foo grouped by z');
  });
});
