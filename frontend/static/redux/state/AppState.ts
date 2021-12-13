import { RGBColor } from 'react-color';

import { Bounds, ColumnDef, ColumnFilter, ColumnFormat } from '../../dtale/DataViewerState';

/** Object which can be turned on/off */
export interface HasActivation {
  active: boolean;
}

/** Object which has a visiblity flag */
export interface HasVisibility {
  visible: boolean;
}

export const initialVisibility = { visible: false };

/** Properties of a main menu tooltip */
export interface MenuTooltipProps extends HasVisibility {
  element?: HTMLLIElement;
  content?: string;
}

/** Properties of a ribbon menu dropdown */
export interface RibbonDropdownProps extends HasVisibility {
  element?: HTMLDivElement;
  name?: string;
}

/** Properties of the current side panel */
export interface SidePanelProps extends HasVisibility {
  view?: string;
  column?: string;
  offset?: number;
}

/** Different types of data viewer updates */
export enum DataViewerUpdateType {
  TOGGLE_COLUMNS = 'toggle-columns',
  UPDATE_MAX_WIDTH = 'update-max-width',
  UPDATE_MAX_HEIGHT = 'update-max-height',
  DROP_COLUMNS = 'drop-columns',
}

/** Properties of a data viewer update */
export interface DataViewerUpdateProps {
  type: DataViewerUpdateType;
  width?: number;
  height?: number;
  columns?: string[];
}

/** Type definition for any data for a chart popup */
export type ChartData = HasVisibility & Record<string, any>;

/** Settings available to each instance (piece of data) of D-Tale */
export interface InstanceSettings {
  locked?: string[];
  allow_cell_edits?: boolean;
  precision?: number;
  columnFormats?: Record<string, ColumnFormat>;
  backgroundMode?: string;
  rangeHighlight?: RangeHighlight;
  verticalHeaders?: boolean;
  predefinedFilters?: Record<string, PredefinedFilter>;
  sortInfo?: string[][];
  nanDisplay?: string;
  startup_code?: string;
  query?: string;
  outlierFilters?: Record<string, string>;
  filteredRanges?: FilteredRanges;
  columnFilters?: Record<string, ColumnFilter>;
}

/** Type definition for semantic versioning of python */
export type Version = [number, number, number];

/** Different themes available for D-Tale */
export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
}

/** Python query engines for executing custom queries */
export enum QueryEngine {
  PYTHON = 'python',
  NUMEXPR = 'numexpr',
}

/** Application-level settings */
export interface AppSettings {
  hideShutdown: boolean;
  openCustomFilterOnStartup: boolean;
  openPredefinedFiltersOnStartup: boolean;
  hideDropRows: boolean;
  allowCellEdits: boolean;
  theme: ThemeType;
  language: string;
  pythonVersion: Version | null;
  isVSCode: boolean;
  maxColumnWidth: number | null;
  maxRowHeight: number | null;
  mainTitle: string | null;
  mainTitleFont: string | null;
  queryEngine: QueryEngine;
  showAllHeatmapColumns: boolean;
}

/** Properties for specifying filtered ranges */
export interface FilteredRanges {
  query?: string;
  dtypes?: ColumnDef[];
  ranges?: Record<string, Bounds>;
  overall?: Bounds;
}

/** Predefined filter properties */
export interface PredefinedFilter extends HasActivation {
  column: string;
  default: string | number;
  description?: string;
  inputType: 'input' | 'select' | 'multiselect';
  name: string;
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
export interface RangeHighlight extends Record<string, RangeHighlightModes & HasActivation> {
  all: RangeHighlightModes & HasActivation;
}

/** Properties of application state */
export interface AppState extends AppSettings {
  chartData: ChartData;
  dataId: string;
  editedCell: string | null;
  editedTextAreaHeight: number;
  iframe: boolean;
  columnMenuOpen: boolean;
  selectedCol: string | null;
  selectedColRef: HTMLDivElement | null;
  xarray: boolean;
  xarrayDim: Record<string, boolean>;
  filteredRanges: FilteredRanges;
  settings: InstanceSettings;
  isPreview: boolean;
  menuPinned: boolean;
  menuTooltip: MenuTooltipProps;
  ribbonMenuOpen: boolean;
  ribbonDropdown: RibbonDropdownProps;
  sidePanel: SidePanelProps;
  dataViewerUpdate: DataViewerUpdateProps | null;
  predefinedFilters: PredefinedFilter[];
  dragResize: number | null;
  auth: boolean;
  username: string | null;
}
