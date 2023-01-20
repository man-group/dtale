import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import selectEvent from 'react-select-event';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import GridCell, { GridCellProps } from '../../dtale/GridCell';
import { MeasureText } from '../../dtale/MeasureText';
import * as serverState from '../../dtale/serverStateManagement';
import { ActionType } from '../../redux/actions/AppActions';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { buildInnerHTML } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('GridCell', () => {
  let container: HTMLElement;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;
  let props: GridCellProps;
  let editCellSpy: jest.SpyInstance;
  let loadFilterDataSpy: jest.SpyInstance;

  const buildMock = async (
    propOverrides?: Partial<GridCellProps>,
    state?: { [key: string]: any },
    useRerender = false,
  ): Promise<void> => {
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
        mockColumnDef({
          name: 'baz',
          index: 3,
          dtype: 'category',
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

    buildInnerHTML();
    container = await act(
      async () =>
        (
          await render(
            <Provider store={store}>
              <GridCell {...props} />
              <MeasureText />
            </Provider>,
            { container: document.getElementById('content') ?? undefined },
          )
        ).container,
    );
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockImplementation(() => Promise.resolve(undefined));
    loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockImplementation(() =>
      Promise.resolve({
        uniques: ['a', 'b', 'c'],
      }),
    );
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('correctly triggers tooltip on edited cell hovering', async () => {
    await buildMock();
    await fireEvent.mouseOver(container.getElementsByClassName('cell')[0]);
    expect(mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    await fireEvent.mouseOut(container.getElementsByClassName('cell')[0]);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('adds resized class to cell', async () => {
    await buildMock(undefined, { editedCell: null }, true);
    const divs = container.getElementsByTagName('div');
    expect(divs[divs.length - 1]).toHaveClass('resized');
  });

  it('renders checkbox for boolean column', async () => {
    await buildMock(
      { columnIndex: 2, data: { 0: { bar: { raw: 'True', view: 'True' } } } },
      { editedCell: null },
      true,
    );
    expect(container.getElementsByClassName('ico-check-box')).toHaveLength(1);
  });

  it('renders checkbox for boolean column when edited', async () => {
    await buildMock(
      { columnIndex: 2, data: { 0: { bar: { raw: 'True', view: 'True' } } } },
      { editedCell: '2|1' },
      true,
    );
    expect(container.getElementsByClassName('ico-check-box')).toHaveLength(1);
    const checkbox = container.getElementsByClassName('ico-check-box')[0];
    await act(async () => {
      await fireEvent.keyDown(checkbox, { key: 'n' });
    });
    expect(editCellSpy).toHaveBeenLastCalledWith('1', 'bar', 0, 'nan');
  });

  it('renders select for category column when edited', async () => {
    await buildMock({ columnIndex: 3, data: { 0: { baz: { raw: 'a', view: 'a' } } } }, { editedCell: '3|1' }, true);
    expect(container.getElementsByClassName('Select')).toHaveLength(1);
    const select = container.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect([...select.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'nan',
      'a',
      'b',
      'c',
    ]);
    expect(loadFilterDataSpy).toHaveBeenLastCalledWith('1', 'baz');
  });

  it('renders select for column w/ custom options when edited', async () => {
    const settings = { column_edit_options: { baz: ['foo', 'bar', 'bizzle'] } };
    await buildMock(
      { columnIndex: 3, data: { 0: { baz: { raw: 'a', view: 'a' } } } },
      { editedCell: '3|1', settings },
      true,
    );
    expect(container.getElementsByClassName('Select')).toHaveLength(1);
    const select = container.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect([...select.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'nan',
      'foo',
      'bar',
      'bizzle',
    ]);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });
});
