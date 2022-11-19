import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateExpandingCfg } from '../../../popups/create/CreateExpanding';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateExpanding', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Expanding');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds expanding column', async () => {
    expect(screen.getByText('Expanding')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await act(async () => {
      await fireEvent.change(screen.getByText('Min Periods').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '4' },
      });
    });
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'Sum');
    await spies.validateCfg({
      cfg: {
        col: 'col2',
        periods: 4,
        agg: 'sum',
      },
      name: 'col2_expansion',
      type: CreateColumnType.EXPANDING,
    });
  });

  it('validates configuration', () => {
    expect(validateExpandingCfg(t, { periods: 1 })).toBe('Please select a column!');
    expect(validateExpandingCfg(t, { periods: 1, col: 'x' })).toBe('Please select an aggregation!');
    expect(validateExpandingCfg(t, { periods: 1, col: 'x', agg: 'sum' })).toBeUndefined();
  });
});
