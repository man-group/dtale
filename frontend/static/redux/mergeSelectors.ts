import { ErrorState } from '../repository/GenericRepository';

import { MergeStoreState } from './reducers/merge';
import { Dataset, MergeConfig, MergeConfigType, MergeInstance, StackConfig } from './state/MergeState';

export const selectInstances = (state: MergeStoreState): MergeInstance[] => state.instances;
export const selectLoading = (state: MergeStoreState): boolean => state.loading;
export const selectLoadingDatasets = (state: MergeStoreState): boolean => state.loadingDatasets;
export const selectAction = (state: MergeStoreState): MergeConfigType => state.action;
export const selectDatasets = (state: MergeStoreState): Dataset[] => state.datasets;
export const selectLoadingError = (state: MergeStoreState): ErrorState | null => state.loadingError;
export const selectMergeError = (state: MergeStoreState): ErrorState | null => state.mergeError;
export const selectMergeConfig = (state: MergeStoreState): MergeConfig => state.mergeConfig;
export const selectStackConfig = (state: MergeStoreState): StackConfig => state.stackConfig;
export const selectShowCode = (state: MergeStoreState): boolean => state.showCode;
export const selectMergeDataId = (state: MergeStoreState): string | null => state.mergeDataId;
export const selectLoadingMerge = (state: MergeStoreState): boolean => state.loadingMerge;
