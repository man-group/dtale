import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, ShiftConfig } from '../../../popups/create/CreateColumnState';
import { validateShiftCfg } from '../../../popups/create/CreateShift';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('DataViewer tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Shifting');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('DataViewer: build shift column', async () => {
    expect(screen.getByText('Shifting')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await act(async () => {
      await fireEvent.change(screen.getByText('Periods').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '3' },
      });
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('Fill Value').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '5.5' },
      });
    });
    await spies.validateCfg({
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
