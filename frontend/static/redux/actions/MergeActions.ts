import { ErrorState } from '../../repository/GenericRepository';
import { createActionWithPayload } from '../helpers';
import { Dataset, MergeConfig, MergeConfigType, MergeInstance, StackConfig } from '../state/MergeState';

import { AppActions } from './AppActions';

/** Different merge events */
export enum MergeActionType {
  INIT_PARAMS = 'init-params',
  LOAD_INSTANCES = 'load-instances',
  LOADING_DATASETS = 'loading-datasets',
  CLEAR_ERRORS = 'clear-errors',
  LOAD_MERGE = 'load-merge',
  LOAD_MERGE_ERROR = 'load-merge-error',
  LOAD_MERGE_DATA = 'load-merge-data',
  UPDATE_ACTION_TYPE = 'update-action-type',
  CLEAR_MERGE_DATA = 'clear-merge-data',
  TOGGLE_SHOW_CODE = 'toggle-show-code',
  UPDATE_ACTION_CONFIG = 'update-action-config',
  ADD_DATASET = 'add-dataset',
  REMOVE_DATASET = 'remove-dataset',
  TOGGLE_DATASET = 'toggle-dataset',
  UPDATE_DATASET = 'update-dataset',
}

/** Instance property of the LoadInstanceAction */
export interface InstancesState extends ErrorState {
  data?: MergeInstance[];
}

/** Action fired when merge/stack config is updated */
export interface ConfigUpdateProps<T = any> {
  action: MergeConfigType;
  prop: keyof (MergeConfig | StackConfig | Dataset);
  value: T;
}

/** Properties for identifying the index of a dataset */
interface DatasetIndex {
  index: number;
}

/** Action fired when updating a dataset in a merge config */
export interface UpdateDatasetActionProps<T = any> extends DatasetIndex {
  prop: keyof Dataset;
  value: T;
}

export const MergeActions = {
  InitAction: createActionWithPayload(MergeActionType.INIT_PARAMS),
  LoadingDatasetsAction: createActionWithPayload(MergeActionType.LOADING_DATASETS),
  ClearErrorsAction: createActionWithPayload(MergeActionType.CLEAR_ERRORS),
  LoadMergeAction: createActionWithPayload(MergeActionType.LOAD_MERGE),
  ClearMergeDataAction: createActionWithPayload(MergeActionType.CLEAR_MERGE_DATA),
  ToggleShowCodeAction: createActionWithPayload(MergeActionType.TOGGLE_SHOW_CODE),
  LoadInstancesAction: createActionWithPayload<InstancesState>(MergeActionType.LOAD_INSTANCES),
  LoadMergeErrorAction: createActionWithPayload<ErrorState | undefined>(MergeActionType.LOAD_MERGE_ERROR),
  UpdateMergeActionTypeAction: createActionWithPayload<MergeConfigType>(MergeActionType.UPDATE_ACTION_TYPE),
  ConfigUpdateAction: createActionWithPayload<ConfigUpdateProps>(MergeActionType.UPDATE_ACTION_CONFIG),
  AddDatasetAction: createActionWithPayload<string>(MergeActionType.ADD_DATASET),
  RemoveDatasetAction: createActionWithPayload<number>(MergeActionType.REMOVE_DATASET),
  ToggleDatasetAction: createActionWithPayload<number>(MergeActionType.TOGGLE_DATASET),
  LoadMergeDataAction: createActionWithPayload<number>(MergeActionType.LOAD_MERGE_DATA),
  UpdateDatasetAction: createActionWithPayload<UpdateDatasetActionProps>(MergeActionType.UPDATE_DATASET),
  OpenChartAction: AppActions.OpenChartAction,
  CloseChartAction: AppActions.CloseChartAction,
  LoadPreviewAction: AppActions.LoadPreviewAction,
};
