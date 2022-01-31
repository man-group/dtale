import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { ColumnFilterProps } from '../../filters/ColumnFilter';
import StringFilter from '../../filters/StringFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter string tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper<ColumnFilterProps>;
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
    expect(result.find(StringFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find('.Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      result.find('i.ico-check-box').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('i.ico-check-box').last().simulate('click');
    });
    result = result.update();
    expect(toggleOutlierFilterSpy).toHaveBeenCalledWith('1', 'col3');
    expect(result.find('.Select__control--is-disabled').length).toBe(0);
    const uniqueSelect = result.find(Select);
    await act(async () => {
      uniqueSelect
        .last()
        .props()
        .onChange([{ value: 'a' }]);
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({ type: 'string', operand: '=', value: ['a'] }),
    );
    await act(async () => {
      result.find(StringFilter).find('button').first().simulate('click');
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({ type: 'string', operand: 'ne', value: ['a'] }),
    );
  });
});
