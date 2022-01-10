import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import {
  default as CreateStringSplitting,
  validateStringSplittingCfg,
} from '../../../popups/create/CreateStringSplitting';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateStringSplitting', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Split By Character');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a split column', async () => {
    expect(result.find(CreateStringSplitting)).toHaveLength(1);
    await act(async () => {
      result.find(CreateStringSplitting).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result
        .find('div.form-group')
        .last()
        .find('input')
        .first()
        .simulate('change', { target: { value: ',' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        delimiter: ',',
      },
      name: 'col1_split',
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
