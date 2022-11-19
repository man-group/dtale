import { render } from '@testing-library/react';
import * as React from 'react';

import { RemovableError } from '../RemovableError';

describe('RemovableError tests', () => {
  it('RemovableError Remove null onRemove', () => {
    const result = render(<RemovableError error="foo" />).container;
    expect(result.getElementsByClassName('ico-cancel')).toHaveLength(0);
    expect(result.getElementsByTagName('pre')).toHaveLength(0);
    expect(result.textContent).toBe('foo');
  });
});
