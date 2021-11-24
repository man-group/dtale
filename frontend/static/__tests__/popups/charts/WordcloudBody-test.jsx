import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';

import mockPopsicle from '../../MockPopsicle';
import { mockChartJS, mockD3Cloud } from '../../test-utils';

describe('WordcloudBody tests', () => {
  let WordcloudBody;
  beforeAll(() => {
    mockPopsicle((url) => {
      if (_.startsWith(url, 'chart-data-error-test1')) {
        return { data: {} };
      }
      if (_.startsWith(url, 'chart-data-error-test2')) {
        return { error: 'Error test.' };
      }
      return undefined;
    });

    mockChartJS();
    mockD3Cloud();

    WordcloudBody = require('../../../popups/charts/WordcloudBody').default;
  });

  it('WordcloudBody missing data', () => {
    const result = mount(<WordcloudBody chartType={{ value: 'wordcloud' }} data={{}} />, {
      attachTo: document.getElementById('content'),
    });
    result.update();
    expect(result.html()).toBe('<div class="row"></div>');
  });

  it('WordcloudBody invalid chartType type', () => {
    const result = mount(<WordcloudBody chartType={{ value: 'bar' }} data={{}} />, {
      attachTo: document.getElementById('content'),
    });
    result.update();
    expect(result.html()).toBeNull();
  });

  it('WordcloudBody missing yProp data', () => {
    const result = mount(
      <WordcloudBody chartType={{ value: 'wordcloud' }} y={[{ value: 'foo' }]} data={{ bar: [1, 2, 3] }} />,
      {
        attachTo: document.getElementById('content'),
      },
    );
    result.update();
    expect(result.html()).toBe('<div class="row"></div>');
  });
});
