import { act, fireEvent, getByText, screen } from '@testing-library/react';

import {
  CreateColumnType,
  NumericConfig,
  NumericOperationType,
  OperandDataType,
} from '../../../popups/create/CreateColumnState';
import { validateNumericCfg } from '../../../popups/create/CreateNumeric';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateNumeric', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

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
    expect(screen.getByText('Numeric')).toHaveClass('active');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[0], { target: { value: 'numeric_col' } });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Sum'));
    });
    const leftInputs = screen.getByTestId('left-inputs');
    await act(async () => {
      await fireEvent.click(getByText(leftInputs, 'Col'));
    });
    await act(async () => {
      await fireEvent.click(getByText(leftInputs, 'Val'));
    });
    await act(async () => {
      await fireEvent.click(getByText(leftInputs, 'Col'));
    });
    await selectOption(leftInputs.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(screen.getByTestId('right-inputs').getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await spies.validateCfg({
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
    await spies.executeSave();
    expect(screen.getByRole('alert').textContent).toBe('Name is required!');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[0], { target: { value: 'col4' } });
    });
    await spies.executeSave();
    expect(screen.getByRole('alert').textContent).toBe("The column 'col4' already exists!");
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[0], { target: { value: 'error' } });
    });
    await spies.executeSave();
    expect(screen.getByRole('alert').textContent).toBe('Please select an operation!');
    await act(async () => {
      await fireEvent.click(screen.getByText('Sum'));
    });
    const leftInputs = screen.getByTestId('left-inputs');
    await act(async () => {
      await fireEvent.click(getByText(leftInputs, 'Col'));
    });
    await selectOption(leftInputs.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(screen.getByTestId('right-inputs').getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    spies.saveSpy.mockResolvedValue({ success: false, error: 'error test' });
    await spies.executeSave();
    expect(screen.getByRole('alert').textContent).toBe('error test');
  });
});
