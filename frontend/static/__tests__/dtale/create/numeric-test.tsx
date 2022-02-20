import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import {
  BaseCreateComponentProps,
  CreateColumnType,
  NumericConfig,
  NumericOperationType,
  OperandDataType,
} from '../../../popups/create/CreateColumnState';
import { default as CreateNumeric, validateNumericCfg } from '../../../popups/create/CreateNumeric';
import { RemovableError } from '../../../RemovableError';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateNumeric', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findNumericInputs = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> =>
    result.find(CreateNumeric).first();
  const findLeftInputs = (): ReactWrapper => findNumericInputs().find('div.form-group').at(1);
  const simulateClick = async (btn: ReactWrapper): Promise<ReactWrapper> => {
    await act(async () => {
      btn.simulate('click');
    });
    return result.update();
  };

  it('validates configuration', () => {
    const cfg: NumericConfig = { left: { type: OperandDataType.COL }, right: { type: OperandDataType.COL } };
    expect(validateNumericCfg(t, cfg)).toBe('Please select an operation!');
    cfg.operation = NumericOperationType.DIFFERENCE;
    expect(validateNumericCfg(t, cfg)).toBe('Left side is missing a column selection!');
    cfg.left = { type: OperandDataType.VAL };
    expect(validateNumericCfg(t, cfg)).toBe('Left side is missing a static value!');
    cfg.left.val = 'x';
    expect(validateNumericCfg(t, cfg)).toBe('Right side is missing a column selection!');
    cfg.right = { type: OperandDataType.VAL };
    expect(validateNumericCfg(t, cfg)).toBe('Right side is missing a static value!');
    cfg.right.val = 'x';
    expect(validateNumericCfg(t, cfg)).toBeUndefined();
  });

  it('builds numeric column', async () => {
    expect(result.find(CreateNumeric)).toHaveLength(1);
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'numeric_col' } });
    });
    result = result.update();
    await simulateClick(findNumericInputs().find('div.form-group').first().find('button').first());
    await simulateClick(findLeftInputs().find('button').first());
    await simulateClick(findLeftInputs().find('button').last());
    await simulateClick(findLeftInputs().find('button').first());
    await act(async () => {
      findLeftInputs()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findNumericInputs()
        .find('div.form-group')
        .at(2)
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        left: { type: OperandDataType.COL, col: 'col1', val: undefined },
        right: { type: OperandDataType.COL, col: 'col2', val: undefined },
        operation: NumericOperationType.SUM,
      },
      name: 'numeric_col',
      type: CreateColumnType.NUMERIC,
    });
  });

  it('handles errors', async () => {
    result = await spies.executeSave(result);
    expect(result.find(RemovableError).text()).toBe('Name is required!');
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'col4' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
    expect(result.find(RemovableError).text()).toBe("The column 'col4' already exists!");
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'error' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
    expect(result.find(RemovableError).text()).toBe('Please select an operation!');

    await simulateClick(findNumericInputs().find('div.form-group').first().find('button').first());
    await simulateClick(findLeftInputs().find('button').first());
    await act(async () => {
      findLeftInputs()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findNumericInputs()
        .find('div.form-group')
        .at(2)
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    spies.saveSpy.mockResolvedValue({ success: false, error: 'error test' });
    result = await spies.executeSave(result);
    expect(result.find(RemovableError).text()).toBe('error test');
  });
});
