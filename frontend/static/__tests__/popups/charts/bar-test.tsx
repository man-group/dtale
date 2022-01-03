import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { default as AxisEditor, AxisEditorProps } from '../../../popups/charts/AxisEditor';
import ChartsBody from '../../../popups/charts/ChartsBody';
import { getLastChart } from '../../test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts bar tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  const axisEditor = (): ReactWrapper<AxisEditorProps> => result.find(AxisEditor).first();

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
    result = await spies.updateChartType(result, 'bar');
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    let lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.type).toBe('bar');
    await act(async () => {
      result.find(ChartsBody).find(Select).at(1).props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      axisEditor().find('span.axis-select').simulate('click');
    });
    result = result.update();
    await act(async () => {
      axisEditor()
        .find('input')
        .first()
        .simulate('change', { target: { value: '40' } });
    });
    result = result.update();
    await act(async () => {
      axisEditor()
        .find('input')
        .last()
        .simulate('change', { target: { value: '42' } });
    });
    result = result.update();
    await spies.callLastCloseMenu();
    result = result.update();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
    await act(async () => {
      axisEditor().find('span.axis-select').simulate('click');
    });
    result = result.update();
    await act(async () => {
      axisEditor()
        .find('input')
        .first()
        .simulate('change', { target: { value: '40' } });
    });
    result = result.update();
    await act(async () => {
      axisEditor()
        .find('input')
        .last()
        .simulate('change', { target: { value: 'a' } });
    });
    result = result.update();
    await spies.callLastCloseMenu();
    result = result.update();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
    await act(async () => {
      axisEditor()
        .find('input')
        .last()
        .simulate('change', { target: { value: '39' } });
    });
    result = result.update();
    await spies.callLastCloseMenu();
    result = result.update();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
  });
});
