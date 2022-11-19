import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ActionType } from '../../redux/actions/AppActions';
import * as DataRepository from '../../repository/DataRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DataViewer tests', () => {
  let container: HTMLElement;
  const mockDispatch = jest.fn();
  let store: Store;
  let loadDataSpy: jest.SpyInstance;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let calls = 0;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/data')) {
        calls++;
        if (calls === 3) {
          return Promise.resolve({ data: { error: 'No data found' } });
        }
        return Promise.resolve({ data: { ...reduxUtils.DATA, total: 200 } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    loadDataSpy = jest.spyOn(DataRepository, 'load');
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    await act(() => {
      const result = render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      );

      container = result.container;
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...', async () => {
    await act(() => {
      store.dispatch({
        type: ActionType.UPDATE_SETTINGS,
        settings: { ...store.getState().settings, idx: 1 },
      });
    });
    await act(() => {
      store.dispatch({
        type: ActionType.UPDATE_SETTINGS,
        settings: { ...store.getState().settings, idx: 2 },
      });
    });
    expect(loadDataSpy.mock.calls).toEqual([
      ['1', { ids: '["0-55"]' }],
      ['1', { ids: '["0-55"]' }],
      ['1', { ids: '["0-55"]' }],
    ]);
    loadDataSpy.mockClear();

    const scrollContainer = container.getElementsByClassName('ReactVirtualized__Grid__innerScrollContainer')[0];
    await act(async () => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
    });
    await act(async () => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
    });
    await act(async () => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
    });
    expect(screen.getByRole('alert')).toBeDefined();
  });
});
