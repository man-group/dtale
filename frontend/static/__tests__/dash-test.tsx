import { render } from '@testing-library/react';
import * as React from 'react';

import chartsData from './data/charts.json';
import { mockWordcloud } from './test-utils';

describe('dash tests', () => {
  beforeAll(mockWordcloud);

  it('dash rendering', () => {
    const { Wordcloud } = require('../dash/lib');
    render(<Wordcloud id="wc-test" data={chartsData} y={['col1']} />);
    expect(document.getElementById('wc-test')).toBeDefined();
  });
});
