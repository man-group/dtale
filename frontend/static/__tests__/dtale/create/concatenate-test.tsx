import { act, fireEvent, getByText, screen } from '@testing-library/react';

import { ConcatenationConfig, CreateColumnType, OperandDataType } from '../../../popups/create/CreateColumnState';
import { validateConcatenateCfg } from '../../../popups/create/CreateConcatenate';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateConcatenate', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Concatenate');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds concatenate column', async () => {
    expect(screen.getByText('Concatenate')).toHaveClass('active');
    await act(async () => {
      await fireEvent.change(result.querySelector('div.form-group')!.getElementsByTagName('input')[0], {
        target: { value: 'numeric_col' },
      });
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
        left: { col: 'col1', type: OperandDataType.COL },
        right: { col: 'col2', type: OperandDataType.COL },
      },
      name: 'numeric_col',
      type: CreateColumnType.CONCATENATE,
    });
  });

  it('validation configuration', () => {
    const cfg: ConcatenationConfig = { left: { type: OperandDataType.COL }, right: { type: OperandDataType.COL } };
    expect(validateConcatenateCfg(t, cfg)).toBe('Left side is missing a column selection!');
    cfg.left = { type: OperandDataType.VAL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Left side is missing a static value!');
    cfg.left = { type: OperandDataType.VAL, val: 'x' };
    cfg.right = { type: OperandDataType.COL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Right side is missing a column selection!');
    cfg.right = { type: OperandDataType.VAL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Right side is missing a static value!');
  });
});
