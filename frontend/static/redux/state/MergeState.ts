import { ColumnDef } from '../../dtale/DataViewerState';
import { ErrorState } from '../../repository/GenericRepository';

import { Popups } from './AppState';

/** Properties for a merge instance */
export interface MergeInstance {
  data_id: string;
  name?: string;
  rows: number;
  columns: string;
  names: ColumnDef[];
}

/** Types of merge configurations */
export enum MergeConfigType {
  MERGE = 'merge',
  STACK = 'stack',
}

/** Different merge styles */
export enum HowToMerge {
  LEFT = 'left',
  RIGHT = 'right',
  INNER = 'inner',
  OUTER = 'outer',
}

/** Properties of a merge configuration */
export interface MergeConfig {
  how: HowToMerge;
  sort: boolean;
  indicator: boolean;
}

export const initialMergeConfig: MergeConfig = {
  how: HowToMerge.INNER,
  sort: false,
  indicator: false,
};

/** Properties of a stack configuration */
export interface StackConfig {
  ignoreIndex: boolean;
}

export const initialStackConfig: StackConfig = {
  ignoreIndex: false,
};

/** Properties of a dataset used in a merge/stack */
export interface Dataset {
  dataId: string | null;
  index: ColumnDef[];
  columns: ColumnDef[];
  suffix: string | null;
  isOpen: boolean;
  isDataOpen: boolean;
}

export const initialDataset: Dataset = {
  dataId: null,
  index: [],
  columns: [],
  suffix: null,
  isOpen: true,
  isDataOpen: false,
};

/** State properties of the merge popup */
export interface MergeState {
  chartData: Popups;
  instances: MergeInstance[];
  loading: boolean;
  loadingDatasets: boolean;
  loadingError: ErrorState | null;
  loadingMerge: boolean;
  mergeError: ErrorState | null;
  action: MergeConfigType;
  mergeConfig: MergeConfig;
  stackConfig: StackConfig;
  datasets: Dataset[];
  showCode: boolean;
  mergeDataId: string | null;
}
