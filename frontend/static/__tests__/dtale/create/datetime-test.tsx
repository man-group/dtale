import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import {
  CreateColumnType,
  DatetimeConversionType,
  DatetimeOperation,
  DatetimePropertyType,
} from '../../../popups/create/CreateColumnState';
import { default as CreateDatetime, validateDatetimeCfg } from '../../../popups/create/CreateDatetime';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDatetime', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Datetime');
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'datetime_col' } });
    });
    result = result.update();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const dateInputs = (): ReactWrapper => result.find(CreateDatetime).first();

  it('builds datetime property column', async () => {
    expect(result.find(CreateDatetime)).toHaveLength(1);
    await act(async () => {
      dateInputs().find(Select).first().props().onChange({ value: 'col4' });
    });
    result = result.update();
    await act(async () => {
      dateInputs().find('div.form-group').at(2).find('button').first().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.PROPERTY,
        conversion: undefined,
        property: DatetimePropertyType.MINUTE,
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
  });

  it('build datetime conversion column', async () => {
    await act(async () => {
      dateInputs().find(Select).first().props().onChange({ value: 'col4' });
    });
    result = result.update();
    await act(async () => {
      dateInputs().find('div.form-group').at(1).find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      dateInputs().find('div.form-group').at(2).find('button').first().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.CONVERSION,
        conversion: DatetimeConversionType.MONTH_START,
        property: undefined,
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
  });

  it('DataViewer: build datetime cfg validation', () => {
    expect(validateDatetimeCfg(t, { operation: DatetimeOperation.CONVERSION })).toBe('Missing a column selection!');
  });
});
