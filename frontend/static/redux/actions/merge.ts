import { Dispatch } from 'redux';

import * as InstanceRepository from '../../repository/InstanceRepository';
import * as MergeRepository from '../../repository/MergeRepository';
import { MergeConfigType, MergeState } from '../state/MergeState';

import {
  ConfigUpdateAction,
  ConfigUpdateProps,
  MergeActionType,
  MergeAppActions,
  MergeAppActionTypes,
  UpdateMergeActionTypeAction,
} from './MergeActions';

const loadInstances = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  const instances = await MergeRepository.loadInstances();
  if (instances && !instances?.error) {
    dispatch({ type: MergeActionType.LOAD_INSTANCES, instances });
  }
};

export const init = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  dispatch({ type: MergeActionType.INIT_PARAMS });
  await loadInstances(dispatch);
};

export const loadDatasets = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  dispatch({ type: MergeActionType.LOADING_DATASETS });
  await loadInstances(dispatch);
};

export const updateActionType = (action: MergeConfigType): UpdateMergeActionTypeAction => ({
  type: MergeActionType.UPDATE_ACTION_TYPE,
  action,
});

export const updateActionConfig = (actionUpdates: ConfigUpdateProps): ConfigUpdateAction => ({
  type: MergeActionType.UPDATE_ACTION_CONFIG,
  ...actionUpdates,
});

export const buildMerge =
  (name: string): MergeAppActions<Promise<void>> =>
  async (dispatch: Dispatch<MergeAppActionTypes>, getState: () => MergeState): Promise<void> => {
    dispatch({ type: MergeActionType.LOAD_MERGE });
    const { action, mergeConfig, stackConfig, datasets } = getState();
    const config = action === 'merge' ? mergeConfig : stackConfig;
    const response = await MergeRepository.saveMerge(action, config, datasets, name);
    if (response?.success) {
      dispatch({ type: MergeActionType.LOAD_MERGE_DATA, dataId: response.data_id });
    } else {
      dispatch({ type: MergeActionType.LOAD_MERGE_ERROR, error: response });
    }
  };

export const clearMerge =
  (): MergeAppActions<Promise<void>> =>
  async (dispatch: Dispatch<MergeAppActionTypes>, getState: () => MergeState): Promise<void> => {
    const { mergeDataId } = getState();
    await InstanceRepository.cleanupInstance(mergeDataId ?? '');
    dispatch({ type: MergeActionType.CLEAR_MERGE_DATA });
  };
