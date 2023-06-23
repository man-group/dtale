import { ColumnFilter, OutlierFilter } from '../dtale/DataViewerState';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Data pertaining to a column filter */
export interface ColumnFilterData {
  uniques?: Array<string | number>;
  min?: number | string;
  max?: number | string;
  hasMissing: boolean;
}

/** Axios response object for loading column filter data */
type ColumnFilterDataResponse = GenericRepository.BaseResponse & ColumnFilterData;

/** Axios response type for loading asynchronous filtering options */
export type AsyncColumnFilterDataResponse<T> = Array<{ label: string; value: T }>;

/**
 * Load information related to filtering for a column.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the column we would like to load the filter data for.
 * @return filter data for this column.
 */
export async function loadFilterData(dataId: string, col: string): Promise<ColumnFilterDataResponse | undefined> {
  return await GenericRepository.getDataFromService<ColumnFilterDataResponse>(
    buildURLString(`/dtale/column-filter-data/${dataId}`, { col }),
  );
}

/**
 * Load filtering options for a column asynchronously.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the column we would like to load the filter options for.
 * @param input the input string from react-select
 * @return filtering options
 */
export async function loadAsyncData<T>(
  dataId: string,
  col: string,
  input: string,
): Promise<AsyncColumnFilterDataResponse<T> | undefined> {
  return await GenericRepository.getDataFromService<AsyncColumnFilterDataResponse<T>>(
    buildURLString(`/dtale/async-column-filter-data/${dataId}`, { col, input }),
  );
}

/** Axios response object for saving a column filter */
export interface SaveFilterResponse extends GenericRepository.BaseResponse {
  currFilters?: Record<string, ColumnFilter>;
}

/**
 * Save a column filter to the server.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the column whose filter we would like to save.
 * @param cfg the column filter configuration.
 * @return current column filters
 */
export async function save(dataId: string, col: string, cfg?: ColumnFilter): Promise<SaveFilterResponse | undefined> {
  const url = buildURLString(`/dtale/save-column-filter/${dataId}`, { col, cfg: JSON.stringify(cfg) });
  return await GenericRepository.getDataFromService<SaveFilterResponse>(url);
}

/** Axios response object for toggling an outlier filter */
export interface ToggleOutlierFilterResponse extends GenericRepository.BaseResponse {
  outlierFilters: Record<string, OutlierFilter>;
}

/**
 * Toggle the state of an outlier filter for a specific column.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param col the column whose outlier filter we would like to toggle.
 * @return outlier filters
 */
export async function toggleOutlierFilter(
  dataId: string,
  col: string,
): Promise<ToggleOutlierFilterResponse | undefined> {
  const url = buildURLString(`/dtale/toggle-outlier-filter/${dataId}`, { col });
  return await GenericRepository.getDataFromService<ToggleOutlierFilterResponse>(url);
}
