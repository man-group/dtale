import { Chart, ChartDataset, ChartMeta, DatasetController, Element, Scale, TooltipItem } from 'chart.js';

import * as chartUtils from '../chartUtils';
import correlationsUtils from '../popups/correlations/correlationsUtils';

import { mockChartJS } from './test-utils';

const CTX: Partial<CanvasRenderingContext2D> = {
  createLinearGradient: (_px1: number, _px2: number, _px3: number, _px4: number): CanvasGradient => ({
    addColorStop: (_px5: number, _color: string): void => undefined,
  }),
  save: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  lineWidth: 0,
  strokeStyle: undefined,
  stroke: () => undefined,
  restore: () => undefined,
};

const SCALE: Partial<Scale> = { getPixelForValue: (px: number): number => px };

const LINE_POINT: chartUtils.LinePoint = {
  element: { x: 0 } as any as Element,
  datasetIndex: 0,
  dataIndex: 0,
};

describe('chartUtils tests', () => {
  beforeAll(mockChartJS);

  const validateGradientFunctions = (dataset: ChartDataset<'line'>): void => {
    expect((dataset.borderColor as CanvasGradient).addColorStop).toBeInstanceOf(Function);
    expect((dataset.pointHoverBackgroundColor as CanvasGradient).addColorStop).toBeInstanceOf(Function);
    expect((dataset.pointBorderColor as CanvasGradient).addColorStop).toBeInstanceOf(Function);
    expect((dataset.pointBackgroundColor as CanvasGradient).addColorStop).toBeInstanceOf(Function);
    expect((dataset.pointHoverBorderColor as CanvasGradient).addColorStop).toBeInstanceOf(Function);
  };

  it('chartUtils: testing gradientLinePlugin with min & max', () => {
    const plugin = chartUtils.gradientLinePlugin(correlationsUtils.colorScale, 'y-corr', 1, -1);
    const dataset: ChartDataset<'line'> = { data: [{ x: 0, y: 0 }] };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-corr': { ...SCALE },
      },
      ctx: { ...CTX },
    } as any as Chart<'line'>;
    plugin.afterLayout?.(chartInstance, {}, {});
    validateGradientFunctions(dataset);
  });

  it('chartUtils: testing gradientLinePlugin without min & max', () => {
    const plugin = chartUtils.gradientLinePlugin(correlationsUtils.colorScale);
    const dataset: ChartDataset<'line'> = {
      data: [
        { x: 0, y: 1.1 },
        { x: 1, y: 1.2 },
        { x: 2, y: 1.3 },
      ],
    };
    const chartInstance = {
      data: { datasets: [dataset] },
      scales: {
        'y-axis-0': { ...SCALE },
      },
      ctx: { ...CTX },
    } as any as Chart<'line'>;
    plugin.afterLayout?.(chartInstance, {}, {});
    validateGradientFunctions(dataset);
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
      ctx: { ...CTX },
    } as any as Chart<'line'>;
    plugin.afterDraw?.(chartInstance, {}, {});
    expect(chartInstance.ctx.lineWidth).toBe(2);
    expect(chartInstance.ctx.strokeStyle).toBe('rgba(204,204,204,1)');
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
      tooltip: { dataPoints: [{ element: { x: 5 }, datasetIndex: 0 }] },
      getDatasetMeta: (_idx: number): ChartMeta =>
        ({
          controller: { _config: { selectedPoint: 0 } } as any as DatasetController,
          data: [LINE_POINT.element],
        } as ChartMeta),
      ctx: { ...CTX },
    } as any as Chart<'line'>;
    plugin.afterDraw?.(chartInstance, {}, {});
    expect(chartInstance.ctx.lineWidth).toBe(2);
    expect(chartInstance.ctx.strokeStyle).toBe('rgba(204,204,204,1)');
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
      { name: 'x', dtype: 'datetime64[ns]', locked: false },
      { name: 'y', dtype: 'float64', locked: false },
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
