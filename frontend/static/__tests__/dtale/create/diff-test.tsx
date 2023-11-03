import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateDiffCfg } from '../../../popups/create/CreateDiff';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDiff', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Row Difference');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds row difference column', async () => {
    expect(screen.getByText('Row Difference')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await act(async () => {
      const inputs = [...result.getElementsByTagName('input')];
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: '4' } });
    });
    await spies.validateCfg({
      cfg: {
        col: 'col1',
        periods: '4',
      },
      name: 'col1_diff',
      type: CreateColumnType.DIFF,
    });
  });

  it('validates configuration', () => {
    expect(validateDiffCfg(t, { periods: '1' })).toBe('Please select a column!');
    expect(
      validateDiffCfg(t, {
        col: 'col1',
        periods: 'a',
      }),
    ).toBe('Please select a valid value for periods!');
    expect(
      validateDiffCfg(t, {
        col: 'col1',
        periods: '1',
      }),
    ).toBeUndefined();
  });
});
