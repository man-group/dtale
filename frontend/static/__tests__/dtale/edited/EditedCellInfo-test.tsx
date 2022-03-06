import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { Store } from 'redux';

import { DataRecord, DataViewerData } from '../../../dtale/DataViewerState';
import EditedCellInfo from '../../../dtale/edited/EditedCellInfo';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import * as chartActions from '../../../redux/actions/charts';
import { PopupType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('DataViewerInfo tests', () => {
  let result: ReactWrapper;
  let store: Store;
  const propagateState = jest.fn();
  const dispatchSpy = jest.fn();

  beforeEach(() => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    document.getElementsByTagName('body')[0].innerHTML += `<span id="text-measure" />`;
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const buildInfo = async (editedCell?: string): Promise<ReactWrapper> => {
    const columns = [{ name: 'a', dtype: 'string', index: 1, visible: true }];
    const data: DataViewerData = { 0: { a: { raw: 'Hello World' } as DataRecord } };
    if (editedCell) {
      store.getState().editedCell = editedCell;
    }
    result = mount(
      <redux.Provider store={store}>
        <EditedCellInfo
          propagateState={propagateState}
          data={data}
          columns={columns}
          rowCount={Object.keys(data).length}
        />
      </redux.Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => tickUpdate(result));
    return result.update();
  };

  const executeKeyDown = async (): Promise<ReactWrapper> => {
    await act(async () => {
      result.find('textarea').simulate('keydown', { key: 'Enter' });
    });
    return result.update();
  };

  it('EditedCellInfo renders successfully', async () => {
    result = await buildInfo();
    expect(result.find('div.edited-cell-info')).toHaveLength(1);
  });

  it('EditedCellInfo renders edited data', async () => {
    result = await buildInfo('0|1');
    expect(result.find('textarea').props().value).toBe('Hello World');
  });

  it('EditedCellInfo handles updates', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue({ success: true });
    result = await buildInfo('0|1');
    expect(result.find('textarea').props().value).toBe('Hello World');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: ActionType.EDITED_CELL_TEXTAREA_HEIGHT }));
    result = await executeKeyDown();
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.CLEAR_EDIT });
    await act(async () => {
      result.find('textarea').simulate('change', { target: { value: 'Hello World2' } });
    });
    result = result.update();
    result = await executeKeyDown();
    expect(editCellSpy).toHaveBeenCalledTimes(1);
  });

  it('handles save errors', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue({ error: 'bad value', success: false });
    const openChartSpy = jest.spyOn(chartActions, 'openChart');
    result = await buildInfo('0|1');
    expect(result.find('textarea').props().value).toBe('Hello World');
    await act(async () => {
      result.find('textarea').simulate('change', { target: { value: 'Hello World2' } });
    });
    result = result.update();
    expect(result.find(EditedCellInfo).find('textarea').props().value).toBe('Hello World2');
    result = await executeKeyDown();
    expect(openChartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'bad value',
        type: PopupType.ERROR,
      }),
    );
  });
});
