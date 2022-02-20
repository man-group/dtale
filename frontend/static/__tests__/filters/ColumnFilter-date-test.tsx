import { DateInput } from '@blueprintjs/datetime';
import { ReactWrapper } from 'enzyme';
import moment from 'moment';
import { act } from 'react-dom/test-utils';

import { ColumnFilterProps } from '../../filters/ColumnFilter';
import DateFilter from '../../filters/DateFilter';

import * as TestSupport from './ColumnFilter.test.support';

describe('ColumnFilter date tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper<ColumnFilterProps>;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
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

    result = await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('ColumnFilter date rendering', async () => {
    expect(result.find(DateFilter).length).toBeGreaterThan(0);
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find(DateInput).first().props().disabled).toBe(true);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(result.find(DateInput).first().props().disabled).toBe(false);
    let dateStart = result.find(DateInput).first().instance();
    (dateStart as any).inputElement.value = '200';
    await act(async () => {
      (dateStart.props as any).onChange('200');
    });
    result = result.update();
    dateStart = result.find(DateInput).first().instance();
    (dateStart as any).inputElement.value = '20000102';
    await act(async () => {
      (dateStart.props as any).onChange(moment('20000102').toDate());
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000131' });
    const dateEnd = result.find(DateInput).last().instance();
    (dateEnd as any).inputElement.value = '20000103';
    await act(async () => {
      (dateEnd.props as any).onChange(moment('20000103').toDate());
    });
    result = result.update();
    expect(spies.saveSpy).toHaveBeenLastCalledWith('1', 'col4', { type: 'date', start: '20000102', end: '20000103' });
  });
});
