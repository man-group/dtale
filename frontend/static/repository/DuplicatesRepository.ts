import { DuplicateRequestParams } from '../popups/duplicates/DuplicatesState';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for testing duplicates configurations */
export interface DuplicatesResponse<T> extends GenericRepository.BaseResponse {
  results: T;
}

/** Axios response for executing duplicates configurations */
export interface ExecuteDuplicates extends GenericRepository.BaseResponse {
  data_id: string;
}

/**
 * Loads the results for a duplication check.
 *
 * @param dataId the identifier of the data instance you would like.
 * @param params the config, type & action to run.
 * @return information about any duplicates found.
 */
export async function run<T>(dataId: string, params: DuplicateRequestParams): Promise<T | undefined> {
  return await GenericRepository.getDataFromService<T>(
    buildURLString(`/dtale/duplicates/${dataId}`, { ...params, cfg: JSON.stringify(params.cfg) }),
  );
}
