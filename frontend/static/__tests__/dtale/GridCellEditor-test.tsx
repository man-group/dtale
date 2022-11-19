import { fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import { GridCellEditor, GridCellEditorProps } from '../../dtale/GridCellEditor';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('GridCellEditor', () => {
  let container: HTMLElement;
  const mockDispatch = jest.fn();
  const mockStore = configureStore();
  let store: Store;
  let props: GridCellEditorProps;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  const buildMock = async (propOverrides?: GridCellEditorProps, state?: { [key: string]: any }): Promise<void> => {
    store = mockStore({
      dataId: '1',
      settings: {},
      maxColumnWidth: null,
      ...state,
    });
    props = {
      value: 'aaa',
      colCfg: mockColumnDef(),
      rowIndex: 1,
      propagateState: jest.fn(),
      data: {},
      columns: [mockColumnDef()],
      rowCount: 1,
      ...propOverrides,
    };
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    container = render(
      <Provider store={store}>
        <div>
          <GridCellEditor {...props} />
        </div>
      </Provider>,
    ).container;
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    await buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('clears edit on escape', async () => {
    expect(addEventListenerSpy).toHaveBeenCalled();
    const input = container.getElementsByTagName('input')[0];
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.CLEAR_EDIT });
  });

  it('drops window listener on unmount', async () => {
    const body = container.getElementsByTagName('div')[0];
    const input = container.getElementsByTagName('input')[0];
    body.removeChild(input);
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
