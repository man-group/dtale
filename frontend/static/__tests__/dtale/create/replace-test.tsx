import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, ReplaceConfig } from '../../../popups/create/CreateColumnState';
import { validateReplaceCfg } from '../../../popups/create/CreateReplace';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateReplace', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Replace');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds replace column', async () => {
    expect(screen.getByText('Replace')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col3');
    await act(async () => {
      await fireEvent.change(screen.getByText('Search For').parentElement!.getElementsByTagName('input')[0], {
        target: { value: 'foo' },
      });
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('Replacement').parentElement!.getElementsByTagName('input')[0], {
        target: { value: 'bar' },
      });
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await spies.validateCfg({
      cfg: {
        col: 'col3',
        search: 'foo',
        replacement: 'bar',
        caseSensitive: true,
        regex: true,
      },
      name: 'col3_replace',
      type: CreateColumnType.REPLACE,
    });
  });

  it('validates configuration', () => {
    const cfg: ReplaceConfig = { search: '', replacement: '', caseSensitive: false, regex: false };
    expect(validateReplaceCfg(t, cfg)).toBe('Missing a column selection!');
    cfg.col = 'col1';
    expect(validateReplaceCfg(t, cfg)).toBe('You must enter a substring to search for!');
    cfg.search = 'foo';
    expect(validateReplaceCfg(t, cfg)).toBe('You must enter a replacement!');
    cfg.replacement = 'bar';
    expect(validateReplaceCfg(t, cfg)).toBeUndefined();
  });
});
