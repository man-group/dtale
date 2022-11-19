import axios from 'axios';

import * as GenericRepository from './GenericRepository';

describe('GenericRepository', () => {
  beforeEach(() => {
    (axios.post as any).mockResolvedValue(Promise.resolve({ data: undefined }));
    (axios.get as any).mockResolvedValue(Promise.resolve({ data: 'bar' }));
  });

  afterEach(jest.restoreAllMocks);

  it('gets successfully', async () => {
    expect(await GenericRepository.getDataFromService<string>('/dtale')).toBe('bar');
  });

  it('posts successfully', async () => {
    expect(await GenericRepository.postDataToService<string, void>('/dtale', 'foo')).toBe(undefined);
  });
});
