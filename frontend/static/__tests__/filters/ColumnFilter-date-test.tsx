import { act, fireEvent } from '@testing-library/react';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter date tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col4')) {
        return Promise.resolve({
          success: true,
          hasMissing: true,
          min: '20000101',
          max: '20000131',
        });
      }
      return Promise.resolve(undefined);
    });

    result = await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('ColumnFilter date rendering', async () => {
    expect(result.getElementsByClassName('bp4-input').length).toBeGreaterThan(0);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(result.getElementsByClassName('bp4-disabled')).toHaveLength(2);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(result.getElementsByClassName('bp4-disabled')).toHaveLength(0);
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('bp4-input')[0], { target: { value: '20000102' } });
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000131' });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('bp4-input')[1], { target: { value: '20000103' } });
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000103' });
  });
});
