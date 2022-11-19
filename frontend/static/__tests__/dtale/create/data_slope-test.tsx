import { screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateDataSlopeCfg } from '../../../popups/create/CreateDataSlope';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDataSlope', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Data Slope');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds data slope column', async () => {
    expect(screen.getByText('Data Slope')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await spies.validateCfg({
      cfg: {
        col: 'col1',
      },
      name: 'col1_data_slope',
      type: CreateColumnType.DATA_SLOPE,
    });
  });

  it('validates configuration', () => {
    expect(validateDataSlopeCfg(t, {})).toBe('Please select a column!');
    expect(
      validateDataSlopeCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
