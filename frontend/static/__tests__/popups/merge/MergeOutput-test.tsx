import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

jest.mock('../../../popups/merge/DataPreview', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return { DataPreview: createMockComponent() };
});

import MergeOutput from '../../../popups/merge/MergeOutput';
import * as uploadUtils from '../../../popups/upload/uploadUtils';
import * as mergeActions from '../../../redux/actions/merge';
import { HowToMerge, MergeConfigType, MergeState } from '../../../redux/state/MergeState';
import { tickUpdate } from '../../test-utils';

describe('MergeOutput', () => {
  let result: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  const state: Partial<MergeState> = {
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

  beforeEach(async () => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue(state);
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(jest.fn());
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const buildResult = async (): Promise<void> => {
    result = mount(<MergeOutput />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('triggers function correctly', async () => {
    const buildMergeSpy = jest.spyOn(mergeActions, 'buildMerge');
    buildMergeSpy.mockImplementation(jest.fn());
    await buildResult();
    expect(result.find('h3').text()).toBe('Merge Output');
    await act(async () => {
      result.find('input').simulate('change', { target: { value: 'test merge' } });
    });
    result = result.update();
    await act(async () => {
      result.find('button').simulate('click');
    });
    result = result.update();
    expect(buildMergeSpy).toHaveBeenLastCalledWith('test merge');
  });

  it('triggers built merge functions correctly', async () => {
    const clearMergeSpy = jest.spyOn(mergeActions, 'clearMerge');
    clearMergeSpy.mockImplementation(jest.fn());
    const jumpToDatasetSpy = jest.spyOn(uploadUtils, 'jumpToDataset');
    jumpToDatasetSpy.mockImplementation(() => Promise.resolve(undefined));
    useSelectorSpy.mockReturnValue({ ...state, mergeDataId: '1' });
    await buildResult();
    await act(async () => {
      result.find('button').at(1).simulate('click');
    });
    result = result.update();
    expect(jumpToDatasetSpy).toHaveBeenLastCalledWith('1', undefined, true);
    await act(async () => {
      result.find('button').last().simulate('click');
    });
    result = result.update();
    expect(clearMergeSpy).toHaveBeenCalled();
    expect(result.find('CustomMockComponent').props()).toEqual({ dataId: '1' });
  });
});
