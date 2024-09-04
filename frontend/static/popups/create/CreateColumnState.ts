import { ColumnDef } from '../../dtale/DataViewerState';

import { CreateColumnCodeSnippet } from './CodeSnippet';

/** Different types of column creation */
export enum CreateColumnType {
  NUMERIC = 'numeric',
  STRING = 'string',
  CONCATENATE = 'concatenate',
  REPLACE = 'replace',
  DATETIME = 'datetime',
  BINS = 'bins',
  RANDOM = 'random',
  TYPE_CONVERSION = 'type_conversion',
  TRANSFORM = 'transform',
  WINSORIZE = 'winsorize',
  ZSCORE_NORMALIZE = 'zscore_normalize',
  SIMILARITY = 'similarity',
  STANDARDIZE = 'standardize',
  ENCODER = 'encoder',
  CLEANING = 'cleaning',
  DIFF = 'diff',
  DATA_SLOPE = 'data_slope',
  ROLLING = 'rolling',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  CUMSUM = 'cumsum',
  SHIFT = 'shift',
  EXPANDING = 'expanding',
  SUBSTRING = 'substring',
  SPLIT = 'split',
  RESAMPLE = 'resample',
}

/** Different groups of column creation types */
export enum CreateColumnTypeGroup {
  GENERAL_DATA = 'General Data',
  AGGREGATING_COLUMNS = 'Aggregating Columns',
  ROW_ANALYSIS = 'Row Analysis',
  TRANSFORM_EXISTING_DATA = 'Transform Existing Data',
  TIMESERIES = 'Timeseries',
  TEXT = 'Text',
}

/** Saving options for column creation */
export enum SaveAs {
  NEW = 'new',
  INPLACE = 'inplace',
  NONE = 'none',
}

/** Binning operations */
export enum BinsOperation {
  CUT = 'cut',
  QCUT = 'qcut',
}

/** Bin configuration */
export interface BinsConfig {
  col?: string;
  operation: BinsOperation;
  bins: string;
  labels: string;
}

/** Column cleaning types */
export enum CleanerType {
  DROP_MULTISPACE = 'drop_multispace',
  DROP_PUNCTUATION = 'drop_punctuation',
  STOPWORDS = 'stopwords',
  NLTK_STOPWORDS = 'nltk_stopwords',
  DROP_NUMBERS = 'drop_numbers',
  KEEP_ALPHA = 'keep_alpha',
  NORMALIZE_ACCENTS = 'normalize_accents',
  DROP_ALL_SPACE = 'drop_all_space',
  DROP_REPEATED_WORDS = 'drop_repeated_words',
  ADD_WORD_NUMBER_SPACE = 'add_word_number_space',
  DROP_REPEATED_CHARS = 'drop_repeated_chars',
  UPDATE_CASE = 'update_case',
  SPACE_VALS_TO_EMPTY = 'space_vals_to_empty',
  HIDDEN_CHARS = 'hidden_chars',
  REPLACE_HYPHEN_W_SPACE = 'replace_hyphen_w_space',
}

/** String case types */
export enum CaseType {
  UPPER = 'upper',
  LOWER = 'lower',
  TITLE = 'title',
}

/** Column cleaning configuration */
export interface CleaningConfig {
  col?: string;
  cleaners: CleanerType[];
  stopwords?: string[];
  language?: string;
  caseType?: CaseType;
}

/** Different random data types */
export enum RandomType {
  FLOAT = 'float',
  INT = 'int',
  STRING = 'string',
  CHOICE = 'choice',
  BOOL = 'bool',
  DATE = 'date',
}

/** Base properties of a random column creation configuration */
interface BaseRandomConfig<T extends RandomType> {
  type: T;
}

/** Random string column creation configuration */
interface RandomStringConfig extends BaseRandomConfig<typeof RandomType.STRING> {
  chars?: string;
  length?: number;
}

/** Random choice column creation configuration */
interface RandomChoiceConfig extends BaseRandomConfig<typeof RandomType.CHOICE> {
  choices?: string;
}

/** Random boolean column creation configuration */
type RandomBoolConfig = BaseRandomConfig<typeof RandomType.BOOL>;

/** Random date column creation configuration */
interface RandomDateConfig extends BaseRandomConfig<typeof RandomType.DATE> {
  start?: string;
  end?: string;
  timestamps: boolean;
  businessDay: boolean;
}

/** Base properties for a random number column creation configuration */
interface BaseRandomNumberConfig {
  low?: string;
  high?: string;
}

/** Random integer column creation configuration */
type RandomIntConfig = BaseRandomConfig<typeof RandomType.INT> & BaseRandomNumberConfig;

/** Random float column creation configuration */
type RandomFloatConfig = BaseRandomConfig<typeof RandomType.FLOAT> & BaseRandomNumberConfig;

/** Different random column configurations */
export type RandomConfigs =
  | RandomStringConfig
  | RandomChoiceConfig
  | RandomBoolConfig
  | RandomDateConfig
  | RandomIntConfig
  | RandomFloatConfig;

/** Different datetime units to be used in type conversion */
export enum TypeConversionUnit {
  DATE = 'YYYYMMDD',
  DAY = 'D',
  SECOND = 's',
  MILLISECOND = 'ms',
  MICROSECOND = 'us',
  NANOSECOND = 'ns',
}

/** Value holder for different modes of converting integer to boolean */
export interface IntToBoolModeCfg {
  active: boolean;
  value?: string;
}

/** Configuration for converting integer to boolean */
export interface IntToBoolCfg {
  equals: IntToBoolModeCfg;
  greaterThan: IntToBoolModeCfg;
  lessThan: IntToBoolModeCfg;
}

/** Type conversion column creation configuration */
export interface TypeConversionConfig {
  col?: string;
  fmt?: string;
  unit?: TypeConversionUnit;
  to?: string;
  from?: string;
  cfg?: IntToBoolCfg;
  applyAllType: boolean;
}

/** Operand data types */
export enum OperandDataType {
  COL = 'col',
  VAL = 'val',
}

/** Operand configuration (used by CreateNumeric, CreateConcatenation) */
export interface OperandConfig {
  type: OperandDataType;
  col?: string;
  val?: string;
}

/** String concatenation column creation configuration */
export interface ConcatenationConfig {
  left: OperandConfig;
  right: OperandConfig;
}

/** Cumulative sum column creation configuration */
export interface CumsumConfig {
  cols?: string[];
  group?: string[];
}

/** Data slope column creation configuration */
export interface DataSlopeConfig {
  col?: string;
}

/** Datetime column creation operations */
export enum DatetimeOperation {
  PROPERTY = 'property',
  CONVERSION = 'conversion',
  TIME_DIFFERENCE = 'time_difference',
}

/** Different datetime properties to choose from */
export enum DatetimePropertyType {
  MINUTE = 'minute',
  HOUR = 'hour',
  TIME = 'time',
  DATE = 'date',
  WEEKDAY = 'weekday',
  WEEKDAY_NAME = 'weekday_name',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/** Different datetime time differences */
export enum DatetimeTimeDifferenceType {
  NOW = 'now',
  COL = 'col',
}

/** Different datetime conversions */
export enum DatetimeConversionType {
  MONTH_START = 'month_start',
  MONTH_END = 'month_end',
  QUARTER_START = 'quarter_start',
  QUARTER_END = 'quarter_end',
  YEAR_START = 'year_start',
  YEAR_END = 'year_end',
}

/** Datetime column creation configuration */
export interface DatetimeConfig {
  col?: string;
  operation: DatetimeOperation;
  property?: DatetimePropertyType;
  conversion?: DatetimeConversionType;
  timeDifference?: DatetimeTimeDifferenceType;
  timeDifferenceCol?: string;
}

/** Difference column creation configuration */
export interface DiffConfig {
  col?: string;
  periods: string;
}

/** Encoder algorithm choices */
export enum EncoderAlgoType {
  LABEL = 'label',
  ONE_HOT = 'one_hot',
  ORDINAL = 'ordinal',
  FEATURE_HASHER = 'feature_hasher',
}

/** Encoder column creation configuration */
export interface EncoderConfig {
  col?: string;
  n?: string;
  algo: EncoderAlgoType;
}

/** Expanding column creation configuration */
export interface ExpandingConfig {
  col?: string;
  agg?: string;
  periods: number;
}

/** Exponential smoothing column creation configuration */
export interface ExponentialSmoothingConfig {
  col?: string;
  alpha: number;
}

/** Numeric column creation operation types */
export enum NumericOperationType {
  SUM = 'sum',
  DIFFERENCE = 'difference',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
}

/** Numeric column creation configuration */
export interface NumericConfig extends ConcatenationConfig {
  operation?: NumericOperationType;
}

/** String replacement column creation configuration */
export interface ReplaceConfig {
  col?: string;
  search: string;
  replacement: string;
  caseSensitive: boolean;
  regex: boolean;
}

/** Different types of rolling windows */
export enum RollingWindowType {
  TRIANG = 'triang',
  GAUSSIAN = 'gaussian',
}

/** Different types of rolling window closings */
export enum RollingClosedType {
  RIGHT = 'right',
  LEFT = 'left',
  BOTH = 'both',
  NEITHER = 'neither',
}

/** Rolling computation column creation configuration */
export interface RollingConfig {
  col?: string;
  comp?: string;
  window: string;
  min_periods?: string;
  center: boolean;
  win_type?: RollingWindowType;
  on?: string;
  closed?: RollingClosedType;
}

/** Shift column creation configuration */
export interface ShiftConfig {
  col?: string;
  periods: number;
  fillValue?: string;
  dtype?: string;
}

/** String similarity algorithm types */
export enum SimilarityAlgoType {
  LEVENSHTEIN = 'levenshtein',
  DAMERAU_LEVENSHTEIN = 'damerau-leveneshtein',
  JARO_WINKLER = 'jaro-winkler',
  JACCARD = 'jaccard',
}

/** String similarity column creation configuration */
export interface SimilarityConfig {
  left?: string;
  right?: string;
  algo: SimilarityAlgoType;
  k?: string;
  normalized?: boolean;
}

/** Data standardization algorithm types */
export enum StandardizedAlgoType {
  POWER = 'power',
  QUANTILE = 'quantile',
  ROBUST = 'robust',
}

/** Data standardization column creation configuration */
export interface StandardizedConfig {
  col?: string;
  algo: StandardizedAlgoType;
}

/** String column creation configuration */
export interface StringConfig {
  cols?: string[];
  joinChar: string;
}

/** String splitting column creation configuration */
export interface StringSplittingConfig {
  col?: string;
  delimiter: string;
}

/** Substring column creation configuration */
export interface SubstringConfig {
  col?: string;
  start: string;
  end: string;
}

/** Transformation computation column creation configuration */
export interface TransformConfig {
  group?: string[];
  col?: string;
  agg?: string;
}

/** Winsorization column creation configuration */
export interface WinsorizeConfig {
  col?: string;
  limits: number[];
  inclusive: boolean[];
  group?: string[];
}

/** Z-Score normalized column creation configuration */
export interface ZScoreNormalizeConfig {
  col?: string;
}

/** Resampled data creation configuration */
export interface ResampleConfig {
  index?: string;
  columns?: string[];
  freq: string;
  agg?: string;
}

/** Column creation configuration types */
export type CreateColumnConfigTypes =
  | BinsConfig
  | CleaningConfig
  | RandomConfigs
  | TypeConversionConfig
  | ConcatenationConfig
  | CumsumConfig
  | DataSlopeConfig
  | DatetimeConfig
  | DiffConfig
  | EncoderConfig
  | ExpandingConfig
  | ExponentialSmoothingConfig
  | NumericConfig
  | ReplaceConfig
  | RollingConfig
  | ShiftConfig
  | SimilarityConfig
  | StandardizedConfig
  | StringConfig
  | StringSplittingConfig
  | SubstringConfig
  | TransformConfig
  | WinsorizeConfig
  | ZScoreNormalizeConfig
  | ResampleConfig;

/** Base properties for creating a column */
export interface BaseCreateColumnConfig<T extends CreateColumnType, S extends CreateColumnConfigTypes> {
  type: T;
  name?: string;
  cfg: S;
}

/** Full properties for creating a bins column */
export type BinsCreateColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.BINS, BinsConfig>;

/** Full properties for creating a cleaned column */
export type CleaningCreateColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.CLEANING, CleaningConfig>;

/** Full properties for creating a random column */
export type RandomCreateColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.RANDOM, RandomConfigs>;

/** Full properties for creating a type conversion column */
export type TypeConversionColumnConfig = BaseCreateColumnConfig<
  typeof CreateColumnType.TYPE_CONVERSION,
  TypeConversionConfig
>;

/** Full properties for creating a string concatenation column */
export type ConcatenationColumnConfig = BaseCreateColumnConfig<
  typeof CreateColumnType.CONCATENATE,
  ConcatenationConfig
>;

/** Full properties for creating a cumulative sum column */
export type CumsumColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.CUMSUM, CumsumConfig>;

/** Full properties for creating a data slope column */
export type DataSlopeColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.DATA_SLOPE, DataSlopeConfig>;

/** Full properties for creating a datetime column */
export type DatetimeColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.DATETIME, DatetimeConfig>;

/** Full properties for creating a diff column */
export type DiffColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.DIFF, DiffConfig>;

/** Full properties for creating a encoder column */
export type EncoderColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.ENCODER, EncoderConfig>;

/** Full properties for creating a expanding column */
export type ExpandingColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.EXPANDING, ExpandingConfig>;

/** Full properties for creating a exponential smoothing column */
export type ExponentialSmoothingColumnConfig = BaseCreateColumnConfig<
  typeof CreateColumnType.EXPONENTIAL_SMOOTHING,
  ExponentialSmoothingConfig
>;

/** Full properties for creating a numeric column */
export type NumericColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.NUMERIC, NumericConfig>;

/** Full properties for creating a string replacement column */
export type ReplaceColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.REPLACE, ReplaceConfig>;

/** Full properties for creating a rolling computation column */
export type RollingColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.ROLLING, RollingConfig>;

/** Full properties for creating a shift computation column */
export type ShiftColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.SHIFT, ShiftConfig>;

/** Full properties for creating a similarity column */
export type SimilarityColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.SIMILARITY, SimilarityConfig>;

/** Full properties for creating a standardized column */
export type StandardizedColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.STANDARDIZE, StandardizedConfig>;

/** Full properties for creating a string column */
export type StringColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.STRING, StringConfig>;

/** Full properties for creating a string column */
export type StringSplittingColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.SPLIT, StringSplittingConfig>;

/** Full properties for creating a substring column */
export type SubstringColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.SUBSTRING, SubstringConfig>;

/** Full properties for creating a transform column */
export type TransformColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.TRANSFORM, TransformConfig>;

/** Full properties for creating a winsorized column */
export type WinsorizeColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.WINSORIZE, WinsorizeConfig>;

/** Full properties for creating a winsorized column */
export type ZScoreNormalizeColumnConfig = BaseCreateColumnConfig<
  typeof CreateColumnType.ZSCORE_NORMALIZE,
  ZScoreNormalizeConfig
>;

/** Full properties for creating resampled data */
export type ResampleColumnConfig = BaseCreateColumnConfig<typeof CreateColumnType.RESAMPLE, ResampleConfig>;

/** Different types of full properties for creating columns */
export type CreateColumnConfigs =
  | BinsCreateColumnConfig
  | CleaningCreateColumnConfig
  | RandomCreateColumnConfig
  | ConcatenationColumnConfig
  | CumsumColumnConfig
  | DataSlopeColumnConfig
  | DatetimeColumnConfig
  | DiffColumnConfig
  | EncoderColumnConfig
  | ExpandingColumnConfig
  | ExponentialSmoothingColumnConfig
  | NumericColumnConfig
  | ReplaceColumnConfig
  | RollingColumnConfig
  | ShiftColumnConfig
  | SimilarityColumnConfig
  | StandardizedColumnConfig
  | StringColumnConfig
  | StringSplittingColumnConfig
  | SubstringColumnConfig
  | TransformColumnConfig
  | TypeConversionColumnConfig
  | WinsorizeColumnConfig
  | ZScoreNormalizeColumnConfig
  | ResampleColumnConfig;

/** Column creation updatable properties */
export interface CreateColumnUpdateState {
  name?: string;
  cfg: CreateColumnConfigs;
  code: CreateColumnCodeSnippet;
  saveAs?: SaveAs;
}

/** Prepopulated properties of CreateColumn */
export type PrepopulateCreateColumn = CreateColumnConfigs & { saveAs?: SaveAs };

/** Saving properties */
export interface SaveAsProps {
  saveAs: SaveAs;
  name?: string;
}

/** Different types of output for reshaped data */
export enum OutputType {
  NEW = 'new',
  OVERRIDE = 'override',
}

/** Parameters for saving a created column */
export type CreateColumnSaveParams = CreateColumnConfigs & SaveAsProps & { output?: OutputType };

/** Base component properties for creating column configurations */
export interface BaseCreateComponentProps {
  updateState: (state: CreateColumnUpdateState) => void;
  columns: ColumnDef[];
  namePopulated: boolean;
}
