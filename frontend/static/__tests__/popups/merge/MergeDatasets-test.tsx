import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

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
import { MergeConfigType, MergeInstance } from '../../../redux/state/MergeState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, selectOption } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('MergeDatasets', () => {
  const mockDispatch = jest.fn();
  const instances: MergeInstance[] = [
    { data_id: '1', names: [{ index: 0, name: 'foo', dtype: 'int' }], rows: 10, columns: '' },
  ];

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const buildResult = async (): Promise<void> => {
    const store = reduxUtils.createMergeStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: MergeActionType.LOAD_INSTANCES, instances: { data: instances } });
    store.dispatch({ type: MergeActionType.UPDATE_ACTION_TYPE, action: MergeConfigType.MERGE });
    store.dispatch({ type: MergeActionType.ADD_DATASET, dataId: '1' });

    await act(
      () =>
        render(
          <Provider store={store}>
            <MergeDatasets />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  it('triggers dataset functions', async () => {
    await buildResult();
    await act(async () => {
      await fireEvent.click(screen.getByText('Dataset 1'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: MergeActionType.TOGGLE_DATASET, index: 0 });
    await selectOption(
      screen.getByText('Index(es)*:').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'foo (int)',
    );
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'index',
      value: [instances[0].names[0]],
    });
    await selectOption(
      screen.getByText('Column(s):').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'foo (int)',
    );
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'columns',
      value: [instances[0].names[0]],
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('Suffix:').parentElement!.getElementsByTagName('input')[0], {
        target: { value: 'suffix' },
      });
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'suffix',
      value: 'suffix',
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Remove Dataset'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: MergeActionType.REMOVE_DATASET, index: 0 });
    await act(async () => {
      await fireEvent.click(screen.getByText('Data'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_DATASET,
      index: 0,
      prop: 'isDataOpen',
      value: true,
    });
  });
});
