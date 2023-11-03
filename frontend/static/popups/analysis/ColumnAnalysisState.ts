import { ColumnDef } from '../../dtale/DataViewerState';
import { BaseColumnAnalysisPopupData, BaseOption } from '../../redux/state/AppState';
import { UniqueRecord } from '../describe/DescribeState';

/** Different types of column analysis */
export enum AnalysisType {
  GEOLOCATION = 'geolocation',
  HISTOGRAM = 'histogram',
  CATEGORIES = 'categories',
  VALUE_COUNTS = 'value_counts',
  WORD_VALUE_COUNTS = 'word_value_counts',
  QQ = 'qq',
  BOXPLOT = 'boxplot',
  FREQUENCY = 'frequency',
}

/** Base properties of data fetched for column analysis */
export interface FetchedChartData<T extends AnalysisType> {
  code: string;
  query: string;
  cols: ColumnDef[];
  dtype: string;
  chart_type: T;
  top?: number;
  timestamp?: number;
}

/** Base properties for column analysis charts */
export interface BaseChartData {
  data: number[];
  labels: string[];
}

/** Properties for fetched Histogram data */
export interface HistogramChartData extends FetchedChartData<AnalysisType.HISTOGRAM>, BaseChartData {
  desc?: Record<string, any>;
  kde?: number[];
  targets?: any[];
}

/** Properties for fetched Category data */
export interface CategoryChartData extends FetchedChartData<AnalysisType.CATEGORIES>, BaseChartData {
  count: number[];
}

/** Properties for fetched Value Count data */
export interface ValueCountChartData extends FetchedChartData<AnalysisType.VALUE_COUNTS>, BaseChartData {
  ordinal?: number[];
  percent?: number[];
}

/** Properties for fetched Word Value Count data */
export interface WordValueCountChartData extends FetchedChartData<AnalysisType.WORD_VALUE_COUNTS>, BaseChartData {
  ordinal?: number[];
  percent?: number[];
}

/** Properties for fetched Geolocation data */
export interface GeolocationChartData extends FetchedChartData<AnalysisType.GEOLOCATION> {
  lat: number[];
  lon: number[];
}

/** Properties for fetched QQ data */
export interface QQChartData extends FetchedChartData<AnalysisType.QQ> {
  x: number[];
  y: number[];
  x2: number[];
  y2: number[];
}

/** Properties for fetched Frequency Grid data */
export interface FrequencyGridData extends FetchedChartData<AnalysisType.FREQUENCY> {
  data: { Frequency: number[]; Percent: number[] } & Record<string, any[]>;
}

/** Properties for column analysis charts using chart.js */
export type ChartJSAnalysisCharts =
  | HistogramChartData
  | CategoryChartData
  | ValueCountChartData
  | WordValueCountChartData;

/** Properties for column analysis charts using plotly */
export type PlotlyAnalysisCharts = GeolocationChartData | QQChartData;

/** Different charts available for column analysis */
export type AnalysisCharts = ChartJSAnalysisCharts | PlotlyAnalysisCharts | FrequencyGridData;

/** Parameters for building a column analysis */
export interface AnalysisParams {
  type: AnalysisType;
  filtered?: boolean;
  col?: string;
  selectedCol?: string;
  bins?: number;
  target?: BaseOption<string>;
  density?: boolean;
  categoryCol?: BaseOption<string>;
  categoryAgg?: BaseOption<string>;
  top?: number;
  ordinalCol?: BaseOption<string>;
  ordinalAgg?: BaseOption<string>;
  cleaners?: Array<{ value: string }>;
  latCol?: BaseOption<string>;
  lonCol?: BaseOption<string>;
  query?: string;
  splits?: Array<BaseOption<string>>;
}

/** State properties of ColumnAnalysis */
export interface AnalysisState extends AnalysisParams {
  chart?: JSX.Element;
  error?: JSX.Element;
  code?: string;
  chartParams?: AnalysisParams;
  dtype?: string;
  cols?: ColumnDef[];
  wordValues?: UniqueRecord[];
}

/** Properties for building analysis */
export interface AnalysisProps {
  dataId: string;
  height?: number;
  chartData: BaseColumnAnalysisPopupData;
  filtered?: boolean;
}
