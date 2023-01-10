import { ColumnDef } from '../../dtale/DataViewerState';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { OutputType, ResampleConfig as ReshapeResampleConfig } from '../create/CreateColumnState';

/** Different types of data reshaping */
export enum ReshapeType {
  AGGREGATE = 'aggregate',
  PIVOT = 'pivot',
  TRANSPOSE = 'transpose',
  RESAMPLE = 'resample',
}

/** Different data types for aggregation data reshaping */
export enum AggregationOperationType {
  COL = 'col',
  FUNC = 'func',
}

/** Base properties for a data shaping by aggregation */
interface BaseAggregationConfig<T extends AggregationOperationType> {
  type: T;
}

/** Data reshaping by aggregation using columns */
interface ColumnAggregationConfig extends BaseAggregationConfig<typeof AggregationOperationType.COL> {
  cols: Record<string, string[]>;
}

/** Data reshaping by aggregation using functions */
interface FunctionAggregationConfig extends BaseAggregationConfig<typeof AggregationOperationType.FUNC> {
  func?: string;
  cols?: string[];
}

/** Data reshaping by aggregation configurations */
type AggregationConfigs = ColumnAggregationConfig | FunctionAggregationConfig;

/** Reshaped data by aggregation configuration */
export interface ReshapeAggregateConfig {
  index?: string[];
  dropna: boolean;
  agg: AggregationConfigs;
}

/** Reshaped data by pivot configuration */
export interface ReshapePivotConfig {
  index?: string[];
  columns?: string[];
  values?: string[];
  aggfunc?: string;
  columnNameHeaders: boolean;
}

/** Reshaped data by transpose configuration */
export interface ReshapeTransposeConfig {
  index?: string[];
  columns?: string[];
}

/** Data reshaping configurations */
export type ReshapeConfigTypes =
  | ReshapeAggregateConfig
  | ReshapePivotConfig
  | ReshapeTransposeConfig
  | ReshapeTransposeConfig
  | ReshapeResampleConfig;

/** Base properties for reshaping data */
export interface BaseFullReshapeConfig<T extends ReshapeType, S extends ReshapeConfigTypes> {
  type: T;
  name?: string;
  cfg: S;
}

/** Full properties for reshaping data by aggregation */
export type FullAggregateReshapeConfig = BaseFullReshapeConfig<typeof ReshapeType.AGGREGATE, ReshapeAggregateConfig>;

/** Full properties for reshaping data by aggregation */
export type FullPivotReshapeConfig = BaseFullReshapeConfig<typeof ReshapeType.PIVOT, ReshapePivotConfig>;

/** Full properties for reshaping data by aggregation */
export type FullTransposeReshapeConfig = BaseFullReshapeConfig<typeof ReshapeType.TRANSPOSE, ReshapeTransposeConfig>;

/** Full properties for reshaping data by aggregation */
export type FullResampleReshapeConfig = BaseFullReshapeConfig<typeof ReshapeType.RESAMPLE, ReshapeResampleConfig>;

/** Different types of full properties for reshaping data */
export type ReshapeConfigs =
  | FullAggregateReshapeConfig
  | FullPivotReshapeConfig
  | FullTransposeReshapeConfig
  | FullResampleReshapeConfig;

/** Column creation updatable properties */
export interface ReshapeUpdateState {
  cfg: ReshapeConfigTypes;
  code: CreateColumnCodeSnippet;
}

/** Base component properties for creating column configurations */
export interface BaseReshapeComponentProps {
  updateState: (state: ReshapeUpdateState) => void;
  columns: ColumnDef[];
}

/** Parameters for saving data reshaping */
export type ReshapeSaveParams = ReshapeConfigs & { output: OutputType };
