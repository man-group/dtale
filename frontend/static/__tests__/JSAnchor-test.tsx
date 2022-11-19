import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { JSAnchor } from '../JSAnchor';

describe('JSAnchor tests', () => {
  it('JSAnchor click test', () => {
    const clicks = [];
    const result = render(
      <JSAnchor onClick={() => clicks.push(1)}>
        <span>Hello</span>
      </JSAnchor>,
    ).container;
    fireEvent.click(result.getElementsByTagName('a')[0]);
    expect(clicks.length).toBe(1);
  });

  it('JSAnchor no-click test', () => {
    const result = render(
      <JSAnchor>
        <span>Hello</span>
      </JSAnchor>,
    ).container;
    fireEvent.click(result.getElementsByTagName('a')[0]);
  });
});
