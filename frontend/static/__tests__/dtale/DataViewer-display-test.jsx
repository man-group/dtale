import { mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import DimensionsHelper from '../DimensionsHelper';
import mockPopsicle from '../MockPopsicle';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result, DataViewer, ReactDataViewer;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    mockPopsicle();

    const dv = require('../../dtale/DataViewer');
    DataViewer = dv.DataViewer;
    ReactDataViewer = dv.ReactDataViewer;
  });

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', theme: 'dark' }, store);
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

  it('DataViewer: loads dark mode correct on inital render', async () => {
    expect(dataViewer().props.theme).toBe('dark');
    expect(dataViewer().state.styleBottomLeftGrid).toMatchObject({
      backgroundColor: 'inherit',
    });
  });

  it('DataViewer: toggle dark mode', async () => {
    const ReactThemeOption = require('../../dtale/menu/ThemeOption').ReactThemeOption;
    result.find(ReactThemeOption).find('button').first().simulate('click');
    await tickUpdate(result);
    expect(dataViewer().props.theme).toBe('light');
    await tickUpdate(result);
    expect(dataViewer().state.styleBottomLeftGrid).toMatchObject({
      backgroundColor: '#f7f7f7',
    });
  });
});
