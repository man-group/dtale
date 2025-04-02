import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ActionType } from '../../redux/actions/AppActions';
import * as actions from '../../redux/actions/dtale';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as any as jest.Mock;

describe('DataViewer tests', () => {
  let mockDispatch = jest.fn();
  let toggleColumnMenuSpy: jest.SpyInstance;
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
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    mockDispatch = jest.fn();
    useDispatchMock.mockImplementation(() => mockDispatch);
    toggleColumnMenuSpy = jest.spyOn(actions, 'toggleColumnMenu');
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideMainMenu: 'TRUE', hideColumnMenus: 'TRUE' }, store);
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

  it('DataViewer: hides main menu', async () => {
    expect(store.getState()).toMatchObject({ hideMainMenu: true, hideColumnMenus: true });
    expect(screen.getByTestId('main-menu-holder').textContent).toBe('');
    await act(async () => {
      await fireEvent.click(screen.getByTestId('main-menu-holder'));
    });
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: ActionType.OPEN_MENU });
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('header-cell')[0].firstElementChild!);
    });
    expect(toggleColumnMenuSpy).not.toHaveBeenCalled();
  });
});
