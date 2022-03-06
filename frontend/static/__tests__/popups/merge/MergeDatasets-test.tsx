import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { ActionMeta, default as Select } from 'react-select';

jest.mock('../../../dtale/DataViewer', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return { DataViewer: createMockComponent() };
});
jest.mock('../../../popups/merge/ActionConfig', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return createMockComponent();
});
jest.mock('../../../popups/merge/MergeOutput', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return createMockComponent();
});
jest.mock('../../../popups/Popup', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import MergeDatasets from '../../../popups/merge/MergeDatasets';
import { MergeActionType } from '../../../redux/actions/MergeActions';
import { MergeConfigType, MergeState } from '../../../redux/state/MergeState';
import { tickUpdate } from '../../test-utils';

describe('MergeDatasets', () => {
  let result: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();
  const state: Partial<MergeState> = {
    instances: [{ data_id: '1', names: [{ index: 0, name: 'foo', dtype: 'int' }], rows: 10, columns: '' }],
    loading: false,
    loadingDatasets: false,
    action: MergeConfigType.MERGE,
    datasets: [
      {
        dataId: '1',
        index: [],
        columns: [],
        suffix: null,
        isOpen: true,
        isDataOpen: false,
      },
    ],
    loadingError: null,
    mergeError: null,
  };

  beforeEach(async () => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue(state);
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const buildResult = async (): Promise<void> => {
    result = mount(<MergeDatasets />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('triggers dataset functions', async () => {
    await buildResult();
    await act(async () => {
      result.find('dt').first().simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: MergeActionType.TOGGLE_DATASET, index: 0 });
    await act(async () => {
      result
        .find(Select)
        .first()
        .props()
        .onChange?.([], {} as ActionMeta<unknown>);
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'index',
      value: [],
    });
    await act(async () => {
      result
        .find(Select)
        .last()
        .props()
        .onChange?.([], {} as ActionMeta<unknown>);
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'columns',
      value: [],
    });
    await act(async () => {
      result
        .find('input')
        .last()
        .simulate('change', { target: { value: 'suffix' } });
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'suffix',
      value: 'suffix',
    });
    await act(async () => {
      result
        .find('button')
        .findWhere((b) => b.text() === 'Remove Dataset')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: MergeActionType.REMOVE_DATASET, index: 0 });
    await act(async () => {
      result.find('dt').last().simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'isDataOpen',
      value: true,
    });
  });
});
