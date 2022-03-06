import { ColumnDef } from '../dtale/DataViewerState';
import { IDX } from '../dtale/gridUtils';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Row object */
type DataRow = { [key: string]: any } & { [IDX]: number };

/** Axios response object for loading data to the grid */
interface DataResponse extends GenericRepository.BaseResponse {
  results: { [key: number]: DataRow };
  columns: ColumnDef[];
  total: number;
  final_query: string;
}

/**
 * Load data for this instance for a set of rows and sort.
 *
 * @param dataId the identifier of the data instance you would like the code export for.
 * @param params rows ids and sort settings.
 * @return data to be displayed in the main grid.
 */
export async function load(dataId: string, params: Record<string, string>): Promise<DataResponse | undefined> {
  return await GenericRepository.getDataFromService<DataResponse>(buildURLString(`/dtale/data/${dataId}?`, params));
}
