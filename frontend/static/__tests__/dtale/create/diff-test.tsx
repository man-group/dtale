import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateDiff, validateDiffCfg } from '../../../popups/create/CreateDiff';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDiff', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Row Difference');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds row difference column', async () => {
    expect(result.find(CreateDiff)).toHaveLength(1);
    await act(async () => {
      result.find(CreateDiff).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateDiff)
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        periods: '4',
      },
      name: 'col1_diff',
      type: CreateColumnType.DIFF,
    });
  });

  it('validates configuration', () => {
    expect(validateDiffCfg(t, { periods: '1' })).toBe('Please select a column!');
    expect(
      validateDiffCfg(t, {
        col: 'col1',
        periods: 'a',
      }),
    ).toBe('Please select a valid value for periods!');
    expect(
      validateDiffCfg(t, {
        col: 'col1',
        periods: '1',
      }),
    ).toBeUndefined();
  });
});
