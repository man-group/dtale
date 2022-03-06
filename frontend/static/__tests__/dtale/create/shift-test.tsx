import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { BaseCreateComponentProps, CreateColumnType, ShiftConfig } from '../../../popups/create/CreateColumnState';
import { default as CreateShift, validateShiftCfg } from '../../../popups/create/CreateShift';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('DataViewer tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Shifting');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const shiftInputs = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> =>
    result.find(CreateShift).first();

  it('DataViewer: build shift column', async () => {
    expect(shiftInputs()).toHaveLength(1);
    await act(async () => {
      shiftInputs()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      shiftInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: '3' } });
    });
    result = result.update();
    await act(async () => {
      shiftInputs()
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: '5.5' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        periods: 3,
        fillValue: '5.5',
        dtype: 'float64',
      },
      type: CreateColumnType.SHIFT,
      name: 'col2_shift',
    });
  });

  it('validates configuration', () => {
    const cfg: ShiftConfig = { periods: 1 };
    expect(validateShiftCfg(t, cfg)).toBe('Please select a column!');
    cfg.col = 'x';
    expect(validateShiftCfg(t, cfg)).toBeUndefined();
  });
});
