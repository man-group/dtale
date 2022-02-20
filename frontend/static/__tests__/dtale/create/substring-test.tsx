import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { BaseCreateComponentProps, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateSubstring, validateSubstringCfg } from '../../../popups/create/CreateSubstring';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateSubstring', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findSubstring = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> => result.find(CreateSubstring);

  it('builds a substring column', async () => {
    expect(findSubstring()).toHaveLength(1);
    await act(async () => {
      findSubstring()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findSubstring()
        .find('div.form-group')
        .at(1)
        .find('input')
        .first()
        .simulate('change', { target: { value: '2' } });
    });
    result = result.update();
    await act(async () => {
      findSubstring()
        .find('div.form-group')
        .last()
        .find('input')
        .first()
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        start: '2',
        end: '4',
      },
      name: 'col1_substring',
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
