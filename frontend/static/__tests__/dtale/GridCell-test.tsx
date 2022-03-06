import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import GridCell, { GridCellProps } from '../../dtale/GridCell';
import { ActionType } from '../../redux/actions/AppActions';
import { mockColumnDef } from '../mocks/MockColumnDef';

describe('GridCell', () => {
  let wrapper: ReactWrapper;
  let props: GridCellProps;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  const buildMock = (propOverrides?: GridCellProps, state?: { [key: string]: any }): void => {
    useSelectorSpy.mockReturnValue({
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
    wrapper = mount(<GridCell {...props} />);
  };

  beforeEach(() => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('correctly triggers tooltip on edited cell hovering', () => {
    wrapper
      .find('div')
      .props()
      .onMouseOver?.({} as any as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    wrapper
      .find('div')
      .props()
      .onMouseLeave?.({} as any as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('adds resized class to cell', () => {
    buildMock(undefined, { editedCell: null });
    expect(wrapper.find('div').last().props().className).toBe('resized');
  });
});
