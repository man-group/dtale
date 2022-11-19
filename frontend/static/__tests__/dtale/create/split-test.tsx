import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateStringSplittingCfg } from '../../../popups/create/CreateStringSplitting';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateStringSplitting', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('Split By Character');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a split column', async () => {
    expect(screen.getByText('Split By Character')).toHaveClass('active');
    await selectOption(
      screen.getByText('Column*').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col3',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Delimiter').parentElement!.getElementsByTagName('input')[0], {
        target: { value: ',' },
      });
    });
    await spies.validateCfg({
      cfg: {
        col: 'col3',
        delimiter: ',',
      },
      name: 'col3_split',
      type: CreateColumnType.SPLIT,
    });
  });

  it('validates configuration', () => {
    expect(validateStringSplittingCfg(t, { delimiter: '' })).toBe('Missing a column selection!');
    expect(
      validateStringSplittingCfg(t, {
        col: 'col1',
        delimiter: ',',
      }),
    ).toBeUndefined();
  });
});
