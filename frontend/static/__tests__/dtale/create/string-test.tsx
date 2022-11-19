import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateStringCfg } from '../../../popups/create/CreateString';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateString', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('String');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a transform column', async () => {
    expect(screen.getByText('String')).toHaveClass('active');
    const colSelect = screen.getByText('Columns').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(colSelect, 'col1');
    await selectOption(colSelect, 'col2');
    await spies.validateCfg({
      cfg: {
        cols: ['col1', 'col2'],
        joinChar: '_',
      },
      name: 'col1_col2_concat',
      type: CreateColumnType.STRING,
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('Join Character').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '-' },
      });
    });
    await spies.validateCfg({
      cfg: {
        cols: ['col1', 'col2'],
        joinChar: '-',
      },
      name: 'col1_col2_concat',
      type: CreateColumnType.STRING,
    });
  });

  it('validates configuration', () => {
    expect(validateStringCfg(t, { joinChar: '' })).toBe('Please select at least 2 columns to concatenate!');
    expect(
      validateStringCfg(t, {
        cols: ['col1', 'col2'],
        joinChar: '_',
      }),
    ).toBeUndefined();
  });
});
