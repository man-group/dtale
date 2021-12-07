import axios, { AxiosResponse } from 'axios';

import { cleanupEndpoint } from './actions/url-utils';

/**
 * Formatter for logging exceptions.
 * @param e error
 * @param callStack callstack of the code throwing this error.
 */
export function logException(e: Error, callStack?: string): void {
  const { fileName, lineNumber } = e as any;
  console.error(`${e.name}: ${e.message} (${fileName}:${lineNumber})`); // eslint-disable-line no-console
  console.error(e.stack); // eslint-disable-line no-console
  console.error(callStack); // eslint-disable-line no-console
}

/**
 * Wrapper on top of axios.get, useful for libraries that want a Promise.
 *
 * @param url the GET endpoint
 * @return a promise evaluating to the response of the axios.get.
 */
export function fetchJsonPromise(url: string): Promise<Record<string, any>> {
  const webRoot = (window as any).resourceBaseUrl;
  if (webRoot) {
    url = cleanupEndpoint(`${webRoot}/${url}`);
  }
  return axios.get(url).then((response: AxiosResponse<Record<string, any>>) => response.data);
}

/**
 * Load JSON from `url`, then execute `callback` with the JSON-decoded result.
 *
 * @param url the GET endpoint
 * @param callback the code to execute after a response is received.
 */
export function fetchJson(url: string, callback?: (data: Record<string, any>) => void): void {
  const callStack = new Error().stack;
  fetchJsonPromise(url)
    .then(callback)
    .catch((e) => logException(e, callStack));
}

/**
 * Wrapper on top of axios.post, useful for libraries that want a Promise.
 *
 * @param url the POST endpoint
 * @param data the parameters to pass to the POST endpoint
 * @return a promise evaluating to the response of the axios.post.
 */
export function fetchPostPromise(url: string, data: Record<string, any>): Promise<Record<string, any>> {
  const webRoot = (window as any).resourceBaseUrl;
  if (webRoot) {
    url = cleanupEndpoint(`${webRoot}/${url}`);
  }
  return axios.post(url, data).then((response: AxiosResponse<Record<string, any>>) => response.data);
}

/**
 * Load JSON from POST `url`, then execute `callback` with the JSON-decoded result.
 *
 * @param url the POST endpoint
 * @param params the parameters to pass to the POST endpoint
 * @param callback the code to execute after a response is received.
 */
export function fetchPost(
  url: string,
  params: Record<string, any>,
  callback: (data: Record<string, any>) => void,
): void {
  const callStack = new Error().stack;
  fetchPostPromise(url, params)
    .then(callback)
    .catch((e) => logException(e, callStack));
}
