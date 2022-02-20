import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { GlobalHotKeys } from 'react-hotkeys';
import * as redux from 'react-redux';

import ColumnMenu from '../../../dtale/column/ColumnMenu';
import { ColumnMenuOption } from '../../../dtale/column/ColumnMenuOption';
import * as columnMenuUtils from '../../../dtale/column/columnMenuUtils';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import * as actions from '../../../redux/actions/dtale';
import { AppState, SidePanelType } from '../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../repository/ColumnFilterRepository';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

describe('ColumnMenu', () => {
  let wrapper: ReactWrapper;
  let positionMenuSpy: jest.SpyInstance;
  let ignoreMenuClicksSpy: jest.SpyInstance;
  let toggleVisibilitySpy: jest.SpyInstance;
  let hideColumnMenuSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();
  const dimensions = new DimensionsHelper({
    offsetWidth: 1000,
    offsetHeight: 1000,
    innerWidth: 1000,
    innerHeight: 1000,
  });

  const props: Partial<AppState> = {
    dataId: '1',
    columnMenuOpen: true,
    selectedCol: 'col1',
    isPreview: false,
    ribbonMenuOpen: false,
  };
  const propagateState = jest.fn();

  beforeEach(async () => {
    dimensions.beforeAll();
    positionMenuSpy = jest.spyOn(columnMenuUtils, 'positionMenu');
    positionMenuSpy.mockImplementation(() => undefined);
    ignoreMenuClicksSpy = jest.spyOn(columnMenuUtils, 'ignoreMenuClicks');
    ignoreMenuClicksSpy.mockImplementation(() => undefined);
    toggleVisibilitySpy = jest.spyOn(serverState, 'toggleVisibility');
    toggleVisibilitySpy.mockImplementation(() => undefined);
    hideColumnMenuSpy = jest.spyOn(actions, 'hideColumnMenu');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    const loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockResolvedValue(undefined);
    const store = reduxUtils.createDtaleStore();
    Object.keys(props).forEach((key) => ((store.getState() as any)[key] = (props as any)[key]));
    wrapper = mount(
      <redux.Provider store={store}>
        <ColumnMenu columns={[...reduxUtils.DTYPES.dtypes]} propagateState={propagateState} />)
      </redux.Provider>,
    );
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('has global hotkey to close menu', async () => {
    const closeMenu = wrapper.find(GlobalHotKeys).props().handlers?.CLOSE_MENU;
    await act(async () => {
      closeMenu?.();
    });
    wrapper = wrapper.update();
    expect(hideColumnMenuSpy).toHaveBeenLastCalledWith(props.selectedCol);
  });

  it('opens side panel on describe', async () => {
    await act(async () => {
      wrapper
        .find(ColumnMenuOption)
        .findWhere((option) => option.props().iconClass === 'ico-visibility-off')
        .props()
        .open();
    });
    wrapper = wrapper.update();
    expect(toggleVisibilitySpy).toHaveBeenCalledTimes(1);
    const toggleParams = toggleVisibilitySpy.mock.calls[0];
    expect(toggleParams[0]).toBe(props.dataId);
    expect(toggleParams[1]).toBe(props.selectedCol);
    expect(propagateState).toHaveBeenCalledWith({
      columns: reduxUtils.DTYPES.dtypes.map((col) =>
        col.name === props.selectedCol ? { ...col, visible: false } : col,
      ),
      triggerResize: true,
    });
  });

  it('correctly hides column', async () => {
    await act(async () => {
      wrapper
        .find(ColumnMenuOption)
        .findWhere((option) => option.props().iconClass === 'ico-view-column')
        .props()
        .open();
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: ActionType.SHOW_SIDE_PANEL,
      view: SidePanelType.DESCRIBE,
      column: props.selectedCol,
    });
  });
});
