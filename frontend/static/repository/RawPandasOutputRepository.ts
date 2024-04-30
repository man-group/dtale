import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Popup type names */
export enum FuncType {
  INFO = 'info',
  N_UNIQUE = 'nunique',
  DESCRIBE = 'describe',
}

/** Axios response for loading raw pandas output */
export interface RawPandasResponse extends GenericRepository.BaseResponse {
  output: string;
}

/**
 * Load raw output from pandas function for data instance.
 *
 * @param dataId the identifier of the data instance you would like to run a pandas function on.
 * @param funcType the pandas function to export.
 * @return output for pandas function.
 */
export async function load(dataId: string, funcType: FuncType): Promise<RawPandasResponse | undefined> {
  return await GenericRepository.getDataFromService<RawPandasResponse>(
    buildURLString(`/dtale/raw-pandas/${dataId}`, { func_type: funcType }),
  );
}
