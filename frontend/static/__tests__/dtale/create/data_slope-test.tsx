import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateDataSlope, validateDataSlopeCfg } from '../../../popups/create/CreateDataSlope';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateDataSlope', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Data Slope');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds data slope column', async () => {
    expect(result.find(CreateDataSlope)).toHaveLength(1);
    await act(async () => {
      result.find(CreateDataSlope).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
      },
      name: 'col1_data_slope',
      type: CreateColumnType.DATA_SLOPE,
    });
  });

  it('validates configuration', () => {
    expect(validateDataSlopeCfg(t, {})).toBe('Please select a column!');
    expect(
      validateDataSlopeCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
