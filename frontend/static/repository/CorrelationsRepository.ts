import { DataSpec } from '../chartUtils';
import { findDummyCols } from '../popups/correlations/correlationsUtils';
import { buildURL, buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Predictive power score information */
export interface PPSInfo {
  x: string;
  y: string;
  ppscore: number;
  case: string;
  is_valid_score: boolean;
  metric?: string;
  baseline_score: number;
  model_score: number;
  model?: string;
}

/** Rows used in the display of the Predictive Power Score matrix */
export type PPSGridRow = PPSInfo & { x: string; y: string };

/** Row within correlation matrix */
export type CorrelationGridRow = { column: string } & { [key: string]: number };

/** Date options for correlation timeseries analysis */
export interface CorrelationDateOption {
  name: string;
  rolling: boolean;
}

/** Axios response for correlations */
export interface CorrelationsResponse extends GenericRepository.BaseResponse {
  data: CorrelationGridRow[];
  dates?: CorrelationDateOption[];
  strings?: string[];
  code: string;
  dummyColMappings?: Record<string, string[]>;
  pps?: PPSGridRow[];
}

export const buildCorrelationsUrl = (dataId: string, encodeStrings: boolean, pps = false, image = false): string =>
  buildURLString(`/dtale/correlations/${dataId}`, {
    encodeStrings: `${encodeStrings}`,
    pps: `${pps}`,
    image: `${image}`,
  });

/**
 * Load correlation or pps matrix for a sepcific data instance.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param encodeStrings if true, include encoded strings in correlations
 * @param pps if true, run a predictive power score analysis instead of pearson correlation
 * @return data types for data instance.
 */
export async function loadCorrelations(
  dataId: string,
  encodeStrings: boolean,
  pps = false,
): Promise<CorrelationsResponse | undefined> {
  return await GenericRepository.getDataFromService<CorrelationsResponse>(
    buildCorrelationsUrl(dataId, encodeStrings, pps),
  );
}

/** Axios response for timeseries correlations */
export interface TimeseriesResponse extends GenericRepository.BaseResponse, DataSpec {
  code: string;
  pps: PPSInfo;
}

export const BASE_CORRELATIONS_TS_URL = '/dtale/correlations-ts';

/**
 * Build a URL for loading correlation scatter dafa.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param selectedCols the columns to correlate.
 * @param index the selected index of the data.
 * @param selectedDate the selected date column of the scatter.
 * @param rolling whether this correlation is rolling or not.
 * @param window what window to use for a rolling correlation.
 * @param minPeriods the minimum periods needed for a rolling correlation.
 * @param dummyColMappings mapping of dummy columns to actual column names.
 * @return URL for loading correlation scatter data.
 */
export const buildScatterUrl = (
  dataId: string,
  selectedCols: string[],
  index: number | undefined,
  selectedDate: string | undefined,
  rolling: boolean,
  window: number,
  minPeriods: number,
  dummyColMappings: Record<string, string[]>,
): string => {
  let params: Record<string, any> = { selectedCols };
  if (index !== undefined) {
    params = { ...params, dateCol: selectedDate, index };
  }
  if (rolling) {
    params = { ...params, rolling, window, minPeriods };
  }
  params.dummyCols = findDummyCols(selectedCols, dummyColMappings);
  const path = `/dtale/scatter/${dataId}`;
  const urlProps = ['selectedCols', 'index', 'dateCol', 'rolling', 'window', 'minPeriods', 'dummyCols'];
  return buildURL(path, params, urlProps);
};

/** Statistics for correlation between two columns in your dataset */
export interface CorrelationStats {
  pearson: string | number;
  spearman: string | number;
  pps: PPSInfo;
  correlated: number;
  only_in_s0: number;
  only_in_s1: number;
}

/** Axios response for correlation scatters */
export interface ScatterResponse extends DataSpec, GenericRepository.BaseResponse {
  x: string;
  y: string;
  code: string;
  date: string;
  stats: CorrelationStats;
}

/**
 * Load correlation scatter data for a sepcific url.
 *
 * @param url the url to load
 * @return scatter data
 */
export async function loadScatter(url: string): Promise<ScatterResponse | undefined> {
  return await GenericRepository.getDataFromService<ScatterResponse>(url);
}

/** Ranking of correlation */
export interface Rank {
  column: string;
  missing: number;
  score: number | null;
}

/** Axios response for correlation analysis */
export interface CorrelationAnalysisResponse extends GenericRepository.BaseResponse {
  corrs: Record<string, Record<string, number | null>>;
  ranks: Rank[];
  column_name: string;
  max_score: string | number;
}

/**
 * Load correlation analysis for a dateset.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @return correlation analysis results.
 */
export async function loadAnalysis(dataId: string): Promise<CorrelationAnalysisResponse | undefined> {
  return await GenericRepository.getDataFromService<CorrelationAnalysisResponse>(`/dtale/corr-analysis/${dataId}`);
}
