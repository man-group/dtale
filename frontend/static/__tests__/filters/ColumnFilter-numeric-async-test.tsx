import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { ActionMeta, GroupBase } from 'react-select';
import { AsyncProps, default as AsyncSelect } from 'react-select/async';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { AsyncOption } from '../../filters/AsyncValueSelect';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import NumericFilter from '../../filters/NumericFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxTestUtils from '../redux-test-utils';
import { tickUpdate } from '../test-utils';

const INITIAL_UNIQUES = [1, 2, 3, 4, 5];
const ASYNC_OPTIONS = [{ value: 6 }, { value: 7 }, { value: 8 }];

describe('ColumnFilter numeric tests', () => {
  let result: ReactWrapper<ColumnFilterProps>;
  let saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;

  beforeEach(async () => {
    const fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col1')) {
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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');

    saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
  });

  const buildResult = async (props: ColumnFilterProps): Promise<void> => {
    result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  };
  const findAsync = (): ReactWrapper<AsyncProps<AsyncOption<number>, true, GroupBase<AsyncOption<number>>>> =>
    result.find(AsyncSelect);

  it('ColumnFilter int rendering', async () => {
    await buildResult({
      selectedCol: 'col1',
      columns: [mockColumnDef({ name: 'col1', dtype: 'int64', unique_ct: 1000 })],
      updateSettings: jest.fn(),
    });
    expect(result.find(NumericFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col1', { type: 'int', missing: true });
    expect(findAsync().props().isDisabled).toBe(true);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(findAsync().prop('isDisabled')).toBe(false);
    const asyncOptions = await findAsync()
      .props()
      .loadOptions?.('1', () => undefined);
    expect(asyncOptions).toEqual(ASYNC_OPTIONS);
    expect(findAsync().props().defaultOptions).toEqual(INITIAL_UNIQUES.map((iu) => ({ value: iu, label: `${iu}` })));
    await act(async () => {
      findAsync()
        .props()
        ?.onChange?.([{ value: 1, label: '1' }], {
          action: 'select-option',
          option: { value: 1, label: '1' },
        } as ActionMeta<AsyncOption<number>>);
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
});
