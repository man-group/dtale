import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import XArrayIndexes from '../../../popups/XArrayIndexes';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, tickUpdate } from '../../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let store: Store;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await tickUpdate(result);
    await clickMainMenuButton(result, 'Convert To XArray');
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('DataViewer: convert data to xarray dataset', async () => {
    await act(async () => {
      result
        .find(XArrayIndexes)
        .find('div.form-group')
        .first()
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    result.find('div.modal-footer').first().find('button').first().simulate('click');
    await tickUpdate(result);
    expect(store.getState().xarray).toBe(true);
  });
});
