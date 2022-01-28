import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Initial variance check */
export interface VarianceCheck1 {
  unique: number;
  size: number;
  result: boolean;
}

/** Additional variance check */
export interface VarianceCheck2 {
  val1: { val: number; ct: number };
  val2: { val: number; ct: number };
  result: boolean;
}

/** Variance statistics */
export interface VarianceStat {
  statistic: number;
  pvalue: number;
}

/** Axios response for variance data */
export interface VarianceResponse extends GenericRepository.BaseResponse {
  code: string;
  check1: VarianceCheck1;
  check2?: VarianceCheck2;
  size: number;
  outlierCt: number;
  missingCt: number;
  jarqueBera: VarianceStat;
  shapiroWilk: VarianceStat;
}

/**
 * Load variance analysis for a specific column in a dataset.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the column to analyze
 * @param filtered is the data filtered?
 * @return the data identifier of the new data created.
 */
export async function load(dataId: string, col: string, filtered: boolean): Promise<VarianceResponse | undefined> {
  return await GenericRepository.getDataFromService<VarianceResponse>(
    buildURLString(`/dtale/variance/${dataId}`, { col, filtered: `${filtered}` }),
  );
}
