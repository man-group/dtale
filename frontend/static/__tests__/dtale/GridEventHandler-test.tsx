import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

jest.mock('../../dtale/menu/MenuTooltip', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return { MenuTooltip: createMockComponent() };
});
jest.mock('../../dtale/side/SidePanel', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return { SidePanel: createMockComponent() };
});

import { ColumnDef, DataViewerData } from '../../dtale/DataViewerState';
import GridEventHandler, { GridEventHandlerProps } from '../../dtale/GridEventHandler';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

describe('RibbonDropdown', () => {
  let wrapper: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  const buildMock = (props?: GridEventHandlerProps, state?: { [key: string]: any }): void => {
    useSelectorSpy.mockReturnValue({
      allowCellEdits: true,
      dataId: '1',
      ribbonMenuOpen: false,
      menuPinned: false,
      ribbonDropdownOpen: false,
      sidePanelOpen: false,
      dragResize: null,
      rangeSelect: null,
      rowRange: null,
      ctrlRows: null,
      settings: {},
      ...state,
    });
    wrapper = mount(<GridEventHandler {...{ columns: [], data: {}, ...props }} />);
  };

  beforeEach(() => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    jest.spyOn(global, 'addEventListener').mockImplementation(() => undefined);
    jest.spyOn(global, 'removeEventListener').mockImplementation(() => undefined);
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('opens ribbon menu for first 5 pixels', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockImplementation((cb, ms) => ({} as NodeJS.Timeout));
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseMove?.({ clientY: 5 } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][0]();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.SHOW_RIBBON_MENU });
    setTimeoutSpy.mockRestore();
  });

  it('hides ribbon menu outside of first 35 pixels', async () => {
    await buildMock(undefined, { ribbonMenuOpen: true });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockImplementation((cb, ms) => ({} as NodeJS.Timeout));
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseMove?.({ clientY: 45 } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][0]();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    setTimeoutSpy.mockRestore();
  });

  it('does not hide ribbon menu when dropdown is open', async () => {
    buildMock(undefined, { ribbonMenuOpen: true, ribbonDropdownOpen: true });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockImplementation((cb, ms) => ({} as NodeJS.Timeout));
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseMove?.({ clientY: 45 } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);
    setTimeoutSpy.mockRestore();
  });

  it('displays blue-line correctly', () => {
    buildMock(undefined, { dragResize: 5 });
    expect(wrapper.find('div.blue-line')).toHaveLength(1);
  });

  it('hides tooltip when cellIdx is empty', async () => {
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseOver?.({
          clientY: 100,
          target: {
            attributes: {
              cell_idx: {
                nodeValue: '1|2',
              },
            },
            querySelector: () => ({ clientWidth: 100, scrollWidth: 100 }),
          },
        } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('shows tooltip when cellIdx is populated', async () => {
    const columns: ColumnDef[] = [
      mockColumnDef({ name: 'index', visible: true }),
      mockColumnDef({ name: 'a', dtype: 'string', index: 1, visible: true }),
    ];
    const data: DataViewerData = { 0: { a: { raw: 'Hello World', view: 'Hello World' } } };
    buildMock({ columns, data });
    const target = { attributes: { cell_idx: { nodeValue: '0|1' } } } as any as HTMLElement;
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseOver?.({ target } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).not.toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    (target.attributes as any).cell_idx.nodeValue = '1|1';
    target.querySelector = () => undefined;
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseOver?.({ target } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).not.toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    const childDiv = { clientWidth: 100, scrollWidth: 150 };
    target.querySelector = () => childDiv;
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onMouseOver?.({ target } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: ActionType.SHOW_MENU_TOOLTIP,
      element: childDiv,
      content: 'Hello World',
    });
  });

  it('selects row on click of index', async () => {
    await act(async () => {
      wrapper
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
        } as any as React.MouseEvent);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: ActionType.SET_RANGE_STATE, selectedRow: 1 }),
    );
  });
});
