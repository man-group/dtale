import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import DataMenuItem, { DataMenuItemProps } from '../../../dtale/ribbon/DataMenuItem';
import { ActionType } from '../../../redux/actions/AppActions';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DataMenuItem', () => {
  let wrapper: RenderResult;
  let props: DataMenuItemProps;
  const { location } = window;
  const mockStore = configureStore();
  let store: Store;
  const mockDispatch = jest.fn();

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    delete (window as any).location;
    (window as any).location = {
      assign: jest.fn(),
      origin: 'origin',
    };
    props = {
      id: '1',
      name: 'foo',
      cleanup: jest.fn(),
    };
    store = mockStore({ dataId: '1', iframe: false });
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <DataMenuItem {...props} />
        </Provider>,
      );
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    window.location = location;
    jest.restoreAllMocks();
  });

  it('correctly calls show/hide tooltip on button', async () => {
    const button = wrapper.container.getElementsByTagName('button')[0];
    await act(() => {
      fireEvent.mouseOver(button);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    await act(() => {
      fireEvent.mouseLeave(button);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('correctly calls show/hide tooltip on icon', async () => {
    const icon = wrapper.container.getElementsByTagName('i')[0];
    await act(() => {
      fireEvent.mouseOver(icon);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    await act(() => {
      fireEvent.mouseLeave(icon);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('correctly updates view', async () => {
    await act(() => {
      fireEvent.click(wrapper.container.getElementsByTagName('button')[0]);
    });
    expect(window.location.assign).toHaveBeenCalledWith('origin/dtale/main/1');
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
  });

  it('correctly clears data', async () => {
    await act(() => {
      fireEvent.click(wrapper.container.getElementsByTagName('i')[0]);
    });
    expect(props.cleanup).toHaveBeenCalledWith('1');
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
  });

  it('renders data name', () => {
    expect(wrapper.container.getElementsByTagName('button')[0].textContent).toBe('1 - foo');
  });
});
