import { act, fireEvent } from '@testing-library/react';
import selectEvent from 'react-select-event';

import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { selectOption } from '../test-utils';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter string tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;
  let toggleOutlierFilterSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.ToggleOutlierFilterResponse | undefined>,
    [string, string]
  >;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col3')) {
        return Promise.resolve({ success: true, hasMissing: true, uniques: ['a', 'b', 'c'] });
      }
      if (url.startsWith('/dtale/toggle-outlier-filter/1?col=col3')) {
        return Promise.resolve({ success: true, outlierFilters: {} });
      }
      return Promise.resolve(undefined);
    });

    toggleOutlierFilterSpy = jest.spyOn(ColumnFilterRepository, 'toggleOutlierFilter');

    result = await spies.setupWrapper({
      selectedCol: 'col3',
      columns: [mockColumnDef({ name: 'col3', dtype: 'error', hasOutliers: 1 })],
      columnFilters: { col3: { type: 'string', value: ['b'] } },
      outlierFilters: { col3: { query: 'blah' } },
    });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('ColumnFilter invalid type rendering', async () => {
    expect(result.getElementsByClassName('string-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(toggleOutlierFilterSpy).toHaveBeenCalledWith('1', 'col3');
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBe(0);
    const uniqueSelect = result.getElementsByClassName('Select')[1] as HTMLElement;
    await act(async () => {
      await selectEvent.clearAll(uniqueSelect);
    });
    await selectOption(uniqueSelect, 'a');
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({ type: 'string', operand: '=', value: ['a'] }),
    );
    await act(async () => {
      await fireEvent.click(result.getElementsByTagName('button')[0]);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({ type: 'string', operand: 'ne', value: ['a'] }),
    );
  });
});
