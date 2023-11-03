import { ErrorState } from '../repository/GenericRepository';

import { Dataset, MergeConfig, MergeConfigType, MergeInstance, MergeState, StackConfig } from './state/MergeState';

export const selectInstances = (state: MergeState): MergeInstance[] => state.instances;
export const selectLoading = (state: MergeState): boolean => state.loading;
export const selectLoadingDatasets = (state: MergeState): boolean => state.loadingDatasets;
export const selectAction = (state: MergeState): MergeConfigType => state.action;
export const selectDatasets = (state: MergeState): Dataset[] => state.datasets;
export const selectLoadingError = (state: MergeState): ErrorState | null => state.loadingError;
export const selectMergeError = (state: MergeState): ErrorState | null => state.mergeError;
export const selectMergeConfig = (state: MergeState): MergeConfig => state.mergeConfig;
export const selectStackConfig = (state: MergeState): StackConfig => state.stackConfig;
export const selectShowCode = (state: MergeState): boolean => state.showCode;
export const selectMergeDataId = (state: MergeState): string | null => state.mergeDataId;
export const selectLoadingMerge = (state: MergeState): boolean => state.loadingMerge;
