import { AnyAction, combineReducers } from 'redux';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ErrorState } from '../../../repository/GenericRepository';
import { ConfigUpdateAction, MergeActionType, MergeAppActionTypes } from '../../actions/MergeActions';
import {
  Dataset,
  HowToMerge,
  initialDataset,
  initialMergeConfig,
  initialStackConfig,
  MergeConfig,
  MergeConfigType,
  MergeInstance,
  StackConfig,
} from '../../state/MergeState';

/**
 * Reducer managing instances available for merging.
 *
 * @param state the current redux state of instances.
 * @param mergeAction application event.
 * @return the updated instances.
 */
export function instances(state: MergeInstance[] = [], mergeAction: MergeAppActionTypes): MergeInstance[] {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_INSTANCES:
      return mergeAction.instances.data || [];
    default:
      return state;
  }
}

/**
 * Reducer managing the loading flag.
 *
 * @param state the current redux state of loading.
 * @param mergeAction application event.
 * @return the updated loading.
 */
export function loading(state = true, mergeAction: MergeAppActionTypes): boolean {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_INSTANCES:
      return false;
    default:
      return state;
  }
}

/**
 * Reducer managing the loadingDatasets flag.
 *
 * @param state the current redux state of loadingDatasets.
 * @param mergeAction application event.
 * @return the updated loadingDatasets.
 */
export function loadingDatasets(state = false, mergeAction: MergeAppActionTypes): boolean {
  switch (mergeAction.type) {
    case MergeActionType.LOADING_DATASETS:
      return true;
    case MergeActionType.LOAD_INSTANCES:
      return false;
    default:
      return state;
  }
}

/**
 * Reducer managing the state of any loading error.
 *
 * @param state the current redux state of loadingError.
 * @param mergeAction application event.
 * @return the updated loadingError.
 */
export function loadingError(state: ErrorState | null = null, mergeAction: MergeAppActionTypes): ErrorState | null {
  switch (mergeAction.type) {
    case MergeActionType.CLEAR_ERRORS:
      return null;
    case MergeActionType.LOAD_INSTANCES:
      return mergeAction.instances.error ? mergeAction.instances : null;
    default:
      return state;
  }
}

/**
 * Reducer managing the state of the loadingMerge flag.
 *
 * @param state the current redux state of loadingMerge.
 * @param mergeAction application event.
 * @return the updated loadingMerge.
 */
export function loadingMerge(state = false, mergeAction: MergeAppActionTypes): boolean {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_MERGE:
      return true;
    case MergeActionType.LOAD_MERGE_ERROR:
    case MergeActionType.LOAD_MERGE_DATA:
      return false;
    default:
      return state;
  }
}

/**
 * Reducer managing the state of any merge error.
 *
 * @param state the current redux state of mergeError.
 * @param mergeAction application event.
 * @return the updated mergeError.
 */
export function mergeError(state: ErrorState | null = null, mergeAction: MergeAppActionTypes): ErrorState | null {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_MERGE:
    case MergeActionType.LOAD_MERGE_DATA:
    case MergeActionType.CLEAR_ERRORS:
      return null;
    case MergeActionType.LOAD_MERGE_ERROR:
      return mergeAction.error ?? null;
    default:
      return state;
  }
}

/**
 * Reducer managing the state of the merge config action.
 *
 * @param state the current redux state of action.
 * @param mergeAction application event.
 * @return the updated action.
 */
export function action(state = MergeConfigType.MERGE, mergeAction: MergeAppActionTypes): MergeConfigType {
  switch (mergeAction.type) {
    case MergeActionType.UPDATE_ACTION_TYPE:
      return mergeAction.action;
    default:
      return state;
  }
}

const mergeReducers = combineReducers<MergeConfig>({
  how: (state = initialMergeConfig.how, mergeAction: ConfigUpdateAction<HowToMerge>): HowToMerge =>
    mergeAction.prop === 'how' ? mergeAction.value : state,
  sort: (state = initialMergeConfig.sort, mergeAction: ConfigUpdateAction<boolean>): boolean =>
    mergeAction.prop === 'sort' ? mergeAction.value : state,
  indicator: (state = initialMergeConfig.indicator, mergeAction: ConfigUpdateAction<boolean>): boolean =>
    mergeAction.prop === 'indicator' ? mergeAction.value : state,
});

const stackReducers = combineReducers<StackConfig>({
  ignoreIndex: (state = initialStackConfig.ignoreIndex, mergeAction: ConfigUpdateAction<boolean>): boolean =>
    mergeAction.prop === 'ignoreIndex' ? mergeAction.value : state,
});

/**
 * Reducer managing the state of the merge config.
 *
 * @param state the current redux state of mergeConfig.
 * @param mergeAction application event.
 * @return the updated mergeConfig.
 */
export function mergeConfig(state: MergeConfig = initialMergeConfig, mergeAction: MergeAppActionTypes): MergeConfig {
  if (
    (mergeAction.type === MergeActionType.UPDATE_ACTION_CONFIG && mergeAction.action === MergeConfigType.MERGE) ||
    mergeAction.type === MergeActionType.INIT_PARAMS
  ) {
    return mergeReducers(state, mergeAction);
  }
  return state;
}

/**
 * Reducer managing the state of the stack config.
 *
 * @param state the current redux state of stackConfig.
 * @param mergeAction application event.
 * @return the updated stackConfig.
 */
export function stackConfig(state: StackConfig = initialStackConfig, mergeAction: MergeAppActionTypes): StackConfig {
  if (
    (mergeAction.type === MergeActionType.UPDATE_ACTION_CONFIG && mergeAction.action === MergeConfigType.STACK) ||
    mergeAction.type === MergeActionType.INIT_PARAMS
  ) {
    return stackReducers(state, mergeAction);
  }
  return state;
}

const datasetReducers = combineReducers<Dataset>({
  dataId: (state: string | null = null, mergeAction: ConfigUpdateAction<string>): string | null =>
    mergeAction.prop === 'dataId' ? mergeAction.value : state,
  index: (state: ColumnDef[] = [], mergeAction: ConfigUpdateAction<ColumnDef[]>): ColumnDef[] =>
    (mergeAction.prop === 'index' ? mergeAction.value : state).map((c) => ({ ...c })),
  columns: (state: ColumnDef[] = [], mergeAction: ConfigUpdateAction<ColumnDef[]>): ColumnDef[] =>
    (mergeAction.prop === 'columns' ? mergeAction.value : state).map((c) => ({ ...c })),
  suffix: (state: string | null = null, mergeAction: ConfigUpdateAction<string>): string | null =>
    mergeAction.prop === 'suffix' ? mergeAction.value : state,
  isOpen: (state = initialDataset.isOpen, mergeAction: ConfigUpdateAction<boolean>): boolean =>
    mergeAction.prop === 'isOpen' ? mergeAction.value : state,
  isDataOpen: (state = initialDataset.isDataOpen, mergeAction: ConfigUpdateAction<boolean>): boolean =>
    mergeAction.prop === 'isDataOpen' ? mergeAction.value : state,
});

/**
 * Reducer managing the state of the datasets being used in your merge.
 *
 * @param state the current redux state of datasets.
 * @param mergeAction application event.
 * @return the updated datasets.
 */
export function datasets(state: Dataset[] = [], mergeAction: MergeAppActionTypes): Dataset[] {
  switch (mergeAction.type) {
    case MergeActionType.ADD_DATASET:
      return [
        ...state.map((d) => ({ ...d, isOpen: false })),
        datasetReducers({ ...initialDataset }, {
          ...mergeAction,
          prop: 'dataId',
          value: mergeAction.dataId,
        } as AnyAction),
      ];
    case MergeActionType.REMOVE_DATASET:
      return state.filter((_, i) => i !== mergeAction.index).map((d, i) => ({ ...d, isOpen: i === state.length - 2 }));
    case MergeActionType.TOGGLE_DATASET:
      return state.map((d, i) => (i === mergeAction.index ? { ...d, isOpen: !d.isOpen } : d));
    case MergeActionType.UPDATE_DATASET:
      return state.map((d, i) => (i === mergeAction.index ? datasetReducers(d, mergeAction) : d));
    default:
      return state;
  }
}

/**
 * Reducer managing the state of the showCode flag.
 *
 * @param state the current redux state of showCode.
 * @param mergeAction application event.
 * @return the updated showCode.
 */
export function showCode(state = true, mergeAction: MergeAppActionTypes): boolean {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_MERGE_DATA:
      return false;
    case MergeActionType.CLEAR_MERGE_DATA:
      return true;
    case MergeActionType.TOGGLE_SHOW_CODE:
      return !state;
    default:
      return state;
  }
}

/**
 * Reducer managing the state of the dataId for any merge data.
 *
 * @param state the current redux state of mergeDataId.
 * @param mergeAction application event.
 * @return the updated mergeDataId.
 */
export function mergeDataId(state: string | null = null, mergeAction: MergeAppActionTypes): string | null {
  switch (mergeAction.type) {
    case MergeActionType.LOAD_MERGE_DATA:
      return `${mergeAction.dataId}`;
    case MergeActionType.CLEAR_MERGE_DATA:
      return null;
    default:
      return state;
  }
}
