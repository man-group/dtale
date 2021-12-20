import { mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import DimensionsHelper from '../DimensionsHelper';
import mockPopsicle from '../MockPopsicle';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';
import { clickColMenuButton, openColMenu, validateHeaders } from './iframe-utils';

describe('DataViewer iframe tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let result, DataViewer, Confirmation, postSpy;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    mockPopsicle();
    DataViewer = require('../../dtale/DataViewer').DataViewer;
    Confirmation = require('../../popups/Confirmation').default;
  });

  beforeEach(async () => {
    const fetcher = require('../../fetcher');
    postSpy = jest.spyOn(fetcher, 'fetchPost');
    postSpy.mockImplementation((_url, _params, callback) => callback());
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True' }, store);
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

  afterEach(() => postSpy.mockRestore());

  afterAll(() => dimensions.afterAll());

  it('DataViewer: deleting a column', async () => {
    await openColMenu(result, 3);
    await clickColMenuButton(result, 'Delete');
    result.find(Confirmation).find('div.modal-footer').find('button').first().simulate('click');
    await tickUpdate(result);
    validateHeaders(result, ['col1', 'col2', 'col3']);
  });
});
