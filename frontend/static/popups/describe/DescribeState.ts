/** data record for unique data */
export interface UniqueRecord {
  value: string;
  count: number;
}

/** information about unique values for a column */
export interface UniquesData {
  data: UniqueRecord[];
  top?: boolean;
  total?: number;
}

/** sequential differences for a column */
export interface SequentialDiffs {
  diffs: UniquesData;
  min: string;
  max: string;
  avg: string;
}

/** outliers for a column */
export interface OutliersData {
  outliers: string[];
  top?: boolean;
  code: string;
  queryApplied: boolean;
  query: string;
}

/** descriptive statistical data for a column */
export interface DetailData {
  describe: { [key: string]: string };
  uniques: UniquesData;
  dtype_counts: Array<{ dtype: string; count: number }>;
  sequential_diffs: SequentialDiffs;
  string_metrics: { [key: string]: string };
}

/** unique word values for a string-based column */
export interface WordValueState {
  viewWordValues: boolean;
  wordValues?: UniqueRecord[];
}

/** Placeholder for visibility of columns */
export interface VisibilityState {
  [key: string]: boolean;
}
