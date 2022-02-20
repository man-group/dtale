import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { ColumnFilterProps } from '../../filters/ColumnFilter';
import StringFilter from '../../filters/StringFilter';
import { mockColumnDef } from '../mocks/MockColumnDef';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter string tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper<ColumnFilterProps>;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col3')) {
        return Promise.resolve({ success: true, hasMissing: true, uniques: ['a', 'b', 'c'] });
      }
      return Promise.resolve(undefined);
    });
    result = await spies.setupWrapper({
      selectedCol: 'col3',
      columns: [mockColumnDef({ name: 'col3' })],
      columnFilters: { col3: { type: 'string', value: ['b'] } },
    });
  });

  afterEach(jest.restoreAllMocks);

  it('ColumnFilter string rendering', async () => {
    expect(result.find(StringFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find('.Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(result.find('.Select__control--is-disabled').length).toBe(0);
    const uniqueSelect = result.find(Select).last();
    await act(async () => {
      uniqueSelect
        .first()
        .props()
        .onChange?.([{ value: 'a' }], {} as ActionMeta<unknown>);
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({
        type: 'string',
        operand: '=',
        value: ['a'],
      }),
    );
    await act(async () => {
      result.find('StringFilter').find('button').first().simulate('click');
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({
        type: 'string',
        operand: 'ne',
        value: ['a'],
      }),
    );
  });
});
