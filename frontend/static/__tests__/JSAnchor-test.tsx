import { shallow } from 'enzyme';
import * as React from 'react';

import { JSAnchor } from '../JSAnchor';

describe('JSAnchor tests', () => {
  it('JSAnchor click test', () => {
    const clicks = [];
    const result = shallow(
      <JSAnchor onClick={() => clicks.push(1)}>
        <span>Hello</span>
      </JSAnchor>,
    );
    result.render();
    result
      .find('a')
      .props()
      .onClick?.({ preventDefault: () => undefined } as React.MouseEvent);
    expect(clicks.length).toBe(1);
  });

  it('JSAnchor no-click test', () => {
    const result = shallow(
      <JSAnchor>
        <span>Hello</span>
      </JSAnchor>,
    );
    result.render();
    result
      .find('a')
      .props()
      .onClick?.({ preventDefault: () => undefined } as React.MouseEvent);
  });
});
