import { DateInput } from '@blueprintjs/datetime';
import { mount, ReactWrapper } from 'enzyme';
import moment from 'moment';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import DateFilter from '../../filters/DateFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { tickUpdate } from '../test-utils';

describe('ColumnFilter date tests', () => {
  let result: ReactWrapper<ColumnFilterProps>;
  let saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;

  beforeEach(async () => {
    const fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/column-filter-data/1?col=col4')) {
        return Promise.resolve({
          success: true,
          hasMissing: true,
          min: '20000101',
          max: '20000131',
        });
      }
      return Promise.resolve(undefined);
    });

    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');

    saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));

    const props = {
      selectedCol: 'col4',
      columns: [{ name: 'col4', dtype: 'datetime64[ns]', visible: true, unique_ct: 10, locked: false }],
      updateSettings: jest.fn(),
    };
    result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.restoreAllMocks);

  it('ColumnFilter date rendering', async () => {
    expect(result.find(DateFilter).length).toBeGreaterThan(0);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find(DateInput).first().instance().props.disabled).toBe(true);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(result.find(DateInput).first().instance().props.disabled).toBe(false);
    const dateStart = result.find(DateInput).first().instance();
    (dateStart as any).inputElement.value = '200';
    await act(async () => {
      dateStart.props.onChange('200');
    });
    result = result.update();
    (dateStart as any).inputElement.value = '20000102';
    await act(async () => {
      dateStart.props.onChange(moment('20000102').toDate());
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000131' });
    const dateEnd = result.find(DateInput).last().instance();
    (dateEnd as any).inputElement.value = '20000103';
    await act(async () => {
      dateEnd.props.onChange(moment('20000103').toDate());
    });
    result = result.update();
    expect(saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000103' });
  });
});
