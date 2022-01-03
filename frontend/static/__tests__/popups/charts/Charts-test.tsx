import { Chart, ChartEvent } from 'chart.js';
import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { getLastChart, MockChart, mockWordcloud } from '../../test-utils'; // eslint-disable-line import/order
mockWordcloud();

import { JSAnchor } from '../../../JSAnchor';
import Aggregations from '../../../popups/charts/Aggregations';
import ChartsBody from '../../../popups/charts/ChartsBody';
import { RemovableError } from '../../../RemovableError';
import reduxUtils from '../../redux-test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts tests', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  it('Charts: rendering', async () => {
    await act(async () => {
      result.find(Select).first().props().onChange({ value: 'col4' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(Select)
        .at(1)
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    await act(async () => {
      result.find(Select).at(3).props().onChange({ value: 'rolling', label: 'Rolling' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(Aggregations)
        .find('input')
        .at(1)
        .simulate('change', { target: { value: '10' } });
    });
    result = result.update();
    await act(async () => {
      result.find(Aggregations).find(Select).last().props().onChange({ value: 'corr', label: 'Correlation' });
    });
    result = result.update();
    await act(async () => {
      result
        .find('input.form-control')
        .first()
        .simulate('change', { target: { value: "col4 == '20181201'" } });
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(ChartsBody).find('canvas')).toHaveLength(1);
    const params = TestSupport.parseUrlParams(result.find(ChartsBody).props().url);
    expect({ ...params, y: decodeURIComponent(params.y), query: decodeURIComponent(params.query) }).toEqual({
      x: 'col4',
      y: '["col1"]',
      agg: 'rolling',
      query: "col4+==+'20181201'",
      rollingComp: 'corr',
      rollingWin: '10',
    });
    let lastChart = getLastChart(spies.createChartSpy);
    await act(async () => {
      lastChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLElement, lastChart) as any as Chart,
      );
    });
    result = result.update();
    expect(result.find('div.coverage-desc').text()).toBe('Zoomed: 2018-12-17 - 2018-12-25X');
    await act(async () => {
      result.find(ChartsBody).find(JSAnchor).props().onClick();
    });
    result = result.update();
    expect(result.find('div.coverage-desc')).toHaveLength(0);
    result = await spies.updateChartType(result, 'bar');
    expect(getLastChart(spies.createChartSpy).type).toBe('bar');
    result = await spies.updateChartType(result, 'wordcloud');
    result = await spies.updateChartType(result, 'stacked');
    expect((getLastChart(spies.createChartSpy).options?.scales?.x as any)?.stacked).toBe(true);
    result = await spies.updateChartType(result, 'scatter');
    expect(getLastChart(spies.createChartSpy).type).toBe('scatter');
    result = await spies.updateChartType(result, 'pie');
    expect(getLastChart(spies.createChartSpy).type).toBe('pie');
    await act(async () => {
      result.find(Select).at(3).props().onChange(null);
    });
    result = result.update();
    await act(async () => {
      result
        .find(Select)
        .at(2)
        .props()
        .onChange([{ value: 'col3' }]);
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    result = await spies.updateChartType(result, 'line');
    lastChart = getLastChart(spies.createChartSpy);
    expect(
      (lastChart.options?.plugins?.tooltip?.callbacks?.label as any)?.({
        parsed: { x: 1545973200000, y: 1.123456 },
        dataset: { label: 'val1 - col1' },
        datasetIndex: 0,
      }),
    ).toBe('val1 - col1: 1.1235');
    result = await spies.updateChartType(result, 'wordcloud');
    result = await spies.updateChartType(result, 'line');
    await act(async () => {
      result.find(ChartsBody).find(Select).at(1).props().onChange({ value: 'On' });
    });
    result = result.update();
    expect(result.find(ChartsBody).find('canvas')).toHaveLength(2);
    lastChart = getLastChart(spies.createChartSpy);
    expect(
      (lastChart.options?.plugins?.tooltip?.callbacks?.label as any)?.({
        parsed: { x: 1545973200000, y: 1.123456 },
        dataset: { label: '' },
        datasetIndex: 0,
      }),
    ).toBe('1.1235');
    result = await spies.updateChartType(result, 'wordcloud');
    const wc = result.find('CustomMockComponent').first();
    expect((wc.props() as any).callbacks.getWordTooltip({ fullText: 'test', value: 5 })).toBe('test (5)');
  });

  it('Charts: rendering empty data', async () => {
    await act(async () => {
      result.find(Select).first().props().onChange({ value: 'error' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(Select)
        .at(1)
        .props()
        .onChange([{ value: 'error2' }]);
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(RemovableError).props().error).toBe('No data found.');
    result = await spies.updateChartType(result, 'bar');
    expect(result.find(RemovableError).props().error).toBe('No data found.');
  });

  it('Charts: rendering errors', async () => {
    spies.axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/chart-data/')) {
        return Promise.resolve({ data: { error: 'error test' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await act(async () => {
      result.find(Select).first().props().onChange({ value: 'error test' });
    });
    result = result.update();
    await act(async () => {
      result.find('button').first().simulate('click');
    });
    expect(result.find(RemovableError).props().error).toBe('error test');
  });
});
