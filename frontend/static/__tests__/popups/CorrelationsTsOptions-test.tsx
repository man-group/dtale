import { mount } from 'enzyme';
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
    const result = mount(<CorrelationsTsOptions {...props} />);
    result.render();
    expect(result.html()).toBeNull();
  });

  it('CorrelationsTsOptions selectedCols empty', () => {
    const result = mount(<CorrelationsTsOptions {...{ ...props, hasDate: true }} />);
    result.render();
    expect(result.html()).toBeNull();
  });
});
