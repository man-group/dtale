import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import ButtonToggle from '../../../ButtonToggle';
import ActionConfig, { ExampleToggle } from '../../../popups/merge/ActionConfig';
import { MergeActionType } from '../../../redux/actions/MergeActions';
import { HowToMerge, MergeConfigType, MergeState } from '../../../redux/state/MergeState';
import { tickUpdate } from '../../test-utils';

describe('ActionConfig', () => {
  let result: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();
  const state: Partial<MergeState> = {
    action: MergeConfigType.MERGE,
    mergeConfig: { how: HowToMerge.INNER, sort: false, indicator: false },
    stackConfig: { ignoreIndex: false },
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
    result = mount(<ActionConfig />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  const showExample = async (): Promise<ReactWrapper> => {
    await act(async () => {
      result.find('dt').first().simulate('click');
    });
    return result.update();
  };

  it('triggers merge config functions', async () => {
    await buildResult();
    await act(async () => {
      result.find(ButtonToggle).first().props().update(MergeConfigType.STACK);
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_TYPE,
      action: MergeConfigType.STACK,
    });
    await act(async () => {
      result.find(ButtonToggle).first().props().update(MergeConfigType.MERGE);
    });
    result = result.update();
    await act(async () => {
      result.find(ButtonToggle).last().props().update(HowToMerge.LEFT);
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'how',
      value: HowToMerge.LEFT,
    });
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').first().simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'sort',
      value: true,
    });
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').at(1).simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.MERGE,
      prop: 'indicator',
      value: true,
    });
    result = await showExample();
    expect(result.find(ExampleToggle).props().show).toBe(true);
    expect(result.find('img').props().src?.endsWith('merging_merge_on_key_multiple.png')).toBe(true);
  });

  it('triggers stack config functions', async () => {
    useSelectorSpy.mockReturnValue({ ...state, action: MergeConfigType.STACK });
    await buildResult();
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').first().simulate('click');
    });
    result = result.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({
      type: MergeActionType.UPDATE_ACTION_CONFIG,
      action: MergeConfigType.STACK,
      prop: 'ignoreIndex',
      value: true,
    });
    result = await showExample();
    expect(result.find('img').props().src?.endsWith('merging_concat_basic.png')).toBe(true);
  });

  it('displays different merge examples', async () => {
    useSelectorSpy.mockReturnValue({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.LEFT } });
    await buildResult();
    result = await showExample();
    expect(result.find('img').props().src?.endsWith('merging_merge_on_key_left.png')).toBe(true);
    useSelectorSpy.mockReturnValue({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.RIGHT } });
    await buildResult();
    result = await showExample();
    expect(result.find('img').props().src?.endsWith('merging_merge_on_key_right.png')).toBe(true);
    useSelectorSpy.mockReturnValue({ ...state, mergeConfig: { ...state.mergeConfig, how: HowToMerge.OUTER } });
    result = await showExample();
    expect(result.find('img').props().src?.endsWith('merging_merge_on_key_outer.png')).toBe(true);
  });
});
