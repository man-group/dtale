/** Base properties for timeseries analysis */
export interface BaseTimeseriesConfig {
  index?: string;
  col?: string;
  agg?: string;
}

/** Properties for BKFilter analysis */
export interface BKConfig {
  low: number;
  high: number;
  K: number;
}

/** Properties for CFFilter analysis */
export interface CFConfig {
  low: number;
  high: number;
  drift: boolean;
}

/** Properties for HPFilter analysis */
export interface HPConfig {
  lamb: number;
}

/** Models available for SeasonalDecompose */
export enum SeasonalDecomposeModel {
  ADDITIVE = 'additive',
  MULTIPLICATIVE = 'multiplicative',
}

/** Properties for SeasonalDecompose analysis */
export interface SeasonalDecomposeConfig {
  model: SeasonalDecomposeModel;
}

/** Component configuration objects */
type ComponentConfigs = BaseTimeseriesConfig | BKConfig | CFConfig | HPConfig | SeasonalDecomposeConfig;

/** Different types of timeseries analysis */
export enum TimeseriesAnalysisType {
  HPFILTER = 'hpfilter',
  BKFILTER = 'bkfilter',
  CFFILTER = 'cffilter',
  SEASONAL_DECOMPOSE = 'seasonal_decompose',
  STL = 'stl',
}

/** Config holder */
export type ConfigsHolder = {
  [TimeseriesAnalysisType.HPFILTER]: HPConfig;
  [TimeseriesAnalysisType.BKFILTER]: BKConfig;
  [TimeseriesAnalysisType.CFFILTER]: CFConfig;
  [TimeseriesAnalysisType.SEASONAL_DECOMPOSE]: SeasonalDecomposeConfig;
  [TimeseriesAnalysisType.STL]: SeasonalDecomposeConfig;
};

export const BASE_CFGS: ConfigsHolder = {
  [TimeseriesAnalysisType.HPFILTER]: { lamb: 1600 },
  [TimeseriesAnalysisType.BKFILTER]: { low: 6, high: 32, K: 12 },
  [TimeseriesAnalysisType.CFFILTER]: { low: 6, high: 32, drift: true },
  [TimeseriesAnalysisType.SEASONAL_DECOMPOSE]: { model: SeasonalDecomposeModel.ADDITIVE },
  [TimeseriesAnalysisType.STL]: { model: SeasonalDecomposeModel.ADDITIVE },
};

/** Component properties for timeseries analysis components */
export interface BaseComponentProps<T extends ComponentConfigs> {
  cfg: T;
  updateState: (cfg: T) => void;
}
