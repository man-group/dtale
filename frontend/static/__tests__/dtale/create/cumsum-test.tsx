import { screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateCumsumCfg } from '../../../popups/create/CreateCumsum';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateCumsum', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Cumulative Sum');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds cumulative sum column', async () => {
    expect(screen.getByText('Cumulative Sum')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'col2');
    await spies.validateCfg({
      cfg: {
        col: 'col1',
        group: ['col2'],
      },
      name: 'col1_cumsum',
      type: CreateColumnType.CUMSUM,
    });
  });

  it('validates configuration', () => {
    expect(validateCumsumCfg(t, {})).toBe('Please select a column!');
    expect(
      validateCumsumCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
