import { act, fireEvent, screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { mockColumnDef } from '../mocks/MockColumnDef';
import { selectOption } from '../test-utils';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter string tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

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
    expect(result.getElementsByClassName('string-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBe(0);
    const valSelect = result.getElementsByClassName('Select')[1] as HTMLElement;
    await act(async () => {
      await selectEvent.clearAll(valSelect);
    });
    await selectOption(valSelect, 'a');
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
      await fireEvent.click(screen.getByText('\u2260'));
    });
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
