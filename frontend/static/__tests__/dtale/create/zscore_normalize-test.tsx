import { screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateZScoreNormalizeCfg } from '../../../popups/create/CreateZScoreNormalize';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateZScoreNormalize', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('Z-Score Normalize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a z-score normalize column', async () => {
    expect(screen.getByText('Z-Score Normalize')).toHaveClass('active');
    await selectOption(
      screen.getByText('Col').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col1',
    );
    await spies.validateCfg({
      cfg: {
        col: 'col1',
      },
      name: 'col1_normalize',
      type: CreateColumnType.ZSCORE_NORMALIZE,
    });
  });

  it('validates configuration', () => {
    expect(validateZScoreNormalizeCfg(t, {})).toBe('Please select a column to normalize!');
    expect(
      validateZScoreNormalizeCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
