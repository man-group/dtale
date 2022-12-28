import { Chart, ChartDataset, ChartMeta, DatasetController, Element, TooltipItem } from 'chart.js';

import * as chartUtils from '../chartUtils';
import * as correlationsUtils from '../popups/correlations/correlationsUtils';

import { mockColumnDef } from './mocks/MockColumnDef';
import { buildChartContext, mockChartJS, SCALE } from './test-utils';

const LINE_POINT = {
  element: { x: 0 } as any as Element,
  datasetIndex: 0,
  dataIndex: 0,
  dataset: { yAxisID: 'y-corr' } as any as ChartDataset<'line', number[]>,
  parsed: { x: 0, y: 0 },
} as any as TooltipItem<'line'>;

describe('chartUtils tests', () => {
  beforeAll(mockChartJS);

  it('chartUtils: testing gradientLinePlugin with min & max', () => {
    const lineGradient = chartUtils.getLineGradient(correlationsUtils.colorScale, 'y-corr', 1, -1);
    const dataset: ChartDataset<'line', number[]> = { data: [0] };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-corr': { ...SCALE },
      },
      ctx: buildChartContext(),
    } as any as Chart<'line'>;
    const gradient = lineGradient(chartInstance, dataset.data);
    expect(gradient.addColorStop).toBeInstanceOf(Function);
  });

  it('chartUtils: testing gradientLinePlugin without min & max', () => {
    const lineGradient = chartUtils.getLineGradient(correlationsUtils.colorScale);
    const dataset: ChartDataset<'line', number[]> = {
      data: [1.1, 1.2, 1.3],
    };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-axis-0': { ...SCALE },
      },
      ctx: buildChartContext(),
    } as any as Chart<'line'>;
    const gradient = lineGradient(chartInstance, dataset.data);
    expect(gradient.addColorStop).toBeInstanceOf(Function);
  });

  it('chartUtils: testing lineHoverPlugin', () => {
    const plugin = chartUtils.lineHoverPlugin(correlationsUtils.colorScale);
    const dataset = { data: [{ x: 0, y: 0 }], yAxisID: 'y-corr' };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-corr': {
          ...SCALE,
          top: 0,
          bottom: 10,
        },
      },
      tooltip: { dataPoints: [LINE_POINT] },
      getDatasetMeta: (_idx: number): ChartMeta =>
        ({
          controller: { _config: { selectedPoint: 0 } } as any as DatasetController,
          data: [LINE_POINT.element],
        } as ChartMeta),
      ctx: buildChartContext(),
    } as any as Chart<'line'>;
    plugin.afterDraw?.(chartInstance, {}, {});
    expect(chartInstance.ctx.lineWidth).toBe(2);
    expect(chartInstance.ctx.strokeStyle).toBe('#ffff00');
  });

  it('chartUtils: testing lineHoverPlugin for default', () => {
    const plugin = chartUtils.lineHoverPlugin(correlationsUtils.colorScale);
    const dataset = {
      data: [{ x: 0, y: 0 }],
      yAxisID: 'y-corr',
      selectedPoint: 0,
    };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-corr': {
          ...SCALE,
          top: 0,
          bottom: 10,
        },
      },
      tooltip: { dataPoints: [] },
      getDatasetMeta: (_idx: number): ChartMeta =>
        ({
          controller: { _config: { selectedPoint: 0 } } as any as DatasetController,
          data: [LINE_POINT.element],
        } as ChartMeta),
      ctx: buildChartContext(),
    } as any as Chart<'line'>;
    plugin.afterDraw?.(chartInstance, {}, {});
    expect(chartInstance.ctx.lineWidth).toBe(0);
    expect(chartInstance.ctx.beginPath).not.toHaveBeenCalled();
    expect(chartInstance.ctx.strokeStyle).toBeUndefined();
  });

  it('chartUtils: testing buildTicks', () => {
    const range = { min: { y: 0.1 }, max: { y: 0.6 } };
    expect(chartUtils.buildTicks('y', range, true)).toEqual({
      min: 0.095,
      max: 0.605,
    });
  });

  it('chartUtils: testing buildSeries', () => {
    const series = {
      y: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
      x: [1514782800000, 1514786400000, 1514790000000, 1514793600000, 1514797200000, 1514800800000],
    };
    const data = {
      data: { series1: series, series2: series },
      min: { x: 1514782800000, y: 0.1 },
      max: { x: 1514800800000, y: 0.6 },
      x: 'x',
      y: ['y'],
    };
    const columns = [
      mockColumnDef({ name: 'x', dtype: 'datetime64[ns]' }),
      mockColumnDef({ name: 'y', dtype: 'float64' }),
    ];
    const cfg = chartUtils.createLineCfg(data, {
      columns,
      x: 'x',
      y: ['y'],
      configHandler: (chartCfg) => chartCfg,
    });
    expect(cfg.data?.datasets[0].label).toBe('series1');
    const tooltipItem = {
      parsed: { y: 0.1 },
      dataset: { label: 'series1' },
      datasetIndex: 0,
    } as TooltipItem<'line'>;
    expect(chartUtils.tooltipLabelCallback(tooltipItem, data.data, data.y)).toBe('series1: 0.1');
  });
});
