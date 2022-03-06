import { ReshapeSaveParams } from '../popups/reshape/ReshapeState';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for reshaping data */
export interface SaveResponse extends GenericRepository.BaseResponse {
  data_id: string;
}

/**
 * Rehsape data based on a configuration.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the configuration of how the data should be reshaped.
 * @return the data identifier of the new data created.
 */
export async function save(dataId: string, params: ReshapeSaveParams): Promise<SaveResponse | undefined> {
  return await GenericRepository.getDataFromService<SaveResponse>(
    buildURLString(`/dtale/reshape/${dataId}`, { ...params, cfg: JSON.stringify(params.cfg) }),
  );
}
