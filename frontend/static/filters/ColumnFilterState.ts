import { ColumnFilter } from '../dtale/DataViewerState';

/** Base component properties for column filters (string, date, numeric) */
export interface BaseColumnFilterProps {
  selectedCol: string;
  columnFilter?: ColumnFilter;
  updateState: (state?: ColumnFilter) => Promise<void>;
  missing: boolean;
}

/** Component properties related to unique values of a column */
export interface UniquesProps {
  uniques: string[];
  uniqueCt: number;
}
