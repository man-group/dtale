import { DetailData, OutliersData, SequentialDiffs } from '../popups/describe/DescribeState';
import { buildURLString } from '../redux/actions/url-utils';
import { SortDir } from '../redux/state/AppState';

import * as GenericRepository from './GenericRepository';

/** Axios response for loading details */
export interface DetailsResponse extends GenericRepository.BaseResponse, DetailData {
  code: string;
}

/**
 * Load descriptive statistics for a column.
 *
 * @param dataId the identifier of the data instance you would like.
 * @param col the column we would like.
 * @param filtered is the data filtered?
 * @return descriptive statistics for this data and column.
 */
export async function load(dataId: string, col: string, filtered: boolean): Promise<DetailsResponse | undefined> {
  return await GenericRepository.getDataFromService<DetailsResponse>(
    buildURLString(`/dtale/describe/${dataId}`, { col, filtered: `${filtered}` }),
  );
}

/** Axios response for loading outliers */
export type OutliersResponse = GenericRepository.BaseResponse & OutliersData;

/**
 * Load outliers for a column.
 *
 * @param dataId the identifier of the data instance you would like.
 * @param col the column we would like.
 * @param filtered is the data filtered?
 * @return outliers for this data and column.
 */
export async function loadOutliers(
  dataId: string,
  col: string,
  filtered: boolean,
): Promise<OutliersResponse | undefined> {
  return await GenericRepository.getDataFromService<OutliersResponse>(
    buildURLString(`/dtale/outliers/${dataId}`, { col, filtered: `${filtered}` }),
  );
}

/** Axios response for loading sorted sequential differences */
export type SequentialDiffsResponse = GenericRepository.BaseResponse & SequentialDiffs;

/**
 * Load sorted sequential differences for a column.
 *
 * @param dataId the identifier of the data instance you would like.
 * @param col the column we would like.
 * @param sort which way to sort the data.
 * @return sorted sequential differences for this data and column.
 */
export async function loadSequentialDiffs(
  dataId: string,
  col: string,
  sort: SortDir,
): Promise<SequentialDiffsResponse | undefined> {
  return await GenericRepository.getDataFromService<SequentialDiffsResponse>(
    buildURLString(`/dtale/sorted-sequential-diffs/${dataId}`, { col, sort }),
  );
}
