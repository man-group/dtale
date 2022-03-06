import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for loading code */
export interface CodeExportResponse extends GenericRepository.BaseResponse {
  code: string;
}

/**
 * Load information related to filtering for a column.
 *
 * @param dataId the identifier of the data instance you would like the code export for.
 * @return filter data for this column.
 */
export async function load(dataId: string): Promise<CodeExportResponse | undefined> {
  return await GenericRepository.getDataFromService<CodeExportResponse>(
    buildURLString(`/dtale/code-export/${dataId}`, {}),
  );
}
