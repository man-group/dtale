import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { ColumnFilterProps } from '../../filters/ColumnFilter';
import NumericFilter from '../../filters/NumericFilter';
import { mockColumnDef } from '../mocks/MockColumnDef';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter numeric tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper<ColumnFilterProps>;

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
    expect(result.find(NumericFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: true });
    expect(result.find('.Select__control--is-disabled').length).toBeGreaterThan(0);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(result.find('.Select__control--is-disabled').length).toBe(0);
    const uniqueSelect = result.find(Select);
    await act(async () => {
      uniqueSelect
        .first()
        .props()
        .onChange?.([{ value: 1 }], {} as ActionMeta<unknown>);
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '=', value: [1] });
    await act(async () => {
      result.find(NumericFilter).find('div.row').first().find('button').at(1).simulate('click');
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: 'ne', value: [1] });
    await act(async () => {
      result.find(NumericFilter).find('div.row').first().find('button').at(3).simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(NumericFilter)
        .find('input')
        .first()
        .simulate('change', { target: { value: 'a' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find(NumericFilter)
        .find('input')
        .first()
        .simulate('change', { target: { value: '0' } });
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '>', value: 0 });
  });

  it('ColumnFilter float rendering', async () => {
    result = await spies.setupWrapper({
      selectedCol: 'col2',
      columns: [mockColumnDef({ name: 'col2', dtype: 'float64', min: 2.5, max: 5.5 })],
    });
    expect(result.find(NumericFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find('input').first().props().disabled).toBe(true);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(result.find('input').first().props().disabled).toBe(false);
    await act(async () => {
      result
        .find(NumericFilter)
        .find('input')
        .first()
        .simulate('change', { target: { value: '1.1' } });
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '=', value: 1.1 });
    await act(async () => {
      result.find(NumericFilter).find('div.row').first().find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(NumericFilter)
        .find('input')
        .first()
        .simulate('change', { target: { value: '1.2' } });
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '()', min: 1.2, max: 3 });
    await act(async () => {
      result
        .find(NumericFilter)
        .find('input')
        .first()
        .simulate('change', { target: { value: 'a' } });
      result
        .find(NumericFilter)
        .find('input')
        .last()
        .simulate('change', { target: { value: 'b' } });
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float' });
  });
});
