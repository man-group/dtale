import * as InstanceRepository from '../../repository/InstanceRepository';
import * as MergeRepository from '../../repository/MergeRepository';
import { MergeDispatch } from '../helpers';
import { MergeThunk } from '../reducers/merge';
import { MergeState } from '../state/MergeState';

import { MergeActions } from './MergeActions';

const loadInstances = async (dispatch: MergeDispatch): Promise<void> => {
  const instances = await MergeRepository.loadInstances();
  if (instances && !instances?.error) {
    dispatch(MergeActions.LoadInstancesAction(instances));
  }
};

export const init = async (dispatch: MergeDispatch): Promise<void> => {
  dispatch(MergeActions.InitAction());
  await loadInstances(dispatch);
};

export const loadDatasets = async (dispatch: MergeDispatch): Promise<void> => {
  dispatch(MergeActions.LoadingDatasetsAction());
  await loadInstances(dispatch);
};

export const buildMerge =
  (name: string): MergeThunk =>
  async (dispatch: MergeDispatch, getState: () => MergeState): Promise<void> => {
    dispatch(MergeActions.LoadMergeAction());
    const { action, mergeConfig, stackConfig, datasets } = getState();
    const config = action === 'merge' ? mergeConfig : stackConfig;
    const response = await MergeRepository.saveMerge(action, config, datasets, name);
    if (response?.success) {
      dispatch(MergeActions.LoadMergeDataAction(response.data_id));
    } else {
      dispatch(MergeActions.LoadMergeErrorAction(response));
    }
  };

export const clearMerge =
  (): MergeThunk =>
  async (dispatch: MergeDispatch, getState: () => MergeState): Promise<void> => {
    const { mergeDataId } = getState();
    await InstanceRepository.cleanupInstance(mergeDataId ?? '');
    dispatch(MergeActions.ClearMergeDataAction());
  };
