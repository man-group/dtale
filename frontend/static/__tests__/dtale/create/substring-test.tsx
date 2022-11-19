import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateSubstringCfg } from '../../../popups/create/CreateSubstring';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateSubstring', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a substring column', async () => {
    expect(screen.getByText('Substring')).toHaveClass('active');
    await selectOption(
      screen.getByText('Column*').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col3',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Start').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '2' },
      });
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('End').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '4' },
      });
    });
    await spies.validateCfg({
      cfg: {
        col: 'col3',
        start: '2',
        end: '4',
      },
      name: 'col3_substring',
      type: CreateColumnType.SUBSTRING,
    });
  });

  it('validates configuration', () => {
    expect(validateSubstringCfg(t, { start: '0', end: '0' })).toBe('Missing a column selection!');
    expect(
      validateSubstringCfg(t, {
        col: 'col1',
        start: '0',
        end: '0',
      }),
    ).toBe('Invalid range specification, start must be less than end!');
    expect(
      validateSubstringCfg(t, {
        col: 'col1',
        start: '4',
        end: '2',
      }),
    ).toBe('Invalid range specification, start must be less than end!');
    expect(
      validateSubstringCfg(t, {
        col: 'col1',
        start: '2',
        end: '4',
      }),
    ).toBeUndefined();
  });
});
