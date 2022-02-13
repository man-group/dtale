import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { MultiGrid } from 'react-virtualized';

import { DataViewer } from '../../dtale/DataViewer';
import Formatting from '../../popups/formats/Formatting';
import { RemovableError } from '../../RemovableError';
import * as DataRepository from '../../repository/DataRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let loadDataSpy: jest.SpyInstance;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url === '/dtale/data/1?ids=%5B%22100-101%22%5D') {
        return Promise.resolve({ data: { error: 'No data found' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    loadDataSpy = jest.spyOn(DataRepository, 'load');
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    return result.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const dataViewer = (): ReactWrapper => result.find(DataViewer);

  it('DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...', async () => {
    await act(async () => {
      dataViewer().find(Formatting).props().propagateState({ refresh: true });
    });
    await act(async () => {
      dataViewer().find(Formatting).props().propagateState({ refresh: true });
    });
    result = result.update();
    expect(loadDataSpy.mock.calls).toEqual([
      ['1', { ids: '["0-55"]' }],
      ['1', { ids: '["0-55"]' }],
      ['1', { ids: '["0-55"]' }],
    ]);
    loadDataSpy.mockClear();
    await act(async () => {
      dataViewer()
        .find(MultiGrid)
        .props()
        .onSectionRendered({ rowStartIndex: 0, rowStopIndex: 55, columnStartIndex: 0, columnStopIndex: 10 });
    });
    result = result.update();
    await act(async () => {
      dataViewer()
        .find(MultiGrid)
        .props()
        .onSectionRendered({ rowStartIndex: 0, rowStopIndex: 3, columnStartIndex: 0, columnStopIndex: 10 });
    });
    result = result.update();
    await act(async () => {
      dataViewer()
        .find(MultiGrid)
        .props()
        .onSectionRendered({ rowStartIndex: 100, rowStopIndex: 101, columnStartIndex: 0, columnStopIndex: 10 });
    });
    result = result.update();
    expect(loadDataSpy.mock.calls).toEqual([['1', { ids: '["100-101"]' }]]);
    expect(result.find(RemovableError).length).toBe(1);
  });
});
