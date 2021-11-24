import { mount } from 'enzyme';
import React from 'react';

import chartsData from './data/charts.json';
import { mockWordcloud } from './test-utils';

describe('dash tests', () => {
  beforeAll(mockWordcloud);

  it('dash rendering', () => {
    const { Wordcloud } = require('../dash/lib');
    const result = mount(<Wordcloud id="wc-test" data={chartsData} y={['col1']} />);
    expect(result.find('CustomMockComponent').length).toBe(1);
  });
});
