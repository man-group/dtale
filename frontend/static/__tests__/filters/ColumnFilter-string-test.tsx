import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { default as Select } from 'react-select';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import StringFilter from '../../filters/StringFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import { tickUpdate } from '../test-utils';

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
        return Promise.resolve({ success: true, hasMissing: true, uniques: ['a', 'b', 'c'] });
      }
      return Promise.resolve(undefined);
    });
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');

    saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
    const props = {
      selectedCol: 'col3',
      columns: [mockColumnDef({ name: 'col3' })],
      columnFilters: { col3: { type: 'string', value: ['b'] } },
      updateSettings: jest.fn(),
    };
    result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
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
        .onChange([{ value: 'a' }]);
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
      result.find('StringFilter').find('button').first().simulate('click');
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
