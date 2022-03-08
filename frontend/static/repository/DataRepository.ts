import { ColumnDef } from '../dtale/DataViewerState';
import { IDX } from '../dtale/gridUtils';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Row object */
type DataRow = { [key: string]: any } & { [IDX]: number };

/** Content returned from the server for the DataViewer */
export interface DataResponseContent {
  results: { [key: number]: DataRow };
  columns: ColumnDef[];
  total: number;
  final_query: string;
}

/** Axios response object for loading data to the grid */
type DataResponse = DataResponseContent & GenericRepository.BaseResponse;

export const ENDPOINT = '/dtale/data';

/**
 * Load data for this instance for a set of rows and sort.
 *
 * @param dataId the identifier of the data instance you would like the code export for.
 * @param params rows ids and sort settings.
 * @return data to be displayed in the main grid.
 */
export async function load(dataId: string, params: Record<string, string>): Promise<DataResponse | undefined> {
  return await GenericRepository.getDataFromService<DataResponse>(buildURLString(`${ENDPOINT}/${dataId}?`, params));
}
