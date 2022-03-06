import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import Aggregations from '../../../popups/charts/Aggregations';
import { RemovableError } from '../../../RemovableError';

import * as TestSupport from './charts.test.support';

describe('Charts rolling tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  it('Charts: rendering', async () => {
    const filters = result.find(Select);
    await act(async () => {
      filters
        .first()
        .props()
        .onChange?.({ value: 'col4' }, {} as ActionMeta<unknown>);
      filters
        .at(1)
        .props()
        .onChange?.([{ value: 'col1' }], {} as ActionMeta<unknown>);
      filters
        .at(3)
        .props()
        .onChange?.({ value: 'rolling', label: 'Rolling' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      result
        .find(Aggregations)
        .find('input')
        .at(1)
        .simulate('change', { target: { value: '' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find(Aggregations)
        .find(Select)
        .last()
        .props()
        .onChange?.({ value: 'corr', label: 'Correlation' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(RemovableError).first().props().error).toBe('Aggregation (rolling) requires a window');
    await act(async () => {
      result
        .find(Aggregations)
        .find('input')
        .at(1)
        .simulate('change', { target: { value: '10' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find(Aggregations)
        .find(Select)
        .last()
        .props()
        .onChange?.(null, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(RemovableError).first().props().error).toBe('Aggregation (rolling) requires a computation');
  });
});
