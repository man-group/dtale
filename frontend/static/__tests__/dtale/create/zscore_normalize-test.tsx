import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import {
  default as CreateZScoreNormalize,
  validateZScoreNormalizeCfg,
} from '../../../popups/create/CreateZScoreNormalize';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateZScoreNormalize', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Z-Score Normalize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a z-score normalize column', async () => {
    expect(result.find(CreateZScoreNormalize)).toHaveLength(1);
    await act(async () => {
      result.find(CreateZScoreNormalize).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
      },
      name: 'col1_normalize',
      type: CreateColumnType.ZSCORE_NORMALIZE,
    });
  });

  it('validates configuration', () => {
    expect(validateZScoreNormalizeCfg(t, {})).toBe('Please select a column to normalize!');
    expect(
      validateZScoreNormalizeCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
