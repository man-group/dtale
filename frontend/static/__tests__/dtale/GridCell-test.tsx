import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import GridCell, { GridCellProps } from '../../dtale/GridCell';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

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

  const buildMock = (propOverrides?: GridCellProps, state?: { [key: string]: any }, useRerender = false): void => {
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
        </Provider>,
      );
    } else {
      const result = render(
        <Provider store={store}>
          <GridCell {...props} />
        </Provider>,
      );
      container = result.container;
      rerender = result.rerender;
    }
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
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
});
