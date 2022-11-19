import { createEvent, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('RibbonDropdown', () => {
  let container: HTMLElement;
  let rerender: (ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => void;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;

  const buildMock = (
    props?: GridEventHandlerProps,
    state?: { [key: string]: any },
    children?: React.ReactNode,
    useRerender = false,
  ): void => {
    store = mockStore({
      allowCellEdits: true,
      dataId: '1',
      ribbonMenuOpen: false,
      menuPinned: false,
      ribbonDropdown: { visible: false },
      sidePanel: { visible: false },
      dragResize: null,
      rangeSelect: null,
      rowRange: null,
      ctrlRows: null,
      settings: {},
      ...state,
    });
    if (useRerender) {
      rerender(
        <Provider store={store}>
          <GridEventHandler {...{ columns: [], data: {}, ...props }}>{children}</GridEventHandler>
        </Provider>,
      );
    } else {
      const result = render(
        <Provider store={store}>
          <GridEventHandler {...{ columns: [], data: {}, ...props }}>{children}</GridEventHandler>
        </Provider>,
      );
      container = result.container;
      rerender = result.rerender;
    }
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
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
    const mainPanel = container.getElementsByClassName('main-panel-content')[0];
    const myEvent = createEvent.mouseMove(mainPanel, { clientY: 5 });
    fireEvent(mainPanel, myEvent);

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][0]();
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.SHOW_RIBBON_MENU });
    setTimeoutSpy.mockRestore();
  });

  it('hides ribbon menu outside of first 45 pixels', async () => {
    await buildMock(undefined, { ribbonMenuOpen: true });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockImplementation((cb, ms) => ({} as NodeJS.Timeout));
    const mainPanel = container.getElementsByClassName('main-panel-content')[0];
    const myEvent = createEvent.mouseMove(mainPanel, { clientY: 45 });
    fireEvent(mainPanel, myEvent);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1][0]();
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    setTimeoutSpy.mockRestore();
  });

  it('does not hide ribbon menu when dropdown is open', async () => {
    buildMock(undefined, { ribbonMenuOpen: true, ribbonDropdown: { visible: true } });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockImplementation((cb, ms) => ({} as NodeJS.Timeout));
    const mainPanel = container.getElementsByClassName('main-panel-content')[0];
    const myEvent = createEvent.mouseMove(mainPanel, { clientY: 45 });
    await fireEvent(mainPanel, myEvent);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);
    setTimeoutSpy.mockRestore();
  });

  it('displays blue-line correctly', () => {
    buildMock(undefined, { dragResize: 5 });
    expect(container.getElementsByClassName('blue-line')).toHaveLength(1);
  });

  it('hides tooltip when cellIdx is empty', async () => {
    buildMock(undefined, {}, <div className="cell" {...{ cell_idx: '1|2' }} />, true);
    const cell = container.getElementsByClassName('cell')[0];
    const target: any = { querySelector: () => ({ clientWidth: 100, scrollWidth: 100 }) };
    const myEvent = createEvent.mouseOver(cell, { clientY: 100, target } as any as Event);
    await fireEvent(cell, myEvent);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('shows tooltip when cellIdx is populated', async () => {
    const columns: ColumnDef[] = [
      mockColumnDef({ name: 'index', visible: true }),
      mockColumnDef({ name: 'a', dtype: 'string', index: 1, visible: true }),
    ];
    const data: DataViewerData = { 0: { a: { raw: 'Hello World', view: 'Hello World' } } };
    buildMock({ columns, data }, {}, <div className="cell" {...{ cell_idx: '0|1' }} />, true);
    let cell = container.getElementsByClassName('cell')[0];
    let myEvent = createEvent.mouseOver(cell);
    fireEvent(cell, myEvent);
    expect(mockDispatch).not.toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    buildMock({ columns, data }, {}, <div className="cell" {...{ cell_idx: '1|1' }} />, true);
    cell = container.getElementsByClassName('cell')[0];
    myEvent = createEvent.mouseOver(cell, { target: { querySelector: () => undefined } });
    fireEvent(cell, myEvent);
    expect(mockDispatch).not.toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    const childDiv = { clientWidth: 100, scrollWidth: 150 };
    myEvent = createEvent.mouseOver(cell, { target: { querySelector: () => childDiv } });
    fireEvent(cell, myEvent);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ActionType.SHOW_MENU_TOOLTIP,
      element: childDiv,
      content: 'Hello World',
    });
  });

  it('selects row on click of index', async () => {
    buildMock(undefined, {}, <div className="cell" {...{ cell_idx: '0|1' }} />, true);
    const cell = container.getElementsByClassName('cell')[0];
    const myEvent = createEvent.click(cell);
    fireEvent(cell, myEvent);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: ActionType.SET_RANGE_STATE, selectedRow: 1 }),
    );
  });
});
