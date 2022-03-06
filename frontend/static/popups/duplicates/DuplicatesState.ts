/** Different configuration types for duplicate checks */
export enum DuplicatesConfigType {
  COLUMN_NAMES = 'column_names',
  COLUMNS = 'columns',
  ROWS = 'rows',
  SHOW = 'show',
}

/** Options for keeping columns */
export enum KeepType {
  FIRST = 'first',
  LAST = 'last',
  NONE = 'none',
}

/** Base duplicate check configuration */
export interface BaseConfig {
  keep: KeepType;
}

/** Duplicate row check configuration */
export interface RowsConfig extends BaseConfig {
  subset?: string[];
}

/** Configuration for showing duplicates */
export interface ShowDuplicatesConfig {
  group?: string[];
  filter?: string[];
}

/** Base duplicates confguration coupled with it's type */
interface BaseDuplicatesConfig<T extends DuplicatesConfigType, U> {
  type: T;
  cfg: U;
}

/** Full duplicate column names configuration */
export type DuplicatesColumnNamesConfig = BaseDuplicatesConfig<DuplicatesConfigType.COLUMN_NAMES, BaseConfig>;
/** Full duplicate columns configuration */
export type DuplicatesColumnsConfig = BaseDuplicatesConfig<DuplicatesConfigType.COLUMNS, BaseConfig>;
/** Full duplicate rows configuration */
export type DuplicatesRowsConfig = BaseDuplicatesConfig<DuplicatesConfigType.ROWS, RowsConfig>;
/** Full show duplicates configuration */
export type DuplicatesShowConfig = BaseDuplicatesConfig<DuplicatesConfigType.SHOW, ShowDuplicatesConfig>;

/** Type definition encompassing all full duplicate configurations */
export type DuplicatesConfigs =
  | DuplicatesColumnNamesConfig
  | DuplicatesColumnsConfig
  | DuplicatesRowsConfig
  | DuplicatesShowConfig;

/** Action types available for duplicate checks */
export enum DuplicatesActionType {
  TEST = 'test',
  EXECUTE = 'execute',
}

/** Parameters for executing duplciation checks */
export type DuplicateRequestParams = DuplicatesConfigs & { action: DuplicatesActionType };

/** Server results for columns or column names duplication check */
export interface ColumnBasedResult {
  [key: string]: string[];
}

/** Server results for rows duplication check */
export interface RowsResult {
  total: number;
  removed: number;
  remaining: number;
}

/** Server results for show duplicates check */
export interface ShowDuplicatesResult {
  [key: string]: { count: number; filter: string[] };
}

/** Base component properties for different duplication check components */
export interface BaseDuplicatesComponentProps {
  setCfg: (cfg: DuplicatesConfigs) => void;
}
