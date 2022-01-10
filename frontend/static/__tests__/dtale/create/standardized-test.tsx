import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType, StandardizedAlgoType } from '../../../popups/create/CreateColumnState';
import { default as CreateStandardized, validateStandardizedCfg } from '../../../popups/create/CreateStandardized';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateStandardized', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Standardize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findStandardized = (): ReactWrapper => result.find(CreateStandardized);

  it('builds a standardized column', async () => {
    expect(result.find(CreateStandardized)).toHaveLength(1);
    await act(async () => {
      findStandardized().find(Select).at(1).props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      findStandardized().find(Select).first().props().onChange({ value: 'quantile' });
    });
    result = result.update();
    await act(async () => {
      findStandardized().find(Select).first().props().onChange({ value: 'robust' });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        algo: StandardizedAlgoType.ROBUST,
      },
      name: 'col1_robust',
      type: CreateColumnType.STANDARDIZE,
    });
  });

  it('validates configuration', () => {
    expect(validateStandardizedCfg(t, { algo: StandardizedAlgoType.ROBUST })).toBe('Please select a column!');
    expect(validateStandardizedCfg(t, { col: 'col1', algo: StandardizedAlgoType.POWER })).toBeUndefined();
  });
});
