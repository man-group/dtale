import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import SidePanelButtons from '../../../dtale/side/SidePanelButtons';
import { ActionType } from '../../../redux/actions/AppActions';
import { SidePanelType } from '../../../redux/state/AppState';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('SidePanelButtons', () => {
  let wrapper: RenderResult;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;
  const openSpy = jest.fn();
  const { open } = window;

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    window.open = open;
    jest.restoreAllMocks();
  });

  const setupMock = async (state?: { [key: string]: any }): Promise<void> => {
    store = mockStore({ ...state });
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <SidePanelButtons />
        </Provider>,
      );
    });
  };

  it('add close/tab functions', async () => {
    await setupMock({ dataId: '1', sidePanel: { visible: true, column: 'foo', view: SidePanelType.DESCRIBE } });
    const buttons = wrapper.container.getElementsByTagName('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
    fireEvent.click(buttons[0]);
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/describe/1?selectedCol=foo', '_blank');
  });

  it('does not render when the side panel is not visible', async () => {
    await setupMock({ dataId: '1', sidePanel: { visible: false } });
    expect(wrapper.container.innerHTML).toBe('');
  });
});
