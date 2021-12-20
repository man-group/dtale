import axios from 'axios';
import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer, ReactDataViewer } from '../../../dtale/DataViewer';
import { ReactGridEventHandler } from '../../../dtale/GridEventHandler';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  const execCommandMock = jest.fn();

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, 'execCommand', { value: execCommandMock });
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    execCommandMock.mockReset();
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  it('DataViewer: row ctrl selection', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store as any);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
    const instance = result.find(ReactGridEventHandler).instance() as typeof ReactGridEventHandler.prototype;
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
      ctrlKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.ctrlRows).toEqual([1]);
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
      ctrlKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.ctrlRows).toEqual([1, 2]);
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
      ctrlKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.ctrlRows).toEqual([2]);
  });
});
