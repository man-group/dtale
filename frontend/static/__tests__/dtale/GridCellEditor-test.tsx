import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { GridCellEditor, GridCellEditorProps } from '../../dtale/GridCellEditor';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { tickUpdate } from '../test-utils';

describe('GridCellEditor', () => {
  let wrapper: ReactWrapper;
  let props: GridCellEditorProps;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  const buildMock = async (propOverrides?: GridCellEditorProps, state?: { [key: string]: any }): Promise<void> => {
    useSelectorSpy.mockReturnValue({
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
    wrapper = mount(<GridCellEditor {...props} />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  };

  beforeEach(async () => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    await buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('clears edit on escape', async () => {
    expect(addEventListenerSpy).toHaveBeenCalled();
    await act(async () => {
      addEventListenerSpy.mock.calls.find((call) => call[0] === 'keydown')[1]({ key: 'Escape' });
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.CLEAR_EDIT });
  });

  it('drops window listener on unmount', async () => {
    await act(async () => {
      wrapper.unmount();
    });
    wrapper = wrapper.update();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
