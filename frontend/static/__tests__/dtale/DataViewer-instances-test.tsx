import axios from 'axios';
import { mount } from 'enzyme';
import * as React from 'react';
import Modal from 'react-bootstrap/Modal';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import Instances from '../../popups/instances/Instances';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: instances', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideShutdown: 'True', processes: '2' }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await tick();
    await clickMainMenuButton(result, 'Instances');
    await tickUpdate(result);
    expect(result.find(Instances).length).toBe(1);
    result.find(Modal.Header).first().find('button').simulate('click');
    expect(result.find(Instances).length).toBe(0);
  });
});
