import { act, fireEvent, screen } from '@testing-library/react';

import { mockColumnDef } from '../mocks/MockColumnDef';
import { selectOption, tick } from '../test-utils';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter numeric tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(() => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col1')) {
        return Promise.resolve({
          success: true,
          hasMissing: true,
          uniques: [1, 2, 3],
          min: 1,
          max: 3,
        });
      }
      if (url.startsWith('/dtale/column-filter-data/1?col=col2')) {
        return Promise.resolve({ success: true, hasMissing: true, min: 1.0, max: 3.0 });
      }
      return Promise.resolve(undefined);
    });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('ColumnFilter int rendering', async () => {
    result = await spies.setupWrapper({
      selectedCol: 'col1',
      columns: [mockColumnDef({ name: 'col1', dtype: 'int64' })],
    });
    expect(result.getElementsByClassName('numeric-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(screen.getByText('Missing'));
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: true, populated: false });
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      await fireEvent.click(screen.getByText('Missing'));
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: false, populated: false });
    expect(result.getElementsByClassName('Select__control--is-disabled').length).toBe(0);
    await act(async () => {
      await fireEvent.click(screen.getByText('Populated'));
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: false, populated: true });
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 1);
    await act(async () => {
      await tick(300);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '=', value: [1] });
    await act(async () => {
      await fireEvent.click(screen.getByText('\u2260'));
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: 'ne', value: [1] });
    await act(async () => {
      await fireEvent.click(screen.getByText('>'));
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('numeric-filter')[0], { target: { value: 'a' } });
    });
    await act(async () => {
      await tick(300);
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('numeric-filter')[0], { target: { value: '0' } });
    });
    await act(async () => {
      await tick(300);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '>', value: 0 });
  });

  it('ColumnFilter float rendering', async () => {
    result = await spies.setupWrapper({
      selectedCol: 'col2',
      columns: [mockColumnDef({ name: 'col2', dtype: 'float64', min: 2.5, max: 5.5 })],
    });
    expect(result.getElementsByClassName('numeric-filter-inputs').length).toBe(1);
    await act(async () => {
      await fireEvent.click(screen.getByText('Missing'));
    });
    const numericInput = (idx = 0): HTMLInputElement =>
      result.getElementsByClassName('numeric-filter')[idx] as HTMLInputElement;
    expect(numericInput().disabled).toBe(true);
    await act(async () => {
      await fireEvent.click(screen.getByText('Missing'));
    });
    expect(numericInput().disabled).toBe(false);
    await act(async () => {
      await fireEvent.change(numericInput(), { target: { value: '1.1' } });
    });
    await act(async () => {
      await tick(300);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '=', value: 1.1 });
    await act(async () => {
      await fireEvent.click(screen.getByText('()'));
    });
    await act(async () => {
      await fireEvent.change(numericInput(0), { target: { value: '1.2' } });
    });
    await act(async () => {
      await tick(300);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '()', min: 1.2, max: 3 });
    await act(async () => {
      await fireEvent.change(numericInput(0), { target: { value: 'a' } });
    });
    await act(async () => {
      await tick(300);
    });
    await act(async () => {
      await fireEvent.change(numericInput(1), { target: { value: 'b' } });
    });
    await act(async () => {
      await tick(300);
    });
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float' });
  });

  it('ColumnFilter int rendering w/ ArcticDB', async () => {
    result = await spies.setupWrapper(
      {
        selectedCol: 'col1',
        columns: [mockColumnDef({ name: 'col1', dtype: 'int64' })],
      },
      { isArcticDB: '100' },
    );
    const filterInputs = result.getElementsByClassName('numeric-filter-inputs')[0];
    expect(Array.from(filterInputs.getElementsByTagName('button')).map((b) => b.textContent)).toEqual([
      '=',
      '≠',
      '<',
      '>',
      '<=',
      '>=',
    ]);
    expect(result.getElementsByClassName('Select')).toHaveLength(1);
  });

  it('ColumnFilter int rendering w/ large ArcticDB', async () => {
    result = await spies.setupWrapper(
      {
        selectedCol: 'col1',
        columns: [mockColumnDef({ name: 'col1', dtype: 'int64' })],
      },
      { isArcticDB: '3000000' },
    );
    expect(result.querySelector('input[type="text"]')).toBeDefined();
  });
});
