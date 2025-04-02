import * as GenericRepository from './GenericRepository';

/** Axios response for aggregations */
export interface AggregationsResponse extends GenericRepository.BaseResponse {
  sum: number;
  mean: number;
  median: number;
}

/** Axios response for column definitions */
export interface WeightedAverageResponse extends GenericRepository.BaseResponse {
  result: number;
}

/**
 * Load aggregations on a column for a specific data instance.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the name of the column we would like to run aggregations on.
 * @param filtered if true, we should apply the current filtering to these aggregations.
 * @return aggregations for this column.
 */
export async function load(dataId: string, col: string, filtered = true): Promise<AggregationsResponse | undefined> {
  return await GenericRepository.getDataFromService<AggregationsResponse>(
    `/dtale/aggregations/${dataId}/${col}?filtered=${filtered ? 'true' : 'false'}`,
  );
}

/**
 * Load weighted average on a column and another column containing weights for a specific data instance.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the name of the column we would like to run weighted average on.
 * @param weights the name of the column containing the weights.
 * @param filtered if true, we should apply the current filtering to these aggregations.
 * @return weighted average
 */
export async function loadWeightedAverage(
  dataId: string,
  col: string,
  weights: string,
  filtered = true,
): Promise<WeightedAverageResponse | undefined> {
  return await GenericRepository.getDataFromService<WeightedAverageResponse>(
    `/dtale/weighted-average/${dataId}/${col}/${weights}?filtered=${filtered ? 'true' : 'false'}`,
  );
}
