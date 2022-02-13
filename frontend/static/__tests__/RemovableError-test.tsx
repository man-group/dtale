import { mount } from 'enzyme';
import * as React from 'react';

import { RemovableError } from '../RemovableError';

describe('RemovableError tests', () => {
  it('RemovableError Remove null onRemove', () => {
    const result = mount(<RemovableError error="foo" />);
    result.render();
    expect(result.hasClass('fa-times-circle')).toBe(false);
  });
});
