import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import RibbonMenu from '../../../dtale/ribbon/RibbonMenu';
import { ActionType, AppActions } from '../../../redux/actions/AppActions';
import { RibbonDropdownType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as any as jest.Mock;

describe('RibbonMenu', () => {
  let wrapper: RenderResult;
  let store: Store;
  const mockDispatch = jest.fn();

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  const buildMock = async (overrides?: Record<string, string>): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', ...overrides }, store);
    store.dispatch(AppActions.ShowRibbonMenuAction());
    wrapper = await act(async (): Promise<RenderResult> => {
      const result = render(
        <Provider store={store}>
          <RibbonMenu />
        </Provider>,
        { container: document.getElementById('content') as HTMLElement },
      );
      return result;
    });
  };

  it('renders successfully', async () => {
    await buildMock();
    expect(wrapper.container.getElementsByClassName('ribbon-menu-item')).toHaveLength(5);
  });

  it('activates hover on click of item & opens dropdown', async () => {
    await buildMock();
    await act(async () => {
      fireEvent.click(screen.getByText('D-TALE'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: ActionType.OPEN_RIBBON_DROPDOWN,
        payload: expect.objectContaining({ name: RibbonDropdownType.MAIN }),
      }),
    );
  });

  it('opens dropdown when hover is active', async () => {
    await buildMock();
    await act(async () => {
      fireEvent.click(screen.getByText('D-TALE'));
    });
    await act(async () => {
      fireEvent.mouseOver(screen.getByText('Settings'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: ActionType.OPEN_RIBBON_DROPDOWN,
        payload: expect.objectContaining({ name: RibbonDropdownType.SETTINGS }),
      }),
    );
  });

  it('turns off hover when menu closes', async () => {
    await buildMock();
    await act(async () => {
      fireEvent.click(screen.getByText('D-TALE'));
    });
    await act(() => {
      store.dispatch(AppActions.HideRibbonMenuAction());
    });
    mockDispatch.mockReset();
    await act(async () => {
      fireEvent.mouseOver(screen.getByText('D-TALE'));
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('sets main title font', async () => {
    await buildMock({ mainTitleFont: 'Arial' });
    const title = wrapper.container.querySelector('span.title-font-base');
    expect(title).toHaveClass('title-font-base');
    expect(title).toHaveStyle({ 'font-family': 'Arial' });
  });

  it('shows menu when lock_header_menu is true', async () => {
    await buildMock({ lockHeaderMenu: 'True' });
    expect(wrapper.container.getElementsByClassName('ribbon-menu-item')).toHaveLength(5);
  });

  it('hides menu when hide_header_menu is true', async () => {
    await buildMock({ hideHeaderMenu: 'True' });
    expect(wrapper.container.getElementsByClassName('ribbon-menu-content')).toHaveLength(0);
  });
});
