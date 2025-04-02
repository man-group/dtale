import { act, fireEvent, screen } from '@testing-library/react';

import {
  CreateColumnType,
  DatetimeConversionType,
  DatetimeOperation,
  DatetimePropertyType,
  DatetimeTimeDifferenceType,
} from '../../../popups/create/CreateColumnState';
import { validateDatetimeCfg } from '../../../popups/create/CreateDatetime';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDatetime', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Datetime');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[0], { target: { value: 'datetime_col' } });
    });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds datetime property column', async () => {
    expect(screen.getByText('Datetime')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await act(async () => {
      await fireEvent.click(screen.getByText('Property'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Minute'));
    });
    await spies.validateCfg({
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.PROPERTY,
        conversion: undefined,
        property: DatetimePropertyType.MINUTE,
        timeDifference: undefined,
        timeDifferenceCol: undefined,
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
  });

  it('build datetime conversion column', async () => {
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await act(async () => {
      await fireEvent.click(screen.getByText('Conversion'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Month Start'));
    });
    await spies.validateCfg({
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.CONVERSION,
        conversion: DatetimeConversionType.MONTH_START,
        property: undefined,
        timeDifference: undefined,
        timeDifferenceCol: undefined,
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
  });

  it('build datetime time difference column', async () => {
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await act(async () => {
      await fireEvent.click(screen.getByText('Time Difference'));
    });
    await spies.validateCfg({
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.TIME_DIFFERENCE,
        conversion: undefined,
        property: undefined,
        timeDifference: DatetimeTimeDifferenceType.NOW,
        timeDifferenceCol: undefined,
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Col'));
    });
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'col5');
    await spies.validateCfg({
      cfg: {
        col: 'col4',
        operation: DatetimeOperation.TIME_DIFFERENCE,
        conversion: undefined,
        property: undefined,
        timeDifference: DatetimeTimeDifferenceType.COL,
        timeDifferenceCol: 'col5',
      },
      name: 'datetime_col',
      type: CreateColumnType.DATETIME,
    });
  });

  it('DataViewer: build datetime cfg validation', () => {
    expect(validateDatetimeCfg(t, { operation: DatetimeOperation.CONVERSION })).toBe('Missing a column selection!');
  });
});
