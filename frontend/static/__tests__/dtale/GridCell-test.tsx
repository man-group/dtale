import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import GridCell, { GridCellProps } from '../../dtale/GridCell';
import { MeasureText } from '../../dtale/MeasureText';
import * as serverState from '../../dtale/serverStateManagement';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { buildInnerHTML } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('GridCell', () => {
  let container: HTMLElement;
  let rerender: (ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => void;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;
  let props: GridCellProps;
  let editCellSpy: jest.SpyInstance;

  const buildMock = (
    propOverrides?: Partial<GridCellProps>,
    state?: { [key: string]: any },
    useRerender = false,
  ): void => {
    store = mockStore({
      dataId: '1',
      editedCell: '1|1',
      settings: {},
      allowCellEdits: true,
      rowRange: null,
      columnRange: null,
      rangeSelect: null,
      ctrlRows: null,
      ctrlCols: null,
      selectedRow: null,
      ...state,
    });
    props = {
      columnIndex: 1,
      rowIndex: 1,
      style: {},
      columns: [
        mockColumnDef({ index: 0, visible: true }),
        mockColumnDef({
          name: 'foo',
          index: 1,
          dtype: 'int64',
          visible: true,
          width: 100,
          resized: true,
        }),
        mockColumnDef({
          name: 'bar',
          index: 2,
          dtype: 'bool',
          visible: true,
          width: 100,
          resized: false,
        }),
      ],
      data: {},
      rowCount: 2,
      propagateState: jest.fn(),
      ...propOverrides,
    };
    if (useRerender) {
      rerender(
        <Provider store={store}>
          <GridCell {...props} />
          <MeasureText />
        </Provider>,
      );
    } else {
      buildInnerHTML();
      const result = render(
        <Provider store={store}>
          <GridCell {...props} />
          <MeasureText />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      container = result.container;
      rerender = result.rerender;
    }
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockImplementation(() => Promise.resolve(undefined));
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('correctly triggers tooltip on edited cell hovering', async () => {
    await fireEvent.mouseOver(container.getElementsByClassName('cell')[0]);
    expect(mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    await fireEvent.mouseOut(container.getElementsByClassName('cell')[0]);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('adds resized class to cell', () => {
    buildMock(undefined, { editedCell: null }, true);
    const divs = container.getElementsByTagName('div');
    expect(divs[divs.length - 1]).toHaveClass('resized');
  });

  it('renders checkbox for boolean column', () => {
    buildMock({ columnIndex: 2, data: { 0: { bar: { raw: 'True', view: 'True' } } } }, { editedCell: null }, true);
    expect(container.getElementsByClassName('ico-check-box')).toHaveLength(1);
  });

  it('renders checkbox for boolean column when edited', async () => {
    buildMock({ columnIndex: 2, data: { 0: { bar: { raw: 'True', view: 'True' } } } }, { editedCell: null }, true);
    buildMock({ columnIndex: 2, data: { 0: { bar: { raw: 'True', view: 'True' } } } }, { editedCell: '2|1' }, true);
    expect(container.getElementsByClassName('ico-check-box')).toHaveLength(1);
    const checkbox = container.getElementsByClassName('ico-check-box')[0];
    await act(async () => {
      await fireEvent.keyDown(checkbox, { key: 'n' });
    });
    expect(editCellSpy).toHaveBeenLastCalledWith('1', 'bar', 0, 'nan');
  });
});
