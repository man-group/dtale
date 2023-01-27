import chroma from 'chroma-js';
import * as React from 'react';

/** Outlier range bounds and color scales */
export interface OutlierRange {
  lower: number;
  upper: number;
  lowerScale?: chroma.Scale;
  upperScale?: chroma.Scale;
}

/** Information for columns of your dataframe */
export interface ColumnDef extends Bounds {
  name: string;
  dtype: string;
  hasMissing?: number;
  hasOutliers?: number;
  outlierRange?: OutlierRange;
  lowVariance?: boolean;
  locked?: boolean;
  unique_ct?: number;
  visible?: boolean;
  coord?: 'lat' | 'lon';
  label?: string;
  index: number;
  resized?: boolean;
  width?: number;
  headerWidth?: number;
  dataWidth?: number;
  skew?: number;
  kurt?: number;
}

/** Type definition for each cell displayed in the DataViewer */
export interface DataRecord {
  view: string;
  raw?: string | number | boolean;
  style?: React.CSSProperties;
}

/** Data storage in DataViewer */
export interface DataViewerData {
  [key: number]: Record<string, DataRecord>;
}

/** Properties for selecting ranges of rows, columns, etc... */
export interface RangeSelection<T> {
  start: T;
  end: T;
}

/** min/max bounds */
export interface Bounds {
  min?: number;
  max?: number;
}

/** Actions available to column filters */
export type ColumnFilterAction = 'equals' | 'startswith' | 'endswith' | 'contains' | 'regex' | 'length';

/** Operands available to column filters */
export type ColumnFilterOperand = '=' | 'ne' | '<' | '>' | '<=' | '>=' | '[]' | '()';

/** Column filter properties */
export interface ColumnFilter extends Bounds {
  type: string;
  query?: string;
  missing?: boolean;
  action?: ColumnFilterAction;
  value?: string | string[] | number | number[];
  raw?: string | number;
  caseSensitive?: boolean;
  operand?: ColumnFilterOperand;
  start?: string;
  end?: string;
}

/** The definition for formatting properties for string columns */
export interface StringColumnFormat {
  link: boolean;
  html: boolean;
  truncate?: number;
}

/** Formatting properties that can't be stored in a format string */
export interface ColumnFormatStyle {
  redNegs?: boolean;
  currency?: string;
}

/** Type definition for a column format configuration object */
export interface ColumnFormat {
  fmt: string | StringColumnFormat;
  style?: ColumnFormatStyle;
  link?: boolean;
  html?: boolean;
  truncate?: number;
}

/** Properties for outlier filters */
export interface OutlierFilter {
  query: string;
}

/** State properties that can be propagated back up into DataViewer from other components */
export interface PropagatedState {
  columns: ColumnDef[];
  rowCount: number;
  triggerResize: boolean;
  fixedColumnCount: number;
  triggerBgResize: boolean;
  data: DataViewerData;
  renameUpdate: (data: DataViewerData) => DataViewerData;
  refresh: boolean;
  formattingUpdate: boolean;
}

/** Type definition for propagating state back to DataViewer */
export type DataViewerPropagateState = (state: Partial<PropagatedState>, callback?: () => void) => void;
