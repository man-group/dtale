/* eslint max-lines: "off" */
import { BoxAndWiskers, BoxPlotController } from '@sgratzl/chartjs-chart-boxplot';
import {
  BarController,
  BarElement,
  CartesianScaleOptions,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartDataset,
  ChartOptions,
  ChartType,
  DefaultDataPoint,
  Element,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  Plugin,
  PointElement,
  Scale,
  ScatterController,
  ScatterDataPoint,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import Zoom from 'chartjs-plugin-zoom';
import chroma from 'chroma-js';
import moment from 'moment';
import Plotly from 'plotly.js-geo-dist-min';

import { buildRGB } from './colors';
import { ColumnDef } from './dtale/DataViewerState';
import * as gu from './dtale/gridUtils';
import { GeolocationChartData, QQChartData } from './popups/analysis/ColumnAnalysisState';
import { formatScatterPoints } from './scatterChartUtils';

Chart.register(
  BarController,
  BarElement,
  BoxPlotController,
  BoxAndWiskers,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  ScatterController,
  Title,
  Tooltip,
  Zoom,
);

/** Type definition for chart.js chart instance */
export type ChartObj = Chart<ChartType, DefaultDataPoint<ChartType>, unknown>;

/**
 * Builds a new chart.js chart instance.
 *
 * @param ctx reference to the element holding the chart.js chart
 * @param cfg chart.js chart configuration
 * @return chart.js chart instance
 */
export function createChart(
  ctx: HTMLCanvasElement,
  cfg: ChartConfiguration<ChartType, DefaultDataPoint<ChartType>, unknown>,
): ChartObj {
  const options = cfg.options || {};
  const finalCfg = { ...cfg, options };
  return new Chart(ctx, finalCfg);
}

/**
 * Resize a canvas element to be full size of its container.
 * http://stackoverflow.com/a/10215724/509706
 *
 * @param canvas the canvas element to resize.
 */
export function fitToContainer(canvas: HTMLCanvasElement): void {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

/**
 * Chart builder wrapper which performs cleanup on old charts and resizing.
 *
 * @param ctxId ID of the canvas holding the chart.js chart.
 * @param prevChart previous instance of chart.
 * @param builder chart builder
 * @return new chart instance
 */
export function chartWrapper(
  ctxId: string,
  prevChart?: ChartObj | undefined,
  builder?: (chartCtx: HTMLCanvasElement) => ChartObj | undefined,
): ChartObj | undefined {
  const ctx = document.getElementById(ctxId) as HTMLCanvasElement;
  if (ctx) {
    if (prevChart) {
      prevChart.destroy();
    }
    fitToContainer(ctx as HTMLCanvasElement);
    return builder?.(ctx) ?? undefined;
  }
  return undefined;
}

export const TS_COLORS = [
  'rgb(42, 145, 209)',
  'rgb(255, 99, 132)',
  'rgb(255, 159, 64)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(54, 162, 235)',
  'rgb(153, 102, 255)',
  'rgb(231,233,237)',
];

/**
 * Synchronize all color-based properties of chart.js chart configuration to a specific color.
 *
 * @param cfg chart.js chart configuration.
 * @param color color to update to.
 */
export function updateColorProps(cfg: ChartDataset<'line'>, color: string): void {
  cfg.borderColor = color;
  cfg.backgroundColor = color;
  cfg.pointHoverBackgroundColor = color;
  cfg.pointBorderColor = color;
  cfg.pointBackgroundColor = color;
  cfg.pointHoverBorderColor = color;
}

/**
 * Get the y-bounds of an array of scatter data points.
 *
 * @param data scatter chart data.
 * @param minY the pre-calculated minimum y-value.
 * @param maxY the pre-calculated maximum y-value.
 * @return min/max of scatter data y-value.
 */
function fetchYBounds(data: number[], minY?: number, maxY?: number): { min: number; max: number } {
  let finalMinY: number | undefined = minY;
  let finalMaxY: number | undefined = maxY;
  if (minY !== undefined || maxY !== undefined) {
    const sortedData = data.sort((a: number, b: number) => (a > b ? 1 : -1));
    finalMinY = finalMinY === undefined ? sortedData[0] : finalMinY;
    finalMaxY = finalMaxY === undefined ? sortedData[sortedData.length - 1] : finalMaxY;
  }
  return { min: finalMinY ?? 0, max: finalMaxY ?? 0 };
}

export const getLineGradient =
  (
    colorScale: chroma.Scale,
    yAxisID?: string,
    minY?: number,
    maxY?: number,
  ): ((chart: Chart<'line', number[], unknown>, data: number[]) => CanvasGradient) =>
  (chart: Chart<'line', number[], unknown>, data: number[]): CanvasGradient => {
    const { ctx, scales } = chart;
    const rgbaBuilder = buildRGB(colorScale);
    // The context, needed for the creation of the linear gradient.
    // The first (and, assuming, only) dataset.
    // Calculate sort data for easy min/max access.
    const { min: finalMinY, max: finalMaxY } = fetchYBounds(data, minY, maxY);
    // Calculate Y pixels for min and max values.
    const yAxis = scales[yAxisID ?? 'y-axis-0'];
    const minValueYPixel = yAxis.getPixelForValue(finalMinY);
    const maxValueYPixel = yAxis.getPixelForValue(finalMaxY);
    // Create the gradient.
    const gradient = ctx.createLinearGradient(0, minValueYPixel, 0, maxValueYPixel);
    gradient.addColorStop(0, rgbaBuilder(finalMinY)); // red
    if (finalMinY < 0 && finalMaxY > 0) {
      gradient.addColorStop(0.5, rgbaBuilder(0)); // yellow
    }
    gradient.addColorStop(1, rgbaBuilder(finalMaxY)); // green
    return gradient;
  };

/** Configuration of point in chart.js line chart */
export interface LinePoint {
  element: Element;
  dataIndex: number;
  datasetIndex: number;
}

/**
 * Draw vertical line on chart.js line chart for the point where the mouse is hovering.
 *
 * @param chart current chart.js line chart.
 * @param point hovered point.
 * @param colorBuilder the color scale to build the line color.
 */
function drawLine(
  chart: Chart<'line', number[], unknown>,
  point: TooltipItem<'line'>,
  colorBuilder: (val: number) => string,
): void {
  const { ctx } = chart;
  const x = point.element.x;
  const yAxisID = point.dataset.yAxisID;
  const topY = chart.scales[yAxisID!].top;
  const bottomY = chart.scales[yAxisID!].bottom;

  // draw line
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colorBuilder(point.parsed.y);
  ctx.moveTo(x, topY);
  ctx.lineTo(x, bottomY);
  ctx.stroke();
  ctx.restore();
}

export const lineHoverPlugin = (colorScale: chroma.Scale): Plugin<'line'> => ({
  id: 'lineHoverPlugin',

  defaults: {
    width: 2,
    color: '#2A91D1',
  },

  afterEvent: (chart) => {
    chart.draw();
  },

  afterDraw: (chart: Chart<'line', number[], unknown>): void => {
    const dataPoints = chart.tooltip?.dataPoints;
    if (dataPoints?.length) {
      drawLine(chart, dataPoints[0], (val: number): string => colorScale(val).hex());
      return;
    }
  },
});

const COLOR_SCALE = chroma.scale(['orange', 'yellow', 'green', 'lightblue', 'darkblue']);

export const updateLegend = (cfg: Partial<ChartConfiguration>, forceHide = false): void => {
  if (forceHide || (cfg.data?.datasets && cfg.data.datasets.length < 2)) {
    cfg.options = { ...cfg.options, plugins: { ...cfg.options?.plugins, legend: { display: false } } };
  }
};

/**
 * chart.js series builder.
 *
 * @param label the series label.
 * @param data input data.
 * @param i series index.
 * @param yProp y-coordinate property name.
 * @return chart.js line chart dataset object.
 */
function buildSeries(
  label: string,
  data: Record<string, Array<string | number>>,
  i: number,
  yProp: string,
): ChartDataset<'line'> {
  const labels = [];
  if (label !== 'all') {
    labels.push(label);
  }
  if (yProp !== 'y') {
    labels.push(yProp);
  }

  return {
    fill: false,
    pointRadius: 0,
    tension: 0.1,
    pointHoverRadius: 5,
    pointHitRadius: 5,
    data: data[yProp] as number[],
    yAxisID: `y-${yProp}`,
    label: labels.join(' - '),
  };
}

/**
 * Tick configuration builder for chart.js scales.
 *
 * @param prop y-coordinate property name.
 * @param dataSpec chart data specification.
 * @param pad true, if extra padding should be applied to tick bounds, false otherwise.
 * @return chart.js scale tick configuration.
 */
export function buildTicks(prop: string, dataSpec: Partial<DataSpec>, pad = false): Partial<Scale> {
  const { min, max } = dataSpec;
  const range = { min: min?.[prop] ?? 0, max: max?.[prop] ?? 0 };
  if (pad) {
    const padFactor = (range.max - range.min) * 0.01;
    return { min: range.min - padFactor, max: range.max + padFactor };
  }
  return range;
}

const formatNumber = (val: number, digits: number): string => `${parseFloat(val.toFixed(digits))}`;

/** Type definition for input data for chart.js charts */
export type InputData = Record<string, Record<string, Array<string | number>>>;

/** Type definition for axis ranges for chart.js charts */
export interface AxisSpec {
  min: Record<string, number>;
  max: Record<string, number>;
}

/** Type definition for data specifications input for chart.js charts */
export interface DataSpec extends AxisSpec {
  data?: InputData;
}

/** Type definition for property specifications input for chart.js charts */
export type PropSpec = {
  x: string;
  y: string[];
  columns?: ColumnDef[];
  additionalOptions?: Partial<ChartOptions>;
  configHandler?: (cfg: Partial<ChartConfiguration>) => Partial<ChartConfiguration>;
};

export const tooltipLabelCallback = (tooltipItem: TooltipItem<'line'>, data: InputData, y: string[]): string => {
  const value = formatNumber(tooltipItem.parsed.y, 4);
  if (Object.keys(data).length * y.length > 1) {
    const label = tooltipItem.dataset.label || '';
    if (label) {
      return `${label}: ${value}`;
    }
  }
  return `${value}`;
};

/**
 * Create a chart.js base chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @param seriesFormatter chart.js series formatter.
 * @return chart.js base chart configuration.
 */
function createBaseCfg(
  dataSpec: DataSpec,
  propSpec: PropSpec,
  seriesFormatter: (
    label: string,
    seriesData: Record<string, any>,
    i: number,
    yProp: string,
  ) => ChartDataset = buildSeries,
): Partial<ChartConfiguration> {
  const { min, max } = dataSpec;
  const data = dataSpec.data ?? {};
  const { x, y, additionalOptions } = propSpec;
  const cfg: Partial<ChartConfiguration> = {
    data: {
      labels: Object.values(data)[0]?.x as string[],
      datasets: Object.entries(data)
        .map(([k, v]) => y.map((yProp: string, i: number) => seriesFormatter(k, v, i, yProp)))
        .flat(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: {
            wheel: { enabled: true, speed: 0.5 },
            pinch: { enabled: true },
            mode: 'x',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (tooltipItem: TooltipItem<'line'>) => tooltipLabelCallback(tooltipItem, data, y),
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        x: {
          title: {
            display: true,
            text: x,
          },
        },
        ...y.reduce(
          (res, yProp, idx) => ({
            ...res,
            [`y-${yProp}`]: {
              title: {
                display: true,
                text: yProp,
              },
              ticks: buildTicks(yProp, { min, max }),
              position: idx % 2 === 0 ? 'left' : 'right',
            },
          }),
          {},
        ),
      },
      ...additionalOptions,
    },
  };
  updateLegend(cfg);
  return cfg;
}

/**
 * Create a chart.js line chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @return chart.js line chart configuration.
 */
export function createLineCfg(dataSpec: DataSpec, propSpec: PropSpec): Partial<ChartConfiguration> {
  const { data, min, max } = dataSpec;
  const { x, y, additionalOptions, configHandler } = propSpec;
  const seriesCt = Object.keys(data ?? {}).length * y.length;
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (
    k: string,
    v: Record<string, Array<string | number>>,
    i: number,
    yProp: string,
  ): ChartDataset<'line'> => {
    const ptCfg = buildSeries(k, v, i, yProp);
    updateColorProps(ptCfg, seriesCt === 1 ? 'rgb(42, 145, 209)' : colors(i).hex());
    return ptCfg;
  };
  const cfg = createBaseCfg({ data, min, max }, { x, y, additionalOptions }, seriesFormatter);
  return { ...(configHandler?.(cfg) ?? cfg), type: 'line' };
}

/**
 * Create a chart.js bar chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @return chart.js bar chart configuration.
 */
export function createBarCfg(dataSpec: DataSpec, propSpec: PropSpec): Partial<ChartConfiguration> {
  return { ...createLineCfg(dataSpec, propSpec), type: 'bar' };
}

/**
 * Create a chart.js stacked bar chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @return chart.js stacked bar chart configuration.
 */
export function createStackedCfg(dataSpec: DataSpec, propSpec: PropSpec): Partial<ChartConfiguration> {
  const cfg = createLineCfg(dataSpec, propSpec);
  cfg.type = 'bar';
  cfg.options = {
    scales: {
      ...cfg.options?.scales,
      x: { ...cfg.options?.scales?.x, stacked: true } as CartesianScaleOptions,
    },
  };
  Object.entries(cfg.options?.scales ?? {}).forEach(([axisId, axisCfg]): void => {
    if (axisId.indexOf('y') === 0 && axisCfg) {
      (axisCfg as CartesianScaleOptions).stacked = true;
    }
  });
  return cfg;
}

/**
 * Create a chart.js pie chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @return chart.js pie chart configuration.
 */
export function createPieCfg(dataSpec: DataSpec, propSpec: PropSpec): Partial<ChartConfiguration> {
  const { data } = dataSpec;
  const seriesCt = Object.values(data ?? {})[0]?.x.length;
  const colors = COLOR_SCALE.domain([0, seriesCt]);
  const seriesFormatter = (
    k: string,
    v: Record<string, Array<string | number>>,
    i: number,
    yProp: string,
  ): ChartDataset<'line'> => {
    const ptCfg = buildSeries(k, v, i, yProp);
    updateColorProps(ptCfg, seriesCt === 1 ? 'rgb(42, 145, 209)' : colors(i).hex());
    return ptCfg;
  };
  const cfg = createBaseCfg(dataSpec, propSpec, seriesFormatter);
  cfg.type = 'pie';
  delete cfg.options?.scales;
  delete cfg.options?.plugins?.tooltip;
  if (gu.isDateCol((propSpec.columns ?? []).find(({ name }) => name === propSpec.x)?.dtype)) {
    if (cfg.data?.labels) {
      cfg.data.labels = cfg.data.labels.map((l) => moment(new Date(l as string)).format('YYYY-MM-DD'));
    }
  }
  return propSpec.configHandler?.(cfg) ?? cfg;
}

/**
 * Default scatter chart data builder, converts object of arrays to array of x/y coordinate objects.
 *
 * @param data object of arrays.
 * @param prop the y-coordinate property name.
 * @return array of x/y coordinate objects.
 */
const scatterBuilder = (
  data: Record<string, Record<string, Array<string | number>>>,
  prop: string,
): ScatterDataPoint[] =>
  ((data.all.x ?? []) as number[]).map((xVal: number, i: number) => ({ x: xVal, y: data.all[prop]?.[i] as number }));

/** Type definition for scatter chart data builders */
type ScatterBuilderDef = (
  data: Record<string, Record<string, Array<string | number>>>,
  prop: string,
) => ScatterDataPoint[];

/**
 * Create a chart.js scatter chart configuration.
 *
 * @param dataSpec chart data specification.
 * @param propSpec chart property specification.
 * @param dataBuilder builder function for scatter chart data.
 * @return chart.js scatter chart configuration.
 */
export function createScatterCfg(
  dataSpec: DataSpec,
  propSpec: PropSpec,
  dataBuilder: ScatterBuilderDef = scatterBuilder,
): ChartConfiguration<'scatter'> {
  const { x, y } = propSpec;
  const yProp = y[0];
  const chartData = dataBuilder(dataSpec.data ?? {}, yProp);
  const scatterData = formatScatterPoints(chartData);
  const cfg: Partial<ChartConfiguration> = {
    options: {
      scales: {
        x: {
          title: { display: true, text: x },
        },
        y: {
          title: { display: true, text: yProp },
        },
      },
      plugins: {
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: {
            wheel: { enabled: true, speed: 0.5 },
            pinch: { enabled: true },
            mode: 'x',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (tooltipItem: TooltipItem<'line'>) => {
              const pointData = tooltipItem.raw as ScatterDataPoint;
              return [`${x}: ${formatNumber(pointData.x, 4)}`, `${yProp}: ${formatNumber(pointData.y, 4)}`];
            },
          },
        },
      },
      maintainAspectRatio: true,
      responsive: true,
      ...propSpec.additionalOptions,
    },
  };
  updateLegend(cfg);
  return {
    ...(propSpec.configHandler?.(cfg) ?? cfg),
    type: 'scatter',
    data: { datasets: [scatterData] },
  } as ChartConfiguration<'scatter'>;
}

/**
 * Create a plotly scattergeo chart.
 *
 * @param ctxId the ID of the div component housing the chart.
 * @param fetchedData the data coming from the server.
 */
export async function createGeolocation(ctxId: string, fetchedData: GeolocationChartData): Promise<void> {
  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    legend: { orientation: 'h' },
    margin: { b: 0, l: 0, r: 0, t: 0 },
    geo: { fitbounds: 'locations' },
  };
  const data: Plotly.Data[] = [
    {
      type: 'scattergeo',
      mode: 'markers',
      marker: { color: 'darkblue' },
      lat: fetchedData.lat,
      lon: fetchedData.lon,
    },
  ];
  await Plotly.newPlot(ctxId, data, layout);
}

/**
 * Create a plotly QQ plot.
 *
 * @param ctxId the ID of the div component housing the chart.
 * @param fetchedData the data coming from the server.
 */
export async function createQQ(ctxId: string, fetchedData: QQChartData): Promise<void> {
  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    legend: { orientation: 'h' },
    margin: { b: 0, l: 0, r: 0, t: 0 },
  };
  const data: Plotly.Data[] = [
    {
      type: 'scattergl',
      mode: 'markers',
      marker: { color: 'darkblue' },
      name: 'qq',
      x: fetchedData.x,
      y: fetchedData.y,
    },
    {
      type: 'scattergl',
      mode: 'lines',
      marker: { color: 'red' },
      name: 'OLS Trendline',
      x: fetchedData.x2,
      y: fetchedData.y2,
    },
  ];
  await Plotly.newPlot(ctxId, data, layout);
}
