import axios from 'axios';

import { logException } from '../fetcher';
import { cleanupEndpoint } from '../redux/actions/url-utils';

const formatEndpoint = (apiEndpoint: string): string => {
  const webRoot = (window as any).resourceBaseUrl;
  if (webRoot) {
    return cleanupEndpoint(`${webRoot}/${apiEndpoint}`);
  }
  return apiEndpoint;
};

/**
 * Get an entity from a service endpoint.
 *
 * This assumes a 200 OK  or 201 CREATED response with data.
 *
 * @param apiEndpoint The API endpoint to call.
 * @return The response body from the service if successful. Failure will result in a thrown Error.
 */
export async function getDataFromService<T>(apiEndpoint: string): Promise<T | undefined> {
  try {
    const response = await axios.get<T>(formatEndpoint(apiEndpoint));
    return response.data;
  } catch (e) {
    logException(e as Error, (e as Error).stack);
  }
  return undefined;
}

/**
 * Post an entity to a service endpoint.
 *
 * This assumes a 200 OK  or 201 CREATED response with data.
 *
 * @param apiEndpoint The API endpoint to call.
 * @param entity The entity to post.
 * @return The response body from the service if successful. Failure will result in a thrown Error.
 */
export async function postDataToService<T, R>(apiEndpoint: string, entity: T): Promise<R | undefined> {
  try {
    const response = await axios.post<R>(formatEndpoint(apiEndpoint), entity);
    return response.data;
  } catch (e) {
    logException(e as Error, (e as Error).stack);
  }
  return undefined;
}
