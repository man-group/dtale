import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';

import mockPopsicle from '../../MockPopsicle';
import { mockChartJS, mockD3Cloud, tickUpdate } from '../../test-utils';

describe('ChartsBody tests', () => {
  let result, ChartsBody;

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

    ChartsBody = require('../../../popups/charts/ChartsBody').default;
  });

  const mountChart = async (props) => {
    result = mount(<ChartsBody {...props} visible={true} />, {
      attachTo: document.getElementById('content'),
    });
    await tickUpdate(result);
  };

  it('handles missing data', async () => {
    await mountChart({ url: 'chart-data-error-test1' });
    expect(_.includes(result.html(), 'No data found.')).toBe(true);
  });

  it('handles errors', async () => {
    await mountChart({ url: 'chart-data-error-test2' });
    expect(_.includes(result.html(), 'Error test.')).toBe(true);
    result.setProps({ visible: false });
    expect(result.html()).toBeNull();
  });
});
