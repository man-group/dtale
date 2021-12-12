import chroma from 'chroma-js';
import * as React from 'react';
import { Dispatch } from 'react-redux';
import { MultiGridProps } from 'react-virtualized';

import { FilteredRanges, PredefinedFilter, RangeHighlight } from '../redux/state/AppState';

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
  hasMissing?: boolean;
  hasOutliers?: boolean;
  outlierRange?: OutlierRange;
  lowVariance?: boolean;
  locked: boolean;
}

/** Type definition for each cell displayed in the DataViewer */
export interface DataRecord {
  view: string;
  raw?: string | number | null;
  style?: React.CSSProperties;
}

/** Update specification for DataViewer */
export interface DataViewerUpdate extends Record<string, any> {
  type: string;
}

/** Data storage in DataViewer */
export type DataViewerData = Record<number, Record<string, DataRecord>>;

/** Properties for selecting ranges of rows, columns, etc... */
interface RangeSelection {
  start: number;
  end: number;
}

/** min/max bounds */
export interface Bounds {
  min?: number;
  max?: number;
}

/** Actions available to column filters */
type ColumnFilterAction = 'equals' | 'startswith' | 'endswith' | 'contains' | 'length';

/** Operands available to column filters */
type ColumnFilterOperand = '=' | 'ne' | '<' | '>' | '<=' | '>=' | '[]' | '()';

/** Column filter properties */
export interface ColumnFilter extends Bounds {
  type: string;
  query?: string;
  missing?: boolean;
  action?: ColumnFilterAction;
  value?: string | number;
  raw?: string | number;
  caseSensitive?: boolean;
  operand?: ColumnFilterOperand;
  start?: string;
  end?: string;
}

/** Type definition for a column format configuration object */
export type ColumnFormat = Record<string, any>;

/** Settings available to each instance (piece of data) of D-Tale */
export interface InstanceSettings {
  locked?: string[];
  allow_cell_edits: boolean;
  precision: number;
  columnFormats?: Record<string, ColumnFormat>;
  backgroundMode?: string;
  rangeHighlight?: RangeHighlight;
  verticalHeaders: boolean;
  predefinedFilters: Record<string, PredefinedFilter>;
  sortInfo?: string[][];
  nanDisplay?: string;
  startup_code?: string;
  query?: string;
  outlierFilters?: Record<string, string>;
  filteredRanges?: FilteredRanges;
  columnFilters?: Record<string, ColumnFilter>;
}

/** State properties of DataViewer */
export interface DataViewerState extends MultiGridProps, Bounds {
  columnFormats: Record<string, Record<string, any>>;
  nanDisplay?: string;
  data: DataViewerData;
  loading: boolean;
  ids: number[];
  loadQueue: number[][];
  columns: ColumnDef[];
  selectedCols: string[];
  menuOpen: boolean;
  formattingOpen: boolean;
  triggerResize: boolean;
  backgroundMode?: string;
  rangeHighlight: RangeHighlight;
  rowRange?: RangeSelection;
  columnRange: RangeSelection;
  rangeSelect: RangeSelection;
  ctrlRows: RangeSelection;
  ctrlCols: RangeSelection;
  selectedRow: RangeSelection;
  filteredRanges: FilteredRanges;
  error?: string;
  traceback?: string;
}

/** Component properties of DataViewer */
export interface DataViewerProps {
  settings: Record<string, any>;
  dataId: string;
  iframe: boolean;
  closeColumnMenu: () => void;
  openChart: (chartData: Record<string, any>) => Dispatch<{ type: 'open-chart'; chartData: Record<string, any> }>;
  theme: string;
  updateFilteredRanges: (
    query: string,
  ) => (dispatch: Dispatch<Record<string, any>>, getState: () => Record<string, any>) => void;
  menuPinned: boolean;
  ribbonMenuOpen: boolean;
  dataViewerUpdate?: DataViewerUpdate;
  clearDataViewerUpdate: () => Dispatch<{ type: 'clear-data-viewer-update' }>;
  maxColumnWidth?: number;
  editedTextAreaHeight?: number;
  verticalHeaders: boolean;
}
