import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import { SidePanel } from '../../../dtale/side/SidePanel';
import { ActionType } from '../../../redux/actions/AppActions';
import { SidePanelType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('SidePanel', () => {
  let wrapper: RenderResult;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;

  const setupMock = async (state?: { [key: string]: any }): Promise<void> => {
    store = mockStore({ dataId: '1', settings: {}, predefinedFilters: [], sidePanel: { visible: false, ...state } });
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <SidePanel gridPanel={document.createElement('div')} />
        </Provider>,
      );
    });
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.clearAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', async () => {
    await setupMock();
    expect(wrapper.container.getElementsByClassName('side-panel-content')).toHaveLength(1);
    expect(wrapper.container.getElementsByClassName('side-panel-content')[0].children).toHaveLength(0);
  });

  it('shows missing charts', async () => {
    await setupMock({ visible: true, view: SidePanelType.MISSINGNO });
    expect(wrapper.container.querySelectorAll('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.container.getElementsByClassName('row')[0].textContent).toBe('Missing Analysis');
  });

  it('shows Gage R&R', async () => {
    await setupMock({ visible: true, view: SidePanelType.GAGE_RNR });
    expect(wrapper.container.querySelectorAll('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.container.getElementsByClassName('row')[0].textContent).toBe('gage_rnr');
  });

  it('shows predefined filters', async () => {
    await setupMock({ visible: true, view: SidePanelType.PREDEFINED_FILTERS });
    expect(wrapper.container.querySelectorAll('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.container.getElementsByClassName('row')[0].textContent).toBe('Predefined Filters');
  });

  it('hides side panel on ESC', async () => {
    await setupMock({ visible: true });
    await fireEvent.keyDown(wrapper.container, { keyCode: 27 });
    await fireEvent.keyUp(wrapper.container, { keyCode: 27 });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  it('handles resize', async () => {
    await setupMock({ visible: true });
    const handle = wrapper.container.getElementsByClassName('PanelDragHandle')[0];
    fireEvent.mouseDown(handle, { clientX: 30, clientY: 20 });
    fireEvent.mouseMove(handle, { clientX: 10, clientY: 20 });
    fireEvent.mouseUp(handle);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.UPDATE_SIDE_PANEL_WIDTH, offset: -20 });
  });
});
