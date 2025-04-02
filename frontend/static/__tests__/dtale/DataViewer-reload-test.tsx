import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import * as serverState from '../../dtale/serverStateManagement';
import { AppActions } from '../../redux/actions/AppActions';
import * as DataRepository from '../../repository/DataRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as any as jest.Mock;

describe('DataViewer tests', () => {
  let container: HTMLElement;
  const mockDispatch = jest.fn();
  let store: Store;
  let loadDataSpy: jest.SpyInstance;
  let loadFilteredRangesSpy: jest.SpyInstance;
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
        if (calls === 4) {
          return Promise.resolve({ data: { error: 'No data found' } });
        }
        return Promise.resolve({ data: { ...reduxUtils.DATA, total: 200, final_query: `foo == ${calls}` } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    loadDataSpy = jest.spyOn(DataRepository, 'load');
    loadFilteredRangesSpy = jest.spyOn(serverState, 'loadFilteredRanges');
    store = reduxUtils.createDtaleStore();
  });

  const buildContainer = async (hiddenProps?: Record<string, string>): Promise<void> => {
    buildInnerHTML({ settings: '', ...hiddenProps }, store);
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
  };

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: reloading data', async () => {
    await buildContainer();
    await act(() => {
      store.dispatch(AppActions.UpdateSettingsAction({ ...store.getState().settings, idx: 1 }));
    });
    await act(() => {
      store.dispatch(AppActions.UpdateSettingsAction({ ...store.getState().settings, idx: 2 }));
    });
    expect(loadDataSpy.mock.calls).toEqual([
      ['1', { ids: '["0-55"]' }],
      ['1', { ids: '["5-73"]' }],
      ['1', { ids: '["0-73"]' }],
      ['1', { ids: '["0-73"]' }],
    ]);
    loadDataSpy.mockClear();

    const scrollContainer = container.getElementsByClassName('ReactVirtualized__Grid__innerScrollContainer')[0];
    await act(async () => {
      await fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
    });
    await act(async () => {
      await fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
    });
    await act(async () => {
      await fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
    });
    expect(screen.getByRole('alert')).toBeDefined();
    // last call to dispatch should be for updateFilteredRanges
    await act(async () => {
      await mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1][0](store.dispatch, store.getState);
    });
    expect(loadFilteredRangesSpy).toHaveBeenCalled();
  });
});
