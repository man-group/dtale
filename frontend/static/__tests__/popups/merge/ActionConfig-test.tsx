import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';

import ActionConfig from '../../../popups/merge/ActionConfig';
import { MergeActionType } from '../../../redux/actions/MergeActions';
import { HowToMerge, MergeConfig, MergeConfigType, MergeState } from '../../../redux/state/MergeState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('ActionConfig', () => {
  let result: Element;
  let store: Store;
  const mockDispatch = jest.fn();
  const state: Partial<MergeState> = {
    action: MergeConfigType.MERGE,
    mergeConfig: { how: HowToMerge.INNER, sort: false, indicator: false },
    stackConfig: { ignoreIndex: false },
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const buildResult = async (overrides?: Partial<MergeState>): Promise<void> => {
    store = reduxUtils.createMergeStore();
    buildInnerHTML({ settings: '' }, store);
    const finalState = { ...state, ...overrides };
    store.dispatch({ type: MergeActionType.UPDATE_ACTION_TYPE, ...finalState });
    Object.entries(finalState.mergeConfig ?? {}).forEach(([prop, value]) => {
      store.dispatch({ type: MergeActionType.UPDATE_ACTION_CONFIG, action: MergeConfigType.MERGE, prop, value });
    });
    Object.entries(finalState.mergeConfig ?? {}).forEach(([prop, value]) => {
      store.dispatch({ type: MergeActionType.UPDATE_ACTION_CONFIG, action: MergeConfigType.STACK, prop, value });
    });
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <ActionConfig />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  const showExample = async (): Promise<void> => {
    await act(async () => {
      await fireEvent.click(result.getElementsByTagName('dt')[0]);
    });
  };

  it('triggers merge config functions', async () => {
    await buildResult();
    await act(async () => {
      await fireEvent.click(screen.getByText('Stack'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_TYPE,
      action: MergeConfigType.STACK,
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Merge'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Left'));
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'how',
      value: HowToMerge.LEFT,
    });
    await act(async () => {
      await fireEvent.click(result.querySelector('i.ico-check-box-outline-blank')!);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'sort',
      value: true,
    });
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('i.ico-check-box-outline-blank')[1]);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'indicator',
      value: true,
    });
    await showExample();
    expect(result.querySelector('.dataset.accordion-title.is-expanded')).toBeDefined();
    expect(
      result.getElementsByTagName('img')[0].getAttribute('src')?.endsWith('merging_merge_on_key_multiple.png'),
    ).toBe(true);
  });

  it('triggers stack config functions', async () => {
    await buildResult({ action: MergeConfigType.STACK });
    await act(async () => {
      await fireEvent.click(result.querySelector('i.ico-check-box-outline-blank')!);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.STACK,
      prop: 'ignoreIndex',
      value: true,
    });
    await showExample();
    expect(result.getElementsByTagName('img')[0].getAttribute('src')?.endsWith('merging_concat_basic.png')).toBe(true);
  });

  it('displays different merge examples', async () => {
    await buildResult({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.LEFT } as MergeConfig });
    await showExample();
    expect(result.getElementsByTagName('img')[0].getAttribute('src')?.endsWith('merging_merge_on_key_left.png')).toBe(
      true,
    );
    await buildResult({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.RIGHT } as MergeConfig });
    await showExample();
    expect(result.getElementsByTagName('img')[0].getAttribute('src')?.endsWith('merging_merge_on_key_right.png')).toBe(
      true,
    );
    await buildResult({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.OUTER } as MergeConfig });
    await showExample();
    expect(result.getElementsByTagName('img')[0].getAttribute('src')?.endsWith('merging_merge_on_key_outer.png')).toBe(
      true,
    );
  });
});
