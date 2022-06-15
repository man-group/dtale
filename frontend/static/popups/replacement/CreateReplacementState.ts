import { ColumnDef } from '../../dtale/DataViewerState';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { ReplaceConfig, SaveAsProps } from '../create/CreateColumnState';

/** Different configuration types for value replacement */
export enum ValueConfigType {
  RAW = 'raw',
  AGG = 'agg',
  COL = 'col',
}

/** Base properties of a value replacement configuration */
interface BaseValueConfig<T extends ValueConfigType, U> {
  type: T;
  value: string | number;
  replace: U;
}

/** Value replacement configuration using raw values */
type RawValueConfig = BaseValueConfig<ValueConfigType.RAW, string | number>;
/** Value replacement configuration using column values */
type ColValueConfig = BaseValueConfig<ValueConfigType.COL, string | number>;
/** Value replacement configuration for aggregated values */
type AggValueConfig = BaseValueConfig<ValueConfigType.AGG, string>;
/** Value replacement configurations */
export type ValueConfig = RawValueConfig | ColValueConfig | AggValueConfig;

/** String replacement configuration */
export interface StringsConfig {
  value?: string;
  isChar: boolean;
  ignoreCase: boolean;
  replace?: string;
}

/** Spaces replacement configuration */
export interface SpacesConfig {
  replace: string;
}

/** Different imputer replacement types */
export enum ImputerType {
  ITERATIVE = 'iterative',
  KNN = 'knn',
  SIMPLE = 'simple',
}

/** Base properties of imputer replacement configuration */
interface BaseImputerConfig<T extends ImputerType> {
  type: T;
}

/** Iterative imputer replacement configuration */
type IterativeImputerConfig = BaseImputerConfig<ImputerType.ITERATIVE>;
/** KNN imputer replacement configuration */
type KNNImputerConfig = BaseImputerConfig<ImputerType.KNN> & { nNeighbors: number };
/** Simple imputer replacement configuration */
type SimpleImputerConfig = BaseImputerConfig<ImputerType.SIMPLE>;
/** Imputer replacement configuration */
export type ImputerConfig = IterativeImputerConfig | KNNImputerConfig | SimpleImputerConfig;

/** Replacement configuration types */
export enum ReplacementType {
  VALUE = 'value',
  SPACES = 'spaces',
  STRINGS = 'strings',
  IMPUTER = 'imputer',
  PARTIAL = 'partial',
}

/** Base properties of replacement configurations */
interface BaseReplacementConfig<T extends ReplacementType, U> {
  type: T;
  cfg: U;
}

/** Value replacement configuration */
type ValueReplacementConfig = BaseReplacementConfig<ReplacementType.VALUE, ValueConfig[]>;
/** String replacement configuration */
type StringsReplacementConfig = BaseReplacementConfig<ReplacementType.STRINGS, StringsConfig>;
/** Spaces replacement configuration */
type SpacesReplacementConfig = BaseReplacementConfig<ReplacementType.SPACES, SpacesConfig>;
/** Imputer replacement configuration */
type ImputerReplacementConfig = BaseReplacementConfig<ReplacementType.IMPUTER, ImputerConfig>;
/** Partial string replacement configuration */
export type PartialReplacementConfig = BaseReplacementConfig<ReplacementType.PARTIAL, ReplaceConfig>;

/** Replacement configuration */
export type ReplacementConfig =
  | ValueReplacementConfig
  | StringsReplacementConfig
  | SpacesReplacementConfig
  | ImputerReplacementConfig
  | PartialReplacementConfig;

/** Replacement creation updatable properties */
export interface ReplacementUpdateProps {
  error?: JSX.Element;
  code?: CreateColumnCodeSnippet;
  cfg?: ReplacementConfig;
}

/** Base component properties for replacement configurations */
export interface BaseReplacementComponentProps {
  updateState: (state: Partial<ReplacementUpdateProps>) => void;
  col: string;
  columns: ColumnDef[];
  colType: string;
}

/** Parameters for saving a replacement column */
export type CreateReplacementSaveParams = ReplacementConfig & SaveAsProps & { col: string };
