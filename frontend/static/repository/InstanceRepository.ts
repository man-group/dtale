import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Instance properties */
export interface Instance {
  data_id: string;
  rows: number;
  columns: number;
  names?: string;
  start: string;
  ts: number;
  name?: string;
  mem_usage: number;
}

/** Axios response for instances */
export interface InstancesResponse extends GenericRepository.BaseResponse {
  data: Instance[];
}

/**
 * Load information on all the instances that are currently loaded into D-Tale.
 *
 * @return process information.
 */
export async function load(): Promise<InstancesResponse | undefined> {
  return await GenericRepository.getDataFromService<InstancesResponse>('/dtale/processes');
}

/**
 * Cleanup datasets.
 *
 * @param dataIds the identifiers of the datasets to cleanup.
 * @return a promise that executes the cleanup.
 */
export async function cleanupInstances(dataIds: string[]): Promise<GenericRepository.BaseResponse | undefined> {
  return await GenericRepository.getDataFromService<GenericRepository.BaseResponse>(
    buildURLString('/dtale/cleanup-datasets', { dataIds: dataIds.join(',') }),
  );
}

/**
 * Cleanup a dataset.
 *
 * @param dataId the identifier of the data to cleanup.
 * @return a promise that executes the cleanup.
 */
export async function cleanupInstance(dataId: string): Promise<GenericRepository.BaseResponse | undefined> {
  return await cleanupInstances([dataId]);
}
