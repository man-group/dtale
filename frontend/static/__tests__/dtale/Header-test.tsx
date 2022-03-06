import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import * as redux from 'react-redux';

import Header, { HeaderProps } from '../../dtale/Header';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

describe('Header', () => {
  let wrapper: ReactWrapper;
  let props: HeaderProps;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  const buildMock = async (propOverrides?: HeaderProps, state?: { [key: string]: any }): Promise<void> => {
    useSelectorSpy.mockReturnValue({
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
    wrapper = mount(<Header {...props} />);
  };

  beforeEach(() => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('handles drag operations', async () => {
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 10,
    } as any as DraggableEvent;
    await act(async () => {
      wrapper
        .find(Draggable)
        .props()
        .onStart?.(event, {} as DraggableData);
    });
    wrapper = wrapper.update();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.DRAG_RESIZE, x: 10 });
    wrapper
      .find('.text-nowrap')
      .props()
      .onClick?.({} as any as React.MouseEvent);
    await act(async () => {
      wrapper
        .find(Draggable)
        .props()
        .onDrag?.(event, { deltaX: 10 } as DraggableData);
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.DRAG_RESIZE, x: 10 });
    expect(wrapper.find('div').first().props().style?.width).toBe(110);
    const updatedColumns = [{ ...props.columns[0] }, { ...props.columns[1], width: 110, resized: true }];
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    await act(async () => {
      wrapper
        .find(Draggable)
        .props()
        .onStop?.(event, {} as DraggableData);
    });
    wrapper = wrapper.update();
    expect(props.propagateState).toHaveBeenCalledWith({
      columns: updatedColumns,
      triggerResize: true,
    });
    expect(event.preventDefault).toHaveBeenCalledTimes(3);
    expect(event.stopPropagation).toHaveBeenCalledTimes(3);
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.STOP_RESIZE });
    wrapper.setProps({ columns: updatedColumns });
    expect(wrapper.find('.resized')).toHaveLength(1);
  });

  it('vertical headers', () => {
    buildMock(undefined, { settings: { verticalHeaders: true } });
    expect(wrapper.find('div').at(1).props().className).toBe('text-nowrap rotate-header');
  });
});
