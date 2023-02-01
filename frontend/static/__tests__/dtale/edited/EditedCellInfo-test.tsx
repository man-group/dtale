import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import selectEvent from 'react-select-event';
import { Store } from 'redux';

import { DataViewerData } from '../../../dtale/DataViewerState';
import EditedCellInfo from '../../../dtale/edited/EditedCellInfo';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import * as chartActions from '../../../redux/actions/charts';
import { InstanceSettings, PopupType } from '../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../repository/ColumnFilterRepository';
import { mockColumnDef } from '../../mocks/MockColumnDef';
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

  const buildInfo = async (editedCell?: string, settings?: Partial<InstanceSettings>): Promise<void> => {
    const columns = [
      { name: 'a', dtype: 'string', index: 1, visible: true },
      mockColumnDef({
        name: 'bar',
        index: 2,
        dtype: 'bool',
        visible: true,
        width: 100,
        resized: false,
      }),
      mockColumnDef({
        name: 'baz',
        index: 3,
        dtype: 'category',
        visible: true,
        width: 100,
        resized: false,
      }),
    ];
    const data: DataViewerData = {
      0: {
        a: { raw: 'Hello World', view: 'Hello World' },
        bar: { raw: 'True', view: 'True' },
        baz: { raw: 'a', view: 'a' },
      },
    };
    if (editedCell) {
      store.dispatch({ type: ActionType.EDIT_CELL, editedCell });
    }
    if (settings) {
      store.dispatch({ type: ActionType.UPDATE_SETTINGS, settings });
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

  it('renders checkbox for boolean column when edited', async () => {
    const editCellSpy = jest.spyOn(serverState, 'editCell');
    editCellSpy.mockResolvedValue(undefined);
    await buildInfo('1|1');
    expect(result.getElementsByClassName('ico-check-box')).toHaveLength(1);
    const checkbox = result.getElementsByClassName('ico-check-box')[0];
    await act(async () => {
      await fireEvent.keyDown(checkbox, { key: 'n' });
    });
    expect(editCellSpy).toHaveBeenLastCalledWith('1', 'bar', 0, 'nan');
  });

  it('renders select for category column when edited', async () => {
    const loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockResolvedValue({ success: true, hasMissing: false, uniques: ['a', 'b', 'c'] });
    await buildInfo('2|1');
    expect(result.getElementsByClassName('Select')).toHaveLength(1);
    const select = result.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect([...select.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'nan',
      'a',
      'b',
      'c',
    ]);
    expect(loadFilterDataSpy).toHaveBeenLastCalledWith('1', 'baz');
  });

  it('renders select for column w/ custom options when edited', async () => {
    const loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockResolvedValue({ success: true, hasMissing: false, uniques: ['a', 'b', 'c'] });
    await buildInfo('2|1', { column_edit_options: { baz: ['foo', 'bar', 'bizzle'] } });
    expect(result.getElementsByClassName('Select')).toHaveLength(1);
    const select = result.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect([...select.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'nan',
      'foo',
      'bar',
      'bizzle',
    ]);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('hides cell editor when "hide_header_editor" is true', async () => {
    const loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    loadFilterDataSpy.mockResolvedValue({ success: true, hasMissing: false, uniques: ['a', 'b', 'c'] });
    await buildInfo('2|1', { column_edit_options: { baz: ['foo', 'bar', 'bizzle'] }, hide_header_editor: true });
    expect(result.getElementsByClassName('edited-cell-info')).toHaveLength(0);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });
});
