import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';

import DimensionsHelper from '../DimensionsHelper';
import mockPopsicle from '../MockPopsicle';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result, DataViewer, ReactDataViewer, store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    mockPopsicle((url) => {
      if (url === '/dtale/data/1?ids=%5B%22100-101%22%5D') {
        return { error: 'No data found' };
      }
      return undefined;
    });

    const dv = require('../../dtale/DataViewer');
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
  });

  beforeEach(async () => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content'),
      },
    );

    await tickUpdate(result);
  });

  afterAll(dimensions.afterAll);

  const dataViewer = () => result.find(ReactDataViewer).instance();

  it('DataViewer: handles an update to columnsToToggle', async () => {
    store.dispatch({
      type: 'data-viewer-update',
      update: { type: 'toggle-columns', columns: { col1: false } },
    });
    result.update();
    expect(_.find(dataViewer().state.columns, { name: 'col1' }).visible).toBe(false);
  });
});
