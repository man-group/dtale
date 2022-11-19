import { act, createEvent, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

jest.mock('../../../dtale/menu/MaxDimensionOption', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    MaxHeightOption: createMockComponent(),
    MaxWidthOption: createMockComponent(),
  };
});

import * as menuFuncs from '../../../dtale/menu/dataViewerMenuUtils';
import RibbonDropdown, { RibbonDropdownProps } from '../../../dtale/ribbon/RibbonDropdown';
import { ActionType } from '../../../redux/actions/AppActions';
import { RibbonDropdownType, SidePanelType } from '../../../redux/state/AppState';
import * as InstanceRepository from '../../../repository/InstanceRepository';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('RibbonDropdown', () => {
  let wrapper: RenderResult;
  let store: Store;
  let element: HTMLElement;
  const mockDispatch = jest.fn();
  let props: RibbonDropdownProps;
  let cleanupSpy: jest.SpyInstance;
  const processes = [{ id: '2', name: 'foo' }, { id: '3' }];
  const { location, open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });

  const setupElementAndDropdown = async (name: RibbonDropdownType, dims?: Partial<DOMRect>): Promise<void> => {
    const rectSpy = jest.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect');
    rectSpy.mockImplementation(() => ({ left: 5, top: 5, width: 10, ...dims } as DOMRect));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', predefinedFilters: PREDEFINED_FILTERS }, store);
    element = { getBoundingClientRect: () => ({ left: 5, top: 5, width: 10, ...dims } as DOMRect) } as HTMLElement;
    store.dispatch({ type: ActionType.OPEN_RIBBON_DROPDOWN, name, element });
    wrapper = await act(async (): Promise<RenderResult> => {
      const result = render(
        <Provider store={store}>
          <RibbonDropdown {...props} />
        </Provider>,
        {
          container: document.getElementById('content') as HTMLElement,
        },
      );
      return result;
    });
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    dimensions.beforeAll();
    delete (window as any).location;
    delete (window as any).open;
    window.open = jest.fn();
    (window as any).location = { reload: jest.fn() };
    cleanupSpy = jest.spyOn(InstanceRepository, 'cleanupInstance');
    cleanupSpy.mockResolvedValue({ success: true });
    const loadProcessKeysSpy = jest.spyOn(InstanceRepository, 'loadProcessKeys');
    loadProcessKeysSpy.mockResolvedValue({ data: processes, success: true });
    props = {
      columns: [],
      rows: 10,
      propagateState: jest.fn(),
    };
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    jest.restoreAllMocks();
  });

  it('renders successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    expect(wrapper.container.getElementsByTagName('div')).toHaveLength(1);
  });

  it('stops propagation on clicks', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    const event = createEvent.click(wrapper.container.getElementsByTagName('div')[0]);
    await act(() => {
      fireEvent(wrapper.container.getElementsByTagName('div')[0], event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders main successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    expect(screen.queryAllByTestId('data-menu-item')).toHaveLength(processes.length);
    expect(wrapper.container.getElementsByTagName('div')[0]).toHaveStyle({ left: '5px', top: '30px' });
    await act(() => {
      store.dispatch({ type: ActionType.OPEN_RIBBON_DROPDOWN, name: undefined, element: undefined });
    });
    expect(wrapper.container.getElementsByTagName('div')[0].getAttribute('style')).toBe('');
  });

  it('handles screen edge successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN, { left: 450, width: 100 });
    expect(wrapper.container.getElementsByTagName('div')[0]).toHaveStyle({ left: '380px', top: '30px' });
  });

  it('can clear current data', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await act(async () => {
      fireEvent.click(screen.queryAllByTestId('menu-item')[5]);
    });
    expect(cleanupSpy).toBeCalledWith('1');
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('can clear other data', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await act(async () => {
      fireEvent.click(screen.queryAllByTestId('data-menu-item-cleanup')[0]);
    });
    expect(cleanupSpy).toBeCalledWith('2');
    expect(screen.queryAllByTestId('data-menu-item')).toHaveLength(0);
  });

  it('renders actions successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.ACTIONS);
    expect(wrapper.container.getElementsByTagName('ul')).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByText('show_hide'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.SHOW_HIDE });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      fireEvent.click(screen.getByText('Custom Filter'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.FILTER });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      fireEvent.click(screen.getByText('Predefined Filters'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SHOW_SIDE_PANEL,
      view: SidePanelType.PREDEFINED_FILTERS,
    });
  });

  it('renders visualize successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.VISUALIZE);
    expect(wrapper.container.getElementsByTagName('ul')).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByText('Missing Analysis'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.MISSINGNO });
    await act(async () => {
      fireEvent.click(screen.getByText('Correlations'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.CORRELATIONS });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      fireEvent.click(screen.getByText('Predictive Power Score'));
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.PPS });
    expect(mockDispatch.mock.calls.filter((call) => call[0].type === ActionType.HIDE_RIBBON_MENU)).toHaveLength(3);
  });

  it('renders highlight successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.HIGHLIGHT);
    expect(wrapper.container.getElementsByTagName('ul')).toHaveLength(1);
  });

  it('renders settings successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.SETTINGS);
    expect(wrapper.container.getElementsByTagName('ul')).toHaveLength(1);
  });

  it('hides menu on click', async () => {
    const funcsSpy = jest.spyOn(menuFuncs, 'buildHotkeyHandlers');
    funcsSpy.mockImplementation(() => ({
      openTab: jest.fn(),
      openPopup: jest.fn(),
      toggleBackground: jest.fn(),
      toggleOutlierBackground: jest.fn(),
      CODE: jest.fn(),
      SHUTDOWN: jest.fn(),
      BUILD: jest.fn(),
      FILTER: jest.fn(),
      DESCRIBE: jest.fn(),
      DUPLICATES: jest.fn(),
      CHARTS: jest.fn(),
      NETWORK: jest.fn(),
      MENU: jest.fn(),
      CLEAN: jest.fn(),
      ABOUT: jest.fn(),
      LOGOUT: jest.fn(),
    }));
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await act(async () => {
      store.dispatch({ type: ActionType.OPEN_RIBBON_DROPDOWN, name: RibbonDropdownType.ACTIONS, element });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Merge & Stack'));
    });
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/merge', '_blank');
    expect(mockDispatch.mock.calls.filter((call) => call[0].type === ActionType.HIDE_RIBBON_MENU)).toHaveLength(1);
  });
});
