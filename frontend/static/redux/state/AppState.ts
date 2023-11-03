import { RGBColor } from 'react-color';

import {
  Bounds,
  ColumnDef,
  ColumnFilter,
  ColumnFormat,
  DataViewerPropagateState,
  OutlierFilter,
  RangeSelection,
} from '../../dtale/DataViewerState';

/** Base properties for react-select dropdown options */
export interface BaseOption<T> {
  value: T;
  label?: string | null;
}

/** Base properties for ButtonToggle options */
export interface ButtonOption<T> {
  value: T;
  label?: string | React.ReactNode;
}

/** Object which can be turned on/off */
export interface HasActivation {
  active: boolean;
}

/** Object which has a visiblity flag */
export interface HasVisibility {
  visible: boolean;
}

export const initialVisibility: HasVisibility = { visible: false };

/** Properties of a main menu tooltip */
export interface MenuTooltipProps extends HasVisibility {
  element?: HTMLElement;
  content?: React.ReactNode;
}

/** Ribbon dropdown types */
export enum RibbonDropdownType {
  MAIN = 'main',
  ACTIONS = 'actions',
  VISUALIZE = 'visualize',
  HIGHLIGHT = 'highlight',
  SETTINGS = 'settings',
}

/** Properties of a ribbon menu dropdown */
export interface RibbonDropdownProps extends HasVisibility {
  element?: HTMLDivElement;
  name?: RibbonDropdownType;
}

/** Side panel types */
export enum SidePanelType {
  SHOW_HIDE = 'show_hide',
  DESCRIBE = 'describe',
  MISSINGNO = 'missingno',
  CORR_ANALYSIS = 'corr_analysis',
  CORRELATIONS = 'correlations',
  PPS = 'pps',
  FILTER = 'filter',
  PREDEFINED_FILTERS = 'predefined_filters',
  GAGE_RNR = 'gage_rnr',
  TIMESERIES_ANALYSIS = 'timeseries_analysis',
}

/** Properties of the current side panel */
export interface SidePanelProps extends HasVisibility {
  view?: SidePanelType;
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

/** Base properties for a DataViewer update */
interface BaseDataViewerUpdateProps<T extends DataViewerUpdateType> {
  type: T;
}

/** Toggle columns DataViewer update */
export interface ToggleColumnsDataViewerUpdate extends BaseDataViewerUpdateProps<DataViewerUpdateType.TOGGLE_COLUMNS> {
  columns: Record<string, boolean>;
}

/** Update maximum width DataViewer update */
export interface UpdateMaxWidthDataViewerUpdate
  extends BaseDataViewerUpdateProps<DataViewerUpdateType.UPDATE_MAX_WIDTH> {
  width: number;
}

/** Update maximum row height DataViewer update */
export type UpdateMaxHeightDataViewerUpdate = BaseDataViewerUpdateProps<DataViewerUpdateType.UPDATE_MAX_HEIGHT>;

/** Drop columns DataViewer update */
export interface DropColumnsDataViewerUpdate extends BaseDataViewerUpdateProps<DataViewerUpdateType.DROP_COLUMNS> {
  columns: string[];
}

/** DataViewer updates */
export type DataViewerUpdate =
  | ToggleColumnsDataViewerUpdate
  | UpdateMaxWidthDataViewerUpdate
  | UpdateMaxHeightDataViewerUpdate
  | DropColumnsDataViewerUpdate;

/** Popup type names */
export enum PopupType {
  HIDDEN = 'hidden',
  FILTER = 'filter',
  COLUMN_ANALYSIS = 'column-analysis',
  CORRELATIONS = 'correlations',
  PPS = 'pps',
  BUILD = 'build',
  TYPE_CONVERSION = 'type-conversion',
  CLEANERS = 'cleaners',
  RESHAPE = 'reshape',
  ABOUT = 'about',
  CONFIRM = 'confirm',
  COPY_RANGE = 'copy-range',
  COPY_COLUMN_RANGE = 'copy-column-range',
  COPY_ROW_RANGE = 'copy-row-range',
  RANGE = 'range',
  XARRAY_DIMENSIONS = 'xarray-dimensions',
  XARRAY_INDEXES = 'xarray-indexes',
  RENAME = 'rename',
  REPLACEMENT = 'replacement',
  ERROR = 'error',
  INSTANCES = 'instances',
  VARIANCE = 'variance',
  UPLOAD = 'upload',
  DUPLICATES = 'duplicates',
  CHARTS = 'charts',
  DESCRIBE = 'describe',
  EXPORT = 'export',
  ARCTICDB = 'arcticdb',
  JUMP_TO_COLUMN = 'jump_to_column',
}

/** Configuration for any data for a popup */
export interface PopupData<T extends PopupType> extends HasVisibility {
  type: T;
  title?: string;
  size?: 'sm' | 'lg' | 'xl';
  backdrop?: true | false | 'static';
}

/** Object which has a selected column */
interface HasColumnSelection {
  selectedCol: string;
}

/** Popup configuration for About popup */
export type HiddenPopupData = PopupData<typeof PopupType.HIDDEN>;

export const initialPopup: HiddenPopupData = { ...initialVisibility, type: PopupType.HIDDEN };

/** Popup configuration for About popup */
export type AboutPopupData = PopupData<typeof PopupType.ABOUT>;

/** Popup configuration for Confirmation popup */
export interface ConfirmationPopupData extends PopupData<typeof PopupType.CONFIRM> {
  msg: string;
  yesAction?: () => void;
}

/** Base popup configuration for copying ranges */
interface BaseCopyRangeToClipboardData {
  text: string;
  headers: string[];
}

/** Popup configuration for CopyRangeToClipbard popup */
export type CopyRangeToClipboardPopupData = PopupData<typeof PopupType.COPY_RANGE> & BaseCopyRangeToClipboardData;

/** Popup configuration for CopyRangeToClipbard popup */
export type CopyColumnRangeToClipboardPopupData = PopupData<typeof PopupType.COPY_COLUMN_RANGE> &
  BaseCopyRangeToClipboardData;

/** Popup configuration for CopyRangeToClipbard popup */
export type CopyRowRangeToClipboardPopupData = PopupData<typeof PopupType.COPY_ROW_RANGE> &
  BaseCopyRangeToClipboardData;

/** Popup configuration for Error popup */
export interface ErrorPopupData extends PopupData<typeof PopupType.ERROR> {
  error: string;
  traceback?: string;
}

/** Popup configuration for Error popup */
export interface ExportPopupData extends PopupData<typeof PopupType.EXPORT> {
  rows: number;
}

/** Popup configuration for Error popup */
export interface RenamePopupData extends PopupData<typeof PopupType.RENAME>, HasColumnSelection {
  columns: ColumnDef[];
}

/** Popup configuration for JumpToColumn popup */
export interface JumpToColumnPopupData extends PopupData<typeof PopupType.JUMP_TO_COLUMN> {
  columns: ColumnDef[];
}

/** Popup configuration for RangeHighlight popup */
export interface RangeHighlightPopupData extends PopupData<typeof PopupType.RANGE> {
  rangeHighlight?: RangeHighlightConfig;
  backgroundMode?: string;
  columns: ColumnDef[];
}

/** Popup configuration for XArrayDimensions popup */
export type XArrayDimensionsPopupData = PopupData<typeof PopupType.XARRAY_DIMENSIONS>;

/** Popup configuration for XArrayIndexes popup */
export interface XArrayIndexesPopupData extends PopupData<typeof PopupType.XARRAY_INDEXES> {
  columns: ColumnDef[];
}

/** Base properties for any column analysis popup */
export interface BaseColumnAnalysisPopupData extends HasColumnSelection {
  query?: string;
}

/** Popup configuration for ColumnAnalysis popup */
export type ColumnAnalysisPopupData = PopupData<typeof PopupType.COLUMN_ANALYSIS> & BaseColumnAnalysisPopupData;

/** Base properties for Correlation popups */
export interface BaseCorrelationsPopupData {
  col1?: string;
  col2?: string;
}

/** Popup configuration for Correlations popup */
export interface CorrelationsPopupData extends PopupData<typeof PopupType.CORRELATIONS>, BaseCorrelationsPopupData {
  query?: string;
}

/** Popup configuration for Predictive Power Score popup */
export type PPSPopupData = PopupData<typeof PopupType.PPS> & BaseCorrelationsPopupData;

/** Base popup configuration for column creation */
interface BaseCreateColumnPopupData {
  selectedCol?: string;
}

/** Popup configuration for Create Column popup */
export type CreateColumnPopupData = PopupData<typeof PopupType.BUILD> & BaseCreateColumnPopupData;

/** Popup configuration for Create Column - Type Conversion popup */
export type CreateTypeConversionPopupData = PopupData<typeof PopupType.TYPE_CONVERSION> & BaseCreateColumnPopupData;

/** Popup configuration for Create Column - Cleaners popup */
export type CreateCleanersPopupData = PopupData<typeof PopupType.CLEANERS> & BaseCreateColumnPopupData;

/** Popup configuration for Create Column popup */
export type ReshapePopupData = PopupData<typeof PopupType.RESHAPE>;

/** Popup configuration for Charts popup */
export interface ChartsPopupData extends PopupData<typeof PopupType.CHARTS> {
  query?: string;
  x?: string;
  y?: string[];
  group?: string[];
  aggregation?: string;
  chartType?: string;
  chartPerGroup?: boolean;
}

/** Popup configuration for Describe popup */
export interface DescribePopupData extends PopupData<typeof PopupType.DESCRIBE> {
  selectedCol?: string;
}

/** Popup configuration for Duplicates popup */
export interface DuplicatesPopupData extends PopupData<typeof PopupType.DUPLICATES> {
  selectedCol?: string;
}

/** Popup configuration for Filter popup */
export type CustomFilterPopupData = PopupData<typeof PopupType.FILTER>;

/** Popup configuration for Upload popup */
export type UploadPopupData = PopupData<typeof PopupType.UPLOAD>;

/** Popup configuration for ArcticDB popup */
export type ArcticDBPopupData = PopupData<typeof PopupType.ARCTICDB>;

/** Popup configuration for Replacement popup */
export interface ReplacementPopupData extends PopupData<typeof PopupType.REPLACEMENT>, HasColumnSelection {
  propagateState: DataViewerPropagateState;
}

/** Popup configuration for Variance popup */
export type VariancePopupData = PopupData<typeof PopupType.VARIANCE> & BaseColumnAnalysisPopupData;

/** Popup configuration for Instances popup */
export type InstancesPopupData = PopupData<typeof PopupType.INSTANCES>;

/** Popup configurations */
export type Popups =
  | HiddenPopupData
  | AboutPopupData
  | ConfirmationPopupData
  | CopyRangeToClipboardPopupData
  | CopyColumnRangeToClipboardPopupData
  | CopyRowRangeToClipboardPopupData
  | ErrorPopupData
  | RenamePopupData
  | RangeHighlightPopupData
  | XArrayDimensionsPopupData
  | XArrayIndexesPopupData
  | ColumnAnalysisPopupData
  | ChartsPopupData
  | CorrelationsPopupData
  | PPSPopupData
  | CreateColumnPopupData
  | ReshapePopupData
  | ChartsPopupData
  | DescribePopupData
  | DuplicatesPopupData
  | CustomFilterPopupData
  | UploadPopupData
  | ReplacementPopupData
  | VariancePopupData
  | CreateTypeConversionPopupData
  | CreateCleanersPopupData
  | InstancesPopupData
  | ExportPopupData
  | ArcticDBPopupData
  | JumpToColumnPopupData;

/** Sort directions */
export enum SortDir {
  ASC = 'ASC',
  DESC = 'DESC',
}

/** Type definition for column being sorted and it's direction. */
export type SortDef = [string, SortDir];

/** Value holder for predefined filters */
export interface PredefinedFilterValue extends HasActivation {
  value?: any | any[];
}

/** Settings available to each instance (piece of data) of D-Tale */
export interface InstanceSettings {
  locked?: string[];
  allow_cell_edits: boolean | string[];
  precision: number;
  columnFormats?: Record<string, ColumnFormat>;
  backgroundMode?: string;
  rangeHighlight?: RangeHighlightConfig;
  verticalHeaders: boolean;
  predefinedFilters: Record<string, PredefinedFilterValue>;
  sortInfo?: SortDef[];
  nanDisplay?: string;
  startup_code?: string;
  query?: string;
  highlightFilter?: boolean;
  outlierFilters?: Record<string, OutlierFilter>;
  filteredRanges?: FilteredRanges;
  columnFilters?: Record<string, ColumnFilter>;
  invertFilter?: boolean;
  hide_shutdown: boolean;
  column_edit_options?: Record<string, string[]>;
  hide_header_editor: boolean;
  lock_header_menu: boolean;
  hide_header_menu: boolean;
  hide_main_menu: boolean;
  hide_column_menus: boolean;
  isArcticDB?: number;
  enable_custom_filters: boolean;
}

export const BASE_INSTANCE_SETTINGS: InstanceSettings = Object.freeze({
  allow_cell_edits: true,
  hide_shutdown: false,
  precision: 2,
  verticalHeaders: false,
  predefinedFilters: {},
  hide_header_editor: false,
  lock_header_menu: false,
  hide_header_menu: false,
  hide_main_menu: false,
  hide_column_menus: false,
  enable_custom_filters: false,
});

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
  allowCellEdits: boolean | string[];
  theme: ThemeType;
  language: string;
  pythonVersion: Version | null;
  isVSCode: boolean;
  isArcticDB: number;
  arcticConn: string;
  columnCount: number;
  maxColumnWidth: number | null;
  maxRowHeight: number | null;
  mainTitle: string | null;
  mainTitleFont: string | null;
  queryEngine: QueryEngine;
  showAllHeatmapColumns: boolean;
  hideHeaderEditor: boolean;
  lockHeaderMenu: boolean;
  hideHeaderMenu: boolean;
  hideMainMenu: boolean;
  hideColumnMenus: boolean;
  enableCustomFilters: boolean;
}

/** Properties for specifying filtered ranges */
export interface FilteredRanges {
  query?: string;
  dtypes?: Record<string, ColumnDef>;
  ranges?: Record<string, Bounds>;
  overall?: Bounds;
}

/** Predefined filter types */
export enum PredfinedFilterInputType {
  INPUT = 'input',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
}

/** Predefined filter properties */
export interface PredefinedFilter extends HasActivation {
  column: string;
  default?: string | number;
  description?: string;
  inputType: PredfinedFilterInputType;
  name: string;
}

/** Range highlight configuration properties */
export interface RangeHighlightModeCfg extends HasActivation {
  value?: number;
  color: RGBColor;
}

/** Different types of range highlighting */
export interface RangeHighlightModes {
  equals: RangeHighlightModeCfg;
  greaterThan: RangeHighlightModeCfg;
  lessThan: RangeHighlightModeCfg;
}

/** Range highlighting for individual columns or "all" columns */
export interface RangeHighlightConfig {
  [key: string | 'all']: RangeHighlightModes & HasActivation;
}

/** Range selection properties */
export interface RangeState {
  rowRange: RangeSelection<number> | null;
  columnRange: RangeSelection<number> | null;
  rangeSelect: RangeSelection<string> | null;
  ctrlRows: number[] | null;
  ctrlCols: number[] | null;
  selectedRow: number | null;
}

/** Properties of application state */
export interface AppState extends AppSettings, RangeState {
  chartData: Popups;
  dataId: string;
  editedCell: string | null;
  editedTextAreaHeight: number;
  iframe: boolean;
  columnMenuOpen: boolean;
  selectedCol: string | null;
  selectedColRef: HTMLDivElement | null;
  xarray: boolean;
  xarrayDim: Record<string, any>;
  filteredRanges: FilteredRanges;
  settings: InstanceSettings;
  isPreview: boolean;
  menuPinned: boolean;
  menuTooltip: MenuTooltipProps;
  ribbonMenuOpen: boolean;
  ribbonDropdown: RibbonDropdownProps;
  sidePanel: SidePanelProps;
  dataViewerUpdate: DataViewerUpdate | null;
  predefinedFilters: PredefinedFilter[];
  dragResize: number | null;
  auth: boolean;
  username: string | null;
  menuOpen: boolean;
  formattingOpen: string | null;
}
