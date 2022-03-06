import { ColumnDef } from '../dtale/DataViewerState';

import * as GenericRepository from './GenericRepository';

/** Axios response for column definitions */
export interface DtypesResponse extends GenericRepository.BaseResponse {
  dtypes: ColumnDef[];
}

/**
 * Load information on the data types for a sepcific data instance.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @return data types for data instance.
 */
export async function loadDtypes(dataId: string): Promise<DtypesResponse | undefined> {
  return await GenericRepository.getDataFromService<DtypesResponse>(`/dtale/dtypes/${dataId}`);
}
