import { act, fireEvent, screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxTestUtils from '../redux-test-utils';
import { selectOption } from '../test-utils';

import * as TestSupport from './ColumnFilter.test.support';

const INITIAL_UNIQUES = [1, 2, 3, 4, 5];
const ASYNC_OPTIONS = [{ value: 6 }, { value: 7 }, { value: 8 }];

describe('ColumnFilter numeric tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col5')) {
        return Promise.resolve({
          success: true,
          hasMissing: true,
          uniques: INITIAL_UNIQUES,
          min: 1,
          max: 10,
        });
      }
      if (url.startsWith('/dtale/data')) {
        const col1 = reduxTestUtils.DTYPES.dtypes.find((dtype) => dtype.name === 'col1');
        const col1Dtype = { ...col1, unique_ct: 1000 };
        return Promise.resolve({
          ...reduxTestUtils.DATA,
          columns: reduxTestUtils.DATA.columns.map((c) => (c.name === 'col1' ? col1Dtype : c)),
        });
      }
      if (url.startsWith('/dtale/async-column-filter-data/1?col=col1')) {
        return Promise.resolve(ASYNC_OPTIONS);
      }
      return Promise.resolve(undefined);
    });
    result = await spies.setupWrapper({
      selectedCol: 'col5',
      columns: [mockColumnDef({ name: 'col5', dtype: 'int64', unique_ct: 1000 })],
    });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('ColumnFilter int rendering', async () => {
    expect(result.getElementsByClassName('numeric-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col5', { type: 'int', missing: true });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(result.getElementsByClassName('bp4-disabled')).toHaveLength(0);
    const asyncSelect = result.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(asyncSelect);
    });
    await selectOption(asyncSelect, '1');
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col5', { type: 'int', operand: '=', value: [1] });
    await act(async () => {
      await fireEvent.click(screen.getByText('\u2260')); // not equal
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col5', { type: 'int', operand: 'ne', value: [1] });
    await act(async () => {
      await fireEvent.click(screen.getByText('>'));
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('numeric-filter')[0], { target: { value: 'a' } });
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('numeric-filter')[0], { target: { value: '0' } });
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col5', { type: 'int', operand: '>', value: 0 });
  });
});
