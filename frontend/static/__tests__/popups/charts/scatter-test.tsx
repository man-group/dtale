import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { getLastChart } from '../../test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts scatter tests', () => {
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
      filters.first().props().onChange({ value: 'col4' });
      filters
        .at(1)
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    result = await spies.updateChartType(result, 'scatter');
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(getLastChart(spies.createChartSpy).type).toBe('scatter');
    result = await spies.updateChartType(result, 'bar');
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(getLastChart(spies.createChartSpy).type).toBe('bar');
  });
});
