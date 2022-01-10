import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateString, validateStringCfg } from '../../../popups/create/CreateString';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateString', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'String');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a transform column', async () => {
    expect(result.find(CreateString)).toHaveLength(1);
    await act(async () => {
      result
        .find(CreateString)
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }, { value: 'col2' }]);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        cols: ['col1', 'col2'],
        joinChar: '_',
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
