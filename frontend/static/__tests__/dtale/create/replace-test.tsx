import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { BaseCreateComponentProps, CreateColumnType, ReplaceConfig } from '../../../popups/create/CreateColumnState';
import { default as CreateReplace, validateReplaceCfg } from '../../../popups/create/CreateReplace';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateReplace', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Replace');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findReplace = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> => result.find(CreateReplace);

  it('builds replace column', async () => {
    expect(findReplace()).toHaveLength(1);
    await act(async () => {
      findReplace()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findReplace()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'foo' } });
    });
    result = result.update();
    await act(async () => {
      findReplace()
        .find('div.form-group')
        .at(2)
        .find('input')
        .simulate('change', { target: { value: 'bar' } });
    });
    result = result.update();
    await act(async () => {
      findReplace().find('i.ico-check-box-outline-blank').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findReplace().find('i.ico-check-box-outline-blank').first().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        search: 'foo',
        replacement: 'bar',
        caseSensitive: true,
        regex: true,
      },
      name: 'col1_replace',
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
