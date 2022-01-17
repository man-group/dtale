import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { ActionMeta, GroupBase } from 'react-select';
import { AsyncProps, default as AsyncSelect } from 'react-select/async';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { AsyncOption } from '../../filters/AsyncValueSelect';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import StringFilter from '../../filters/StringFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxTestUtils from '../redux-test-utils';
import { tickUpdate } from '../test-utils';

const INITIAL_UNIQUES = ['a', 'b', 'c', 'd', 'e'];
const ASYNC_OPTIONS = [{ value: 'f' }, { value: 'g' }, { value: 'h' }];

describe('ColumnFilter string tests', () => {
  let result: ReactWrapper<ColumnFilterProps>;
  let saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;

  beforeEach(async () => {
    const fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');

    saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
    const props = {
      selectedCol: 'col3',
      columns: [mockColumnDef({ name: 'col3', unique_ct: 1000 })],
      columnFilters: { col3: { type: 'string', value: ['b'] } },
      updateSettings: jest.fn(),
    };
    result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.restoreAllMocks);

  const findAsync = (): ReactWrapper<AsyncProps<AsyncOption<string>, true, GroupBase<AsyncOption<string>>>> =>
    result.find(AsyncSelect);

  it('ColumnFilter string rendering', async () => {
    expect(result.find(StringFilter).length).toBe(1);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(findAsync().prop('isDisabled')).toBe(true);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(findAsync().prop('isDisabled')).toBe(false);
    const asyncOptions = await findAsync()
      .props()
      .loadOptions?.('a', () => undefined);
    expect(asyncOptions).toEqual(ASYNC_OPTIONS);
    expect(findAsync().props().defaultOptions).toEqual(INITIAL_UNIQUES.map((iu) => ({ value: iu, label: iu })));
    await act(async () => {
      findAsync()
        .props()
        ?.onChange?.([{ value: 'a', label: 'a' }], {
          action: 'select-option',
          option: { value: 'a', label: 'a' },
        } as ActionMeta<AsyncOption<string>>);
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith(
      '1',
      'col3',
      expect.objectContaining({
        type: 'string',
        operand: '=',
        value: ['a'],
      }),
    );
    await act(async () => {
      result.find(StringFilter).find('button').first().simulate('click');
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith(
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
