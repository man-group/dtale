import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { BaseCreateComponentProps, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateExpanding, validateExpandingCfg } from '../../../popups/create/CreateExpanding';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateExpanding', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Expanding');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const expandingInputs = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> =>
    result.find(CreateExpanding).first();

  it('builds expanding column', async () => {
    expect(result.find(CreateExpanding)).toHaveLength(1);
    await act(async () => {
      expandingInputs()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      expandingInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await act(async () => {
      expandingInputs()
        .find(Select)
        .last()
        .props()
        .onChange?.({ value: 'sum' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        periods: 4,
        agg: 'sum',
      },
      name: 'col2_expansion',
      type: CreateColumnType.EXPANDING,
    });
  });

  it('validates configuration', () => {
    expect(validateExpandingCfg(t, { periods: 1 })).toBe('Please select a column!');
    expect(validateExpandingCfg(t, { periods: 1, col: 'x' })).toBe('Please select an aggregation!');
    expect(validateExpandingCfg(t, { periods: 1, col: 'x', agg: 'sum' })).toBeUndefined();
  });
});
