import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ActionType } from '../../redux/actions/AppActions';
import { DataViewerUpdateType } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DataViewer tests', () => {
  const mockDispatch = jest.fn();
  let store: Store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    (axios.get as any).mockImplementation((url: string) => {
      if (url === '/dtale/data/1?ids=%5B%22100-101%22%5D') {
        return Promise.resolve({ data: { error: 'No data found' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    await act(() =>
      render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      ),
    );
  });

  afterAll(() => dimensions.afterAll());

  it('DataViewer: handles an update to columnsToToggle', async () => {
    expect([...screen.queryAllByTestId('header-cell')].map((h) => h.textContent?.trim())).toEqual([
      'col1⋮',
      'col2⋮',
      'col3⋮',
      'col4⋮',
    ]);
    await act(() => {
      store.dispatch({
        type: ActionType.DATA_VIEWER_UPDATE,
        update: { type: DataViewerUpdateType.TOGGLE_COLUMNS, columns: { col1: false } },
      });
    });
    expect([...screen.queryAllByTestId('header-cell')].map((h) => h.textContent?.trim())).toEqual([
      'col2⋮',
      'col3⋮',
      'col4⋮',
    ]);
  });
});
