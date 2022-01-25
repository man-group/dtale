import { CreateReplacementSaveParams } from '../popups/replacement/CreateReplacementState';
import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for saving a replacement column */
export interface SaveResponse extends GenericRepository.BaseResponse {
  data_id?: string;
}

/**
 * Create & save a column created from a column replacement configuration.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the configuration of the column replacement being created.
 * @return the data identifier of the new data created if exists, response status otherwise.
 */
export async function save(dataId: string, params: CreateReplacementSaveParams): Promise<SaveResponse | undefined> {
  return await GenericRepository.getDataFromService<SaveResponse>(
    buildURLString(`/dtale/build-replacement/${dataId}`, {
      ...params,
      cfg: JSON.stringify(params.cfg),
    }),
  );
}
