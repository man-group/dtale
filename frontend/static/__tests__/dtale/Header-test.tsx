import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import Header, { HeaderProps } from '../../dtale/Header';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('Header', () => {
  let container: HTMLElement;
  let rerender: (ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => void;
  let props: HeaderProps;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;

  const buildMock = async (propOverrides?: HeaderProps, state?: { [key: string]: any }): Promise<void> => {
    store = mockStore({
      dataId: '1',
      settings: {},
      columnRange: null,
      ctrlCols: null,
      ...state,
    });

    props = {
      columns: [
        mockColumnDef({ index: 0, visible: true }),
        mockColumnDef({ name: 'foo', index: 1, dtype: 'int64', visible: true, width: 100 }),
      ],
      columnIndex: 1,
      rowCount: 1,
      propagateState: jest.fn(),
      style: {},
      ...propOverrides,
    };
    const result = render(
      <Provider store={store}>
        <Header {...props} />
      </Provider>,
    );
    container = result.container;
    rerender = result.rerender;
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('handles drag operations', async () => {
    const dragHandle = container.getElementsByClassName('DragHandle')[0];
    const current = {
      clientX: 10,
      clientY: 10,
    };
    let myEvent = createEvent.mouseDown(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    expect(myEvent.defaultPrevented).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.DRAG_RESIZE, x: 10 });

    current.clientX += 1;
    myEvent = createEvent.mouseMove(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    expect(myEvent.defaultPrevented).toBe(true);
    const textWrapper = container.getElementsByClassName('text-nowrap')[0];
    myEvent = createEvent.click(textWrapper);
    fireEvent(textWrapper, myEvent);
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.DRAG_RESIZE, x: 11 });
    expect(screen.queryAllByTestId('header-cell')[0]).toHaveStyle(`width: 101px`);
    const updatedColumns = [{ ...props.columns[0] }, { ...props.columns[1], width: 101, resized: true }];
    myEvent = createEvent.mouseUp(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    expect(myEvent.defaultPrevented).toBe(true);
    expect(props.propagateState).toHaveBeenCalledWith({
      columns: updatedColumns,
      triggerResize: true,
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.STOP_RESIZE });
    rerender(
      <Provider store={store}>
        <Header {...{ ...props, columns: updatedColumns }} />
      </Provider>,
    );
    expect(container.getElementsByClassName('resized')).toHaveLength(1);
  });

  it('vertical headers', () => {
    buildMock(undefined, { settings: { verticalHeaders: true } });
    const textCell = container.getElementsByClassName('text-nowrap')[0];
    expect(textCell).toHaveClass('text-nowrap rotate-header');
  });
});
