import { act, fireEvent, screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxTestUtils from '../redux-test-utils';
import { selectOption } from '../test-utils';

import * as TestSupport from './ColumnFilter.test.support';

const INITIAL_UNIQUES = ['a', 'b', 'c', 'd', 'e'];
const ASYNC_OPTIONS = [{ value: 'f' }, { value: 'g' }, { value: 'h' }];

describe('ColumnFilter string tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col3')) {
        return Promise.resolve({ success: true, hasMissing: true, uniques: INITIAL_UNIQUES });
      }
      if (url.startsWith('/dtale/data')) {
        const col3 = reduxTestUtils.DTYPES.dtypes.find((dtype) => dtype.name === 'col3');
        const col3Dtype = { ...col3, unique_ct: 1000 };
        return Promise.resolve({
          ...reduxTestUtils.DATA,
          columns: reduxTestUtils.DATA.columns.map((c) => (c.name === 'col3' ? col3Dtype : c)),
        });
      }
      if (url.startsWith('/dtale/async-column-filter-data/1?col=col3')) {
        return Promise.resolve(ASYNC_OPTIONS);
      }
      return Promise.resolve(undefined);
    });
    result = await spies.setupWrapper({
      selectedCol: 'col3',
      columns: [mockColumnDef({ name: 'col3', unique_ct: 1000 })],
      columnFilters: { col3: { type: 'string', value: ['b'] } },
    });
  });

  afterEach(jest.restoreAllMocks);

  it('ColumnFilter string rendering', async () => {
    expect(result.getElementsByClassName('string-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(result.getElementsByClassName('bp4-disabled')).toHaveLength(0);
    const asyncSelect = result.getElementsByClassName('Select')[1] as HTMLElement;
    await act(async () => {
      await selectEvent.clearAll(asyncSelect);
    });
    await act(async () => {
      await selectEvent.openMenu(asyncSelect);
    });
    await selectOption(asyncSelect, ['a']);
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
