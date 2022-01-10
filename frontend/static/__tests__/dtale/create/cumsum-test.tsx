import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateCumsum, validateCumsumCfg } from '../../../popups/create/CreateCumsum';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateCumsum', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Cumulative Sum');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds cumulative sum column', async () => {
    expect(result.find(CreateCumsum)).toHaveLength(1);
    await act(async () => {
      result.find(CreateCumsum).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateCumsum)
        .find(Select)
        .last()
        .props()
        .onChange([{ value: 'col2' }]);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        group: ['col2'],
      },
      name: 'col1_cumsum',
      type: CreateColumnType.CUMSUM,
    });
  });

  it('validates configuration', () => {
    expect(validateCumsumCfg(t, {})).toBe('Please select a column!');
    expect(
      validateCumsumCfg(t, {
        col: 'col1',
      }),
    ).toBeUndefined();
  });
});
