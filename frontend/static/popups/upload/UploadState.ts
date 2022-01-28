/** Base properties for different sheets asscoaited with excel files */
export interface BaseSheet {
  dataId: number;
  name: string;
}

/** Properties associated with excel sheets */
export interface Sheet extends BaseSheet {
  selected: boolean;
}

/** Different preset separators for delimited files */
export enum SeparatorType {
  COMMA = 'comma',
  TAB = 'tab',
  COLON = 'colon',
  PIPE = 'pipe',
  CUSTOM = 'custom',
}

/** CSV Loader properties */
export interface CSVLoaderProps {
  header: boolean;
  separatorType: SeparatorType;
  separator: string;
}

/** CSV Popup component properties */
export interface CSVProps {
  show: boolean;
  loader?: (loaderProps?: CSVLoaderProps) => Promise<void>;
}

/** Upload state properties */
export interface UploadState {
  csvProps: CSVProps;
  loading: boolean;
}

/** Different data types allowed to be uploaded */
export enum DataType {
  CSV = 'csv',
  TSV = 'tsv',
  JSON = 'json',
  EXCEL = 'excel',
  PARQUET = 'parquet',
}

/** Preset datasets that can be loaded into D-Tale */
export enum Dataset {
  COVID = 'covid',
  SEINFELD = 'seinfeld',
  SIMPSONS = 'simpsons',
  VIDEO_GAMES = 'video_games',
  MOVIES = 'movies',
  TIME_DATAFRAME = 'time_dataframe',
}
