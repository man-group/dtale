import axios, { AxiosRequestConfig } from 'axios';

import * as GenericRepository from './GenericRepository';

describe('GenericRepository', () => {
  let axiosPostSpy: jest.SpyInstance<
    Promise<unknown>,
    [url: string, data?: unknown, config?: AxiosRequestConfig<unknown>]
  >;
  let axiosGetSpy: jest.SpyInstance<Promise<unknown>, [url: string, config?: AxiosRequestConfig<unknown>]>;

  beforeEach(() => {
    axiosPostSpy = jest.spyOn(axios, 'post');
    axiosPostSpy.mockResolvedValue(Promise.resolve({ data: undefined }));
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockResolvedValue(Promise.resolve({ data: 'bar' }));
  });

  afterEach(jest.restoreAllMocks);

  it('gets successfully', async () => {
    expect(await GenericRepository.getDataFromService<string>('/dtale')).toBe('bar');
  });

  it('posts successfully', async () => {
    expect(await GenericRepository.postDataToService<string, void>('/dtale', 'foo')).toBe(undefined);
  });
});
