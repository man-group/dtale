import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

jest.mock('../../../popups/merge/DataPreview', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return { DataPreview: createMockComponent('DataPreview', () => <div data-testid="data-preview" />) };
});

import MergeOutput from '../../../popups/merge/MergeOutput';
import * as uploadUtils from '../../../popups/upload/uploadUtils';
import * as mergeActions from '../../../redux/actions/merge';
import { MergeActionType } from '../../../redux/actions/MergeActions';
import { HowToMerge, MergeConfigType, MergeState } from '../../../redux/state/MergeState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('MergeOutput', () => {
  const mockDispatch = jest.fn();
  const state: Partial<MergeState> = {
    instances: [{ data_id: '1', names: [{ index: 0, name: 'foo', dtype: 'int' }], rows: 10, columns: '' }],
    action: MergeConfigType.MERGE,
    mergeConfig: { how: HowToMerge.INNER, sort: false, indicator: false },
    stackConfig: { ignoreIndex: false },
    datasets: [
      {
        dataId: '1',
        index: [],
        columns: [],
        suffix: null,
        isOpen: true,
        isDataOpen: false,
      },
      {
        dataId: '1',
        index: [],
        columns: [],
        suffix: null,
        isOpen: true,
        isDataOpen: false,
      },
    ],
    loadingMerge: false,
    mergeDataId: null,
    showCode: false,
  };
  let store: Store;

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const buildResult = async (): Promise<void> => {
    store = reduxUtils.createMergeStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: MergeActionType.LOAD_INSTANCES, instances: { data: state.instances } });
    store.dispatch({ type: MergeActionType.UPDATE_ACTION_TYPE, action: state.action });
    Object.entries(state.mergeConfig ?? {}).forEach(([prop, value]) => {
      store.dispatch({ type: MergeActionType.UPDATE_ACTION_CONFIG, action: MergeConfigType.MERGE, prop, value });
    });
    Object.entries(state.mergeConfig ?? {}).forEach(([prop, value]) => {
      store.dispatch({ type: MergeActionType.UPDATE_ACTION_CONFIG, action: MergeConfigType.STACK, prop, value });
    });
    store.dispatch({ type: MergeActionType.ADD_DATASET, dataId: '1' });
    store.dispatch({ type: MergeActionType.ADD_DATASET, dataId: '1' });
    await act(
      () =>
        render(
          <Provider store={store}>
            <MergeOutput />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  it('triggers function correctly', async () => {
    const buildMergeSpy = jest.spyOn(mergeActions, 'buildMerge');
    buildMergeSpy.mockImplementation(jest.fn());
    await buildResult();
    expect(screen.getByText('Merge Output')).toBeDefined();
    await act(async () => {
      await fireEvent.change(screen.getByText('Name').parentElement!.getElementsByTagName('input')[0], {
        target: { value: 'test merge' },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Build Merge'));
    });
    expect(buildMergeSpy).toHaveBeenLastCalledWith('test merge');
  });

  it('triggers built merge functions correctly', async () => {
    const clearMergeSpy = jest.spyOn(mergeActions, 'clearMerge');
    clearMergeSpy.mockImplementation(jest.fn());
    const jumpToDatasetSpy = jest.spyOn(uploadUtils, 'jumpToDataset');
    jumpToDatasetSpy.mockImplementation(() => Promise.resolve(undefined));
    await buildResult();
    await act(async () => {
      await store.dispatch({ type: MergeActionType.LOAD_MERGE_DATA, dataId: '1' });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Keep Data & Jump To Grid'));
    });
    expect(jumpToDatasetSpy).toHaveBeenLastCalledWith('1', undefined, true);
    await act(async () => {
      await fireEvent.click(screen.getByText('Clear Data & Keep Editing'));
    });
    expect(clearMergeSpy).toHaveBeenCalled();
    expect(screen.getByTestId('data-preview')).toBeDefined();
  });
});
