import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import ColumnMenu from '../../../dtale/column/ColumnMenu';
import * as columnMenuUtils from '../../../dtale/column/columnMenuUtils';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import * as actions from '../../../redux/actions/dtale';
import { AppState, SidePanelType } from '../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../repository/ColumnFilterRepository';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('ColumnMenu', () => {
  let wrapper: RenderResult;
  let store: Store;
  let positionMenuSpy: jest.SpyInstance;
  let ignoreMenuClicksSpy: jest.SpyInstance;
  let toggleVisibilitySpy: jest.SpyInstance;
  let hideColumnMenuSpy: jest.SpyInstance;
  const mockDispatch = jest.fn();
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
    useDispatchMock.mockImplementation(() => mockDispatch);
    dimensions.beforeAll();
    positionMenuSpy = jest.spyOn(columnMenuUtils, 'positionMenu');
    positionMenuSpy.mockImplementation(() => undefined);
    ignoreMenuClicksSpy = jest.spyOn(columnMenuUtils, 'ignoreMenuClicks');
    ignoreMenuClicksSpy.mockImplementation(() => undefined);
    toggleVisibilitySpy = jest.spyOn(serverState, 'toggleVisibility');
    toggleVisibilitySpy.mockImplementation(() => undefined);
    hideColumnMenuSpy = jest.spyOn(actions, 'hideColumnMenu');
    const loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockResolvedValue(undefined);
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.TOGGLE_COLUMN_MENU, colName: 'col1' });
    wrapper = await act(
      async () =>
        await render(
          <Provider store={store}>
            <ColumnMenu columns={[...reduxUtils.DTYPES.dtypes]} propagateState={propagateState} />)
          </Provider>,
        ),
    );
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('has global hotkey to close menu', async () => {
    await act(async () => {
      await fireEvent.keyDown(wrapper.container, { keyCode: 27 });
    });
    await act(async () => {
      await fireEvent.keyUp(wrapper.container, { keyCode: 27 });
    });
    expect(hideColumnMenuSpy).toHaveBeenLastCalledWith(props.selectedCol);
  });

  it('opens side panel on describe', async () => {
    await act(async () => {
      await fireEvent.click(wrapper.container.getElementsByClassName('ico-visibility-off')[0]);
    });
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
      await fireEvent.click(wrapper.container.getElementsByClassName('ico-view-column')[0]);
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.SHOW_SIDE_PANEL,
      view: SidePanelType.DESCRIBE,
      column: props.selectedCol,
    });
  });
});
