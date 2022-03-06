import * as serverState from '../../dtale/serverStateManagement';
import * as GenericRepository from '../../repository/GenericRepository';

describe('serverStateManagement', () => {
  let getSpy: jest.SpyInstance<Promise<unknown>, [string]>;
  let postSpy: jest.SpyInstance<Promise<unknown>, [string, unknown]>;

  beforeEach(() => {
    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve(undefined));
    getSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    getSpy.mockResolvedValue(Promise.resolve(undefined));
  });

  afterEach(jest.restoreAllMocks);

  it('generates the right URL for updatePinMenu', async () => {
    await serverState.updatePinMenu(true);
    expect(getSpy).toHaveBeenLastCalledWith('/dtale/update-pin-menu?pinned=true');
  });

  it('generates the right URL for updateLanguage', async () => {
    await serverState.updateLanguage('cn');
    expect(getSpy).toHaveBeenLastCalledWith('/dtale/update-language?language=cn');
  });

  it('generates the right URL for updateMaxColumnWidth', async () => {
    await serverState.updateMaxColumnWidth(100);
    expect(getSpy).toHaveBeenLastCalledWith('/dtale/update-maximum-column-width?width=100');
  });

  it('generates the right post URL for updateVisibility', async () => {
    const params = { foo: true };
    await serverState.updateVisibility('1', params);
    expect(postSpy).toHaveBeenCalledWith('/dtale/update-visibility/1', { visibility: JSON.stringify(params) });
  });
});
