import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { default as Select } from 'react-select';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import NumericFilter from '../../filters/NumericFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { tickUpdate } from '../test-utils';

describe('ColumnFilter numeric tests', () => {
  let result: ReactWrapper<ColumnFilterProps>;
  let saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;

  beforeEach(() => {
    const fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');

    saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
  });

  afterEach(jest.restoreAllMocks);

  const buildResult = async (props: ColumnFilterProps): Promise<void> => {
    result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('ColumnFilter int rendering', async () => {
    await buildResult({
      selectedCol: 'col1',
      columns: [mockColumnDef({ name: 'col1', dtype: 'int64' })],
      updateSettings: jest.fn(),
    });
    expect(result.find(NumericFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: true });
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
        .onChange([{ value: 1 }]);
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '=', value: [1] });
    await act(async () => {
      result.find(NumericFilter).find('div.row').first().find('button').at(1).simulate('click');
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: 'ne', value: [1] });
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
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', operand: '>', value: 0 });
  });

  it('ColumnFilter float rendering', async () => {
    await buildResult({
      selectedCol: 'col2',
      columns: [mockColumnDef({ name: 'col2', dtype: 'float64', min: 2.5, max: 5.5 })],
      updateSettings: jest.fn(),
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
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '=', value: 1.1 });
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
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float', operand: '()', min: 1.2, max: 3 });
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
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col2', { type: 'float' });
  });
});
