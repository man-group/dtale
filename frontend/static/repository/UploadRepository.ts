import { BaseSheet, Dataset, DataType } from '../popups/upload/UploadState';
import { buildURLParams, buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for reshaping data */
export interface UploadResponse extends GenericRepository.BaseResponse {
  sheets?: BaseSheet[];
  data_id?: string;
}

/**
 * Upload datasets to D-Tale.
 *
 * @param params byte string representation of upload.
 * @return status of the upload and any sheets associated with the upload.
 */
export async function upload(params: FormData): Promise<UploadResponse | undefined> {
  return await GenericRepository.postDataToService<FormData, UploadResponse>('/dtale/upload', params);
}

/**
 * Upload datasets to D-Tale from the web.
 *
 * @param type the data type of the upload
 * @param url the URL of the upload
 * @param proxy any proxy information needed to load the URL
 * @return status of the upload and any sheets associated with the upload.
 */
export async function webUpload(type: DataType, url: string, proxy?: string): Promise<UploadResponse | undefined> {
  return await GenericRepository.getDataFromService<UploadResponse>(
    buildURLString('/dtale/web-upload', buildURLParams({ type, url, proxy })),
  );
}

/**
 * Upload preset dataset to D-Tale.
 *
 * @param dataset the dataset to upload
 * @return status of the upload and any sheets associated with the upload.
 */
export async function presetUpload(dataset: Dataset): Promise<UploadResponse | undefined> {
  return await GenericRepository.getDataFromService<UploadResponse>(
    buildURLString('/dtale/datasets', buildURLParams({ dataset })),
  );
}
