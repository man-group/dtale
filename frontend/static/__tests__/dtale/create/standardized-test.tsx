import { screen } from '@testing-library/react';

import { CreateColumnType, StandardizedAlgoType } from '../../../popups/create/CreateColumnState';
import { validateStandardizedCfg } from '../../../popups/create/CreateStandardized';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateStandardized', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('Standardize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a standardized column', async () => {
    expect(screen.getByText('Standardize')).toHaveClass('active');
    const algoSelect = screen.getByText('Algorithm').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(algoSelect, 'QuantileTransformer');
    await selectOption(
      screen.getByText('Column').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col1',
    );
    await selectOption(algoSelect, 'RobustScalar');
    await spies.validateCfg({
      cfg: {
        col: 'col1',
        algo: StandardizedAlgoType.ROBUST,
      },
      name: 'col1_robust',
      type: CreateColumnType.STANDARDIZE,
    });
  });

  it('validates configuration', () => {
    expect(validateStandardizedCfg(t, { algo: StandardizedAlgoType.ROBUST })).toBe('Please select a column!');
    expect(validateStandardizedCfg(t, { col: 'col1', algo: StandardizedAlgoType.POWER })).toBeUndefined();
  });
});
