import { act, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import * as serverState from '../../dtale/serverStateManagement';
import { AppActions } from '../../redux/actions/AppActions';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as any as jest.Mock;

describe('DataViewer tests', () => {
  const mockDispatch = jest.fn();
  let store: Store;
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
    loadFilteredRangesSpy = jest.spyOn(serverState, 'loadFilteredRanges');
    store = reduxUtils.createDtaleStore();
  });

  const buildContainer = async (hiddenProps?: Record<string, string>): Promise<void> => {
    buildInnerHTML({ settings: '', ...hiddenProps }, store);
    await act(() => {
      render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      );
    });
  };

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: reloading data w/ large ArcticDB', async () => {
    await buildContainer({ isArcticDB: '3000000' });
    await act(() => {
      store.dispatch(AppActions.UpdateSettingsAction({ ...store.getState().settings, idx: 1 }));
    });
    await act(() => {
      store.dispatch(AppActions.UpdateSettingsAction({ ...store.getState().settings, idx: 2 }));
    });

    // last call to dispatch should be for updateFilteredRanges
    await act(async () => {
      await mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1][0](store.dispatch, store.getState);
    });
    expect(loadFilteredRangesSpy).not.toHaveBeenCalled();
  });
});
