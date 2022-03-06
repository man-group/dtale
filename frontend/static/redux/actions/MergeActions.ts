import { Action, AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { ErrorState } from '../../repository/GenericRepository';
import { Dataset, MergeConfig, MergeConfigType, MergeInstance, MergeState, StackConfig } from '../state/MergeState';

import { CloseChartAction, OpenChartAction } from './AppActions';

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

/** Action fired when merge popup initially loads */
export type InitAction = Action<typeof MergeActionType.INIT_PARAMS>;

/** Action fired when loading datasets */
export type LoadingDatasetsAction = Action<typeof MergeActionType.LOADING_DATASETS>;

/** Action fired when clearing errors */
export type ClearErrorsAction = Action<typeof MergeActionType.CLEAR_ERRORS>;

/** Action fired when loading a merge */
export type LoadMergeAction = Action<typeof MergeActionType.LOAD_MERGE>;

/** Action fired when clearing merge data */
export type ClearMergeDataAction = Action<typeof MergeActionType.CLEAR_MERGE_DATA>;

/** Action fired when toggling the display of the example code */
export type ToggleShowCodeAction = Action<typeof MergeActionType.TOGGLE_SHOW_CODE>;

/** Instance property of the LoadInstanceAction */
export interface InstancesState extends ErrorState {
  data?: MergeInstance[];
}

/** Action fired when instances have been loaded */
export interface LoadInstancesAction extends Action<typeof MergeActionType.LOAD_INSTANCES> {
  instances: InstancesState;
}

/** Action fired when there has been an error loading a merge */
export interface LoadMergeErrorAction extends Action<typeof MergeActionType.LOAD_MERGE_ERROR> {
  error?: ErrorState;
}

/** Action fired when updating the merge action */
export interface UpdateMergeActionTypeAction extends Action<typeof MergeActionType.UPDATE_ACTION_TYPE> {
  action: MergeConfigType;
}

/** Action fired when merge/stack config is updated */
export interface ConfigUpdateProps<T> {
  action: MergeConfigType;
  prop: keyof (MergeConfig | StackConfig | Dataset);
  value: T;
}

/** Flexible object for updating properties on an merge/stack config */
export type ConfigUpdateAction<T = any> = Action<MergeActionType.UPDATE_ACTION_CONFIG> & ConfigUpdateProps<T>;

/** Properties for identifying the index of a dataset */
interface DatasetIndex {
  index: number;
}

/** Action fired when adding a dataset to a merge config */
export type AddDatasetAction = Action<typeof MergeActionType.ADD_DATASET> & { dataId: string };

/** Action fired when removing a dataset from a merge config */
export type RemoveDatasetAction = Action<typeof MergeActionType.REMOVE_DATASET> & DatasetIndex;

/** Action fired when toggling the display of a merge config dataset */
export type ToggleDatasetAction = Action<typeof MergeActionType.TOGGLE_DATASET> & DatasetIndex;

/** Action fired when updating a dataset in a merge config */
export interface UpdateDatasetAction<T = any> extends Action<typeof MergeActionType.UPDATE_DATASET>, DatasetIndex {
  prop: keyof Dataset;
  value: T;
}

/** Action fired when merge data has been loaded */
export interface LoadMergeDataAction extends Action<typeof MergeActionType.LOAD_MERGE_DATA> {
  dataId: number;
}

/** Type definition encompassing all merge popup actions */
export type MergeAppActionTypes =
  | InitAction
  | LoadingDatasetsAction
  | ClearErrorsAction
  | LoadMergeAction
  | LoadInstancesAction
  | LoadMergeErrorAction
  | UpdateMergeActionTypeAction
  | AddDatasetAction
  | RemoveDatasetAction
  | ToggleDatasetAction
  | UpdateDatasetAction
  | LoadMergeDataAction
  | ClearMergeDataAction
  | ToggleShowCodeAction
  | LoadMergeDataAction
  | OpenChartAction
  | CloseChartAction
  | ConfigUpdateAction;

/** Type definition for redux merge popup actions */
export type MergeAppActions<R> = ThunkAction<R, MergeState, Record<string, unknown>, AnyAction>;
