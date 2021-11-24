import chroma from 'chroma-js';
import * as React from 'react';
import { RGBColor } from 'react-color';
import { Dispatch } from 'react-redux';
import { MultiGridProps } from 'react-virtualized';

/** Outlier range bounds and color scales */
export interface OutlierRange {
  lower: number;
  upper: number;
  lowerScale?: chroma.Scale;
  upperScale?: chroma.Scale;
}

/** Information for columns of your dataframe */
export interface ColumnDef {
  name: string;
  dtype: string;
  min?: number;
  max?: number;
  hasMissing?: boolean;
  hasOutliers?: boolean;
  outlierRange?: OutlierRange;
  lowVariance?: boolean;
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

/** Object which can be turned on/off */
interface HasActivation {
  active: boolean;
}

/** Range highlight configuration properties */
interface RangeHighlightModeCfg {
  active: boolean;
  value: number;
  color: RGBColor;
}

/** Different types of range highlighting */
export interface RangeHighlightModes {
  equals: RangeHighlightModeCfg;
  greaterThan: RangeHighlightModeCfg;
  lessThan: RangeHighlightModeCfg;
}

/** Range highlighting for individual columns or "all" columns */
interface RangeHighlight extends Record<string, RangeHighlightModes & HasActivation> {
  all: RangeHighlightModes & HasActivation;
}

/** Properties for selecting ranges of rows, columns, etc... */
interface RangeSelection {
  start: number;
  end: number;
}

/** min/max bounds */
interface Bounds {
  min: number;
  max: number;
}

/** Properties for specifying filtered ranges */
interface FilteredRanges {
  query?: string;
  dtypes?: ColumnDef[];
  ranges?: Record<string, Bounds>;
  overall?: Bounds;
}

/** State properties of DataViewer */
export interface DataViewerState extends MultiGridProps {
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
  min?: number;
  max?: number;
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
