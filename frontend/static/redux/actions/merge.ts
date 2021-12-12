import { Dispatch } from 'redux';

import * as GenericRepository from '../../repository/GenericRepository';
import { BaseResponse } from '../state/AppState';
import { Dataset, MergeConfigType, MergeState } from '../state/MergeState';

import {
  ConfigUpdateAction,
  ConfigUpdateProps,
  InstancesState,
  MergeActionType,
  MergeAppActions,
  MergeAppActionTypes,
  UpdateMergeActionTypeAction,
} from './MergeActions';
import { buildURLString } from './url-utils';

const loadProcesses = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  const instances = await GenericRepository.getDataFromService<InstancesState>('/dtale/processes?dtypes=true');
  if (instances) {
    dispatch({ type: MergeActionType.LOAD_INSTANCES, instances });
  }
};

export const init = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  dispatch({ type: MergeActionType.INIT_PARAMS });
  await loadProcesses(dispatch);
};

export const loadDatasets = async (dispatch: Dispatch<MergeAppActionTypes>): Promise<void> => {
  dispatch({ type: MergeActionType.LOADING_DATASETS });
  await loadProcesses(dispatch);
};

export const updateActionType = (action: MergeConfigType): UpdateMergeActionTypeAction => ({
  type: MergeActionType.UPDATE_ACTION_TYPE,
  action,
});

export const updateActionConfig = (actionUpdates: ConfigUpdateProps): ConfigUpdateAction => ({
  type: MergeActionType.UPDATE_ACTION_CONFIG,
  ...actionUpdates,
});

const extractDatasetParams = (datasets: Dataset[]): string => {
  return JSON.stringify(
    datasets.map((dataset) => ({
      columns: dataset.columns.map((col) => col.name),
      index: dataset.index.map((index) => index.name),
      dataId: dataset.dataId,
      suffix: dataset.suffix,
    })),
  );
};

/** Response object when posting a merge config */
interface MergeResponse extends BaseResponse {
  data_id: number;
}

export const buildMerge =
  (name: string): MergeAppActions<Promise<void>> =>
  async (dispatch: Dispatch<MergeAppActionTypes>, getState: () => MergeState): Promise<void> => {
    dispatch({ type: MergeActionType.LOAD_MERGE });
    const { action, mergeConfig, stackConfig, datasets } = getState();
    const config = action === 'merge' ? mergeConfig : stackConfig;
    const response = await GenericRepository.postDataToService<Record<string, string>, MergeResponse>('/dtale/merge', {
      action,
      config: JSON.stringify(config),
      datasets: extractDatasetParams(datasets),
      name,
    });
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
    await GenericRepository.getDataFromService<void>(
      buildURLString('/dtale/cleanup-datasets', { dataIds: mergeDataId! }),
    );
    dispatch({ type: MergeActionType.CLEAR_MERGE_DATA });
  };
