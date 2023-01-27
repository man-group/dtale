import { ColumnFilter, OutlierFilter } from '../dtale/DataViewerState';
import { buildURLString } from '../redux/actions/url-utils';
import { PredefinedFilter } from '../redux/state/AppState';

import * as GenericRepository from './GenericRepository';

/**
 * Test a custom filter.
 *
 * @param dataId the identifier of the data instance you would like the code export for.
 * @param query the custom query we would like to test to make sure its valid.
 * @return response information on whether the query was successful or not.
 */
export async function save(dataId: string, query: string): Promise<GenericRepository.BaseResponse | undefined> {
  return await GenericRepository.getDataFromService<GenericRepository.BaseResponse>(
    buildURLString(`/dtale/test-filter/${dataId}`, { query, save: `${true}` }),
  );
}

/** Axios response for loading information regarding custom query filters */
export interface LoadInfoResponse extends GenericRepository.BaseResponse {
  contextVars: Array<{ name: string; value: string }>;
  query: string;
  highlightFilter: boolean;
  columnFilters: Record<string, ColumnFilter>;
  outlierFilters: Record<string, OutlierFilter>;
  predefinedFilters: Record<string, PredefinedFilter>;
  invertFilter: boolean;
}

/**
 * Load custom query filter information related to this data.
 *
 * @param dataId the identifier of the data instance you would like the code export for.
 * @return custom query filter information for this data.
 */
export async function loadInfo(dataId: string): Promise<LoadInfoResponse | undefined> {
  return await GenericRepository.getDataFromService<LoadInfoResponse>(
    buildURLString(`/dtale/filter-info/${dataId}`, {}),
  );
}
