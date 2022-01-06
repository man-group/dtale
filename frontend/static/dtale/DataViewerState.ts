import chroma from 'chroma-js';
import * as React from 'react';
import { MultiGridProps } from 'react-virtualized';
import { Dispatch } from 'redux';

import { AppActions } from '../redux/actions/AppActions';
import { AppState, FilteredRanges, PredefinedFilter, RangeHighlightConfig } from '../redux/state/AppState';

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
  locked?: boolean;
  unique_ct?: number;
  visible?: boolean;
  coord?: 'lat' | 'lon';
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
export interface DataViewerData {
  [key: number]: Record<string, DataRecord>;
}

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
export type ColumnFilterAction = 'equals' | 'startswith' | 'endswith' | 'contains' | 'length';

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

/** Type definition for a column format configuration object */
export type ColumnFormat = Record<string, any>;

/** Properties for outlier filters */
export interface OutlierFilter {
  query: string;
}

/** Settings available to each instance (piece of data) of D-Tale */
export interface InstanceSettings {
  locked?: string[];
  allow_cell_edits: boolean;
  precision: number;
  columnFormats?: Record<string, ColumnFormat>;
  backgroundMode?: string;
  rangeHighlight?: RangeHighlightConfig;
  verticalHeaders: boolean;
  predefinedFilters: Record<string, PredefinedFilter>;
  sortInfo?: string[][];
  nanDisplay?: string;
  startup_code?: string;
  query?: string;
  outlierFilters?: Record<string, OutlierFilter>;
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
  rangeHighlight: RangeHighlightConfig;
  rowRange?: RangeSelection;
  columnRange?: RangeSelection;
  rangeSelect?: RangeSelection;
  ctrlRows?: RangeSelection;
  ctrlCols?: RangeSelection;
  selectedRow?: RangeSelection;
  filteredRanges: FilteredRanges;
  error?: string;
  traceback?: string;
  renameUpdate?: (data: DataViewerData) => DataViewerData;
}

/** Component properties of DataViewer */
export interface DataViewerProps {
  settings: Record<string, any>;
  dataId: string;
  iframe: boolean;
  closeColumnMenu: () => void;
  openChart: (chartData: Record<string, any>) => Dispatch<{ type: 'open-chart'; chartData: Record<string, any> }>;
  theme: string;
  updateFilteredRanges: (query: string) => (dispatch: AppActions<Promise<void>>, getState: () => AppState) => void;
  menuPinned: boolean;
  ribbonMenuOpen: boolean;
  dataViewerUpdate?: DataViewerUpdate;
  clearDataViewerUpdate: () => Dispatch<{ type: 'clear-data-viewer-update' }>;
  maxColumnWidth?: number;
  editedTextAreaHeight?: number;
  verticalHeaders: boolean;
}

/** Type definition for propagating state back to DataViewer */
export type DataViewerPropagateState = (state: Partial<DataViewerState>, callback?: () => void) => void;
