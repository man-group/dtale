import { act, fireEvent, screen } from '@testing-library/react';
import axios from 'axios';
import { Chart, ChartEvent } from 'chart.js';
import selectEvent from 'react-select-event';

import reduxUtils from '../../redux-test-utils';
import { getLastChart, MockChart, mockWordcloud, parseUrlParams, selectOption } from '../../test-utils';
mockWordcloud();

import * as TestSupport from './charts.test.support';

describe('Charts tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  it('Charts: rendering', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(
      screen.getByText('Group').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    await selectOption(
      screen.getByText('Aggregation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Rolling',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Window').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '10' },
      });
    });
    await selectOption(
      screen.getByText('Computation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Correlation',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Query').parentElement!.getElementsByTagName('input')[0], {
        target: { value: "col4 == '20181201'" },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(result.getElementsByTagName('canvas')).toHaveLength(1);
    const params = parseUrlParams(spies.geLastChartUrl() ?? '');
    expect({ ...params, y: decodeURIComponent(params.y), query: decodeURIComponent(params.query) }).toEqual({
      x: 'col4',
      y: '["col1"]',
      group: '["col2"]',
      agg: 'rolling',
      query: "col4+==+'20181201'",
      rollingComp: 'corr',
      rollingWin: '10',
    });
    const lastChart = getLastChart(spies.createChartSpy);
    await act(async () => {
      lastChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLCanvasElement, lastChart) as any as Chart,
      );
    });
    const coverageDesc = result.querySelector('div.coverage-desc')!;
    expect(coverageDesc.textContent).toBe('Zoomed: 2018-12-17 - 2018-12-26X');
    await act(async () => {
      await fireEvent.click(coverageDesc.getElementsByTagName('a')[0]);
    });
    expect(result.querySelectorAll('div.coverage-desc')).toHaveLength(0);
    await spies.updateChartType('bar');
    expect(getLastChart(spies.createChartSpy).type).toBe('bar');
    await spies.updateChartType('wordcloud');
    await spies.updateChartType('stacked');
    expect((getLastChart(spies.createChartSpy).options?.scales?.x as any)?.stacked).toBe(true);
  });

  it('Charts: rendering w/o groups', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    const aggSelect = screen.getByText('Aggregation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(aggSelect, 'Mean');
    await act(async () => {
      await fireEvent.change(screen.getByText('Query').parentElement!.getElementsByTagName('input')[0], {
        target: { value: "col4 == '20181201'" },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    await spies.updateChartType('scatter');
    expect(getLastChart(spies.createChartSpy).type).toBe('scatter');
    await spies.updateChartType('pie');
    expect(getLastChart(spies.createChartSpy).type).toBe('pie');
    await act(async () => {
      await selectEvent.clearAll(aggSelect);
    });
    await selectOption(
      screen.getByText('Group').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col3',
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    await spies.updateChartType('line');
    let lastChart = getLastChart(spies.createChartSpy);
    expect(
      (lastChart.options?.plugins?.tooltip?.callbacks?.label as any)?.({
        parsed: { x: 1545973200000, y: 1.123456 },
        dataset: { label: 'val1 - col1' },
        datasetIndex: 0,
      }),
    ).toBe('val1 - col1: 1.1235');
    await spies.updateChartType('wordcloud');
    await spies.updateChartType('line');
    await selectOption(
      screen.getByText('Chart per Group').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'On',
    );
    expect(result.getElementsByTagName('canvas')).toHaveLength(2);
    lastChart = getLastChart(spies.createChartSpy);
    expect(
      (lastChart.options?.plugins?.tooltip?.callbacks?.label as any)?.({
        parsed: { x: 1545973200000, y: 1.123456 },
        dataset: { label: '' },
        datasetIndex: 0,
      }),
    ).toBe('1.1235');
    await spies.updateChartType('wordcloud');
    expect(screen.queryAllByTestId('mock-wordcloud')).toHaveLength(2);
  });

  it('Charts: rendering empty data', async () => {
    await selectOption(
      screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'error',
    );
    await selectOption(
      screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'error2',
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(screen.getByRole('alert').textContent).toBe('No data found.');
    await spies.updateChartType('bar');
    expect(screen.getByRole('alert').textContent).toBe('No data found.');
  });

  it('Charts: rendering errors', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/chart-data/')) {
        return Promise.resolve({ data: { error: 'error test' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await selectOption(
      screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'error test',
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(screen.getByRole('alert').textContent).toBe('error test');
  });
});
