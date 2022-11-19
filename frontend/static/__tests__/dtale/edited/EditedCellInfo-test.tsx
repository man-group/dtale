import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import { DataRecord, DataViewerData } from '../../../dtale/DataViewerState';
import EditedCellInfo from '../../../dtale/edited/EditedCellInfo';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import * as chartActions from '../../../redux/actions/charts';
import { PopupType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DataViewerInfo tests', () => {
  let result: Element;
  let store: Store;
  const mockDispatch = jest.fn();
  const propagateState = jest.fn();

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    document.getElementsByTagName('body')[0].innerHTML += `<span id="text-measure" />`;
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const buildInfo = async (editedCell?: string): Promise<void> => {
    const columns = [{ name: 'a', dtype: 'string', index: 1, visible: true }];
    const data: DataViewerData = { 0: { a: { raw: 'Hello World' } as DataRecord } };
    if (editedCell) {
      store.getState().editedCell = editedCell;
    }
    result = await act(
      async () =>
        render(
          <Provider store={store}>
            <EditedCellInfo
              propagateState={propagateState}
              data={data}
              columns={columns}
              rowCount={Object.keys(data).length}
            />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  };

  const executeKeyDown = async (): Promise<void> => {
    const textarea = result.getElementsByTagName('textarea')[0];
    await act(async () => {
      await fireEvent.keyDown(textarea, { keyCode: 13 });
    });
    await act(async () => {
      await fireEvent.keyUp(textarea, { keyCode: 13 });
    });
  };

  it('EditedCellInfo renders successfully', async () => {
    await buildInfo();
    expect(result.getElementsByClassName('edited-cell-info')).toHaveLength(1);
  });

  it('EditedCellInfo renders edited data', async () => {
    await buildInfo('0|1');
    expect(result.getElementsByTagName('textarea')[0].value).toBe('Hello World');
  });

  it('EditedCellInfo handles updates', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue({ success: true });
    await buildInfo('0|1');
    expect(result.getElementsByTagName('textarea')[0].value).toBe('Hello World');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: ActionType.EDITED_CELL_TEXTAREA_HEIGHT }),
    );
    await executeKeyDown();
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.CLEAR_EDIT });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('textarea')[0], { target: { value: 'Hello World2' } });
    });
    await executeKeyDown();
    expect(editCellSpy).toHaveBeenCalledTimes(1);
  });

  it('handles save errors', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue({ error: 'bad value', success: false });
    const openChartSpy = jest.spyOn(chartActions, 'openChart');
    await buildInfo('0|1');
    expect(result.getElementsByTagName('textarea')[0].value).toBe('Hello World');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('textarea')[0], { target: { value: 'Hello World2' } });
    });
    expect(result.getElementsByTagName('textarea')[0].value).toBe('Hello World2');
    await executeKeyDown();
    expect(openChartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'bad value',
        type: PopupType.ERROR,
      }),
    );
  });
});
