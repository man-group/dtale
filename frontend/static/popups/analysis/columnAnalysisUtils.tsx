import { ChartConfiguration, TooltipItem } from 'chart.js';
import * as React from 'react';
import { RGBColor } from 'react-color';

import { Bouncer } from '../../Bouncer';
import * as chartUtils from '../../chartUtils';
import { calcInfoMsg, kurtMsgText, skewMsgText } from '../../dtale/column/ColumnMenuHeader';
import { RemovableError } from '../../RemovableError';
import * as ColumnAnalysisRepository from '../../repository/ColumnAnalysisRepository';
import { capitalize } from '../../stringUtils';
import FrequencyGrid from '../describe/FrequencyGrid';

import { ColumnAnalysisChart } from './ColumnAnalysisChart';
import {
  AnalysisParams,
  AnalysisProps,
  AnalysisState,
  AnalysisType,
  CategoryChartData,
  ChartJSAnalysisCharts,
  HistogramChartData,
  ValueCountChartData,
  WordValueCountChartData,
} from './ColumnAnalysisState';

const DESC_PROPS = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max', 'skew', 'kurt'];
const Tableau20 = ['#4E79A7', '#A0CBE8', '#F28E2B', '#FFBE7D', '#59A14F', '#8CD17D', '#B6992D'].concat(
  ['#F1CE63', '#499894', '#86BCB6', '#E15759', '#FF9D9A', '#79706E', '#BAB0AC'],
  ['#D37295', '#FABFD2', '#B07AA1', '#D4A6C8', '#9D7660', '#D7B5A6'],
);

const buildValueCountsAxes = (
  baseCfg: ChartConfiguration<'bar' | 'line', number[], string>,
  fetchedData: ValueCountChartData | WordValueCountChartData,
  chartOpts: AnalysisParams,
): void => {
  const { data, ordinal, percent } = fetchedData;
  baseCfg.data.datasets = [
    { label: 'Frequency', type: 'bar', data, backgroundColor: 'rgb(42, 145, 209)', yAxisID: 'y' },
  ];
  baseCfg.options = { ...baseCfg.options };
  baseCfg.options.scales = {
    x: { title: { display: true, text: 'Value' } },
    y: { title: { display: true, text: 'Frequency' }, position: 'left', suggestedMin: 0 },
  };
  if (ordinal) {
    const ordinalCol = chartOpts.ordinalCol?.value;
    const ordinalAgg = chartOpts.ordinalAgg?.value;
    baseCfg.options.scales['y-2'] = {
      title: { display: true, text: `${ordinalCol} (${ordinalAgg})` },
      position: 'right',
    };
    baseCfg.data.datasets.push({
      label: `${ordinalCol} (${ordinalAgg})`,
      type: 'line',
      fill: false,
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 2,
      data: ordinal,
      backgroundColor: 'rgb(255, 99, 132)',
      yAxisID: 'y-2',
      tension: 0.4,
      pointRadius: 0,
    });
  }
  baseCfg.options = {
    ...baseCfg.options,
    plugins: {
      ...baseCfg?.options?.plugins,
      tooltip: {
        mode: 'index',
        intersect: true,
        callbacks: {
          footer: (tooltipItems: Array<TooltipItem<'bar' | 'line'>>): string | void => {
            const percentage = (percent ?? [])[tooltipItems[0].dataIndex];
            if (percentage !== undefined) {
              return `${percentage}%`;
            }
          },
        },
      },
    },
  };
};

const buildCategoryAxes = (
  baseCfg: ChartConfiguration<'bar' | 'line', number[], string>,
  fetchedData: CategoryChartData,
  chartOpts: AnalysisParams,
): void => {
  const { data, count } = fetchedData;
  const yLabel = `${chartOpts.selectedCol} (${chartOpts?.categoryAgg?.label})`;
  baseCfg.data.datasets = [
    {
      label: 'Frequency',
      type: 'line',
      fill: false,
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 2,
      data: count,
      backgroundColor: 'rgb(255, 99, 132)',
      yAxisID: 'y-2',
      tension: 0.4,
    },
    { type: 'bar', data, backgroundColor: 'rgb(42, 145, 209)', yAxisID: 'y', label: yLabel },
  ];
  baseCfg.options = { ...baseCfg.options };
  baseCfg.options.scales = {
    x: { title: { display: true, text: chartOpts.categoryCol?.value } },
    y: { title: { display: true, text: yLabel }, position: 'left' },
    'y-2': { title: { display: true, text: 'Frequency' }, position: 'right', suggestedMin: 0 },
  };
  baseCfg.options.plugins = { ...baseCfg.options.plugins, tooltip: { mode: 'index', intersect: true } };
};

/**
 * Convert a hex string to r,g,b,a color properties.
 *
 * @param hex color hexidecimal string
 * @return r,g,b,a peroperties if valid hex string, undefined otherwise.
 */
function hexToRgb(hex: string): RGBColor | undefined {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
  }
  return undefined;
}

/**
 * Return tableau color for a specific index.
 *
 * @param idx index of tableau color.
 * @return rgba CSS color string if index exists, undefined otherwise.
 */
function targetColor(idx: number): string | undefined {
  const color = hexToRgb(Tableau20[idx % 20]);
  return color ? `rgba(${color!.r}, ${color!.g}, ${color!.b}, 0.5)` : undefined;
}

const buildHistogramAxes = (
  baseCfg: ChartConfiguration<'bar' | 'line', number[], string>,
  fetchedData: HistogramChartData,
  chartOpts: AnalysisParams,
): void => {
  const { data, targets, kde } = fetchedData;
  const xAxis = { title: { display: true, text: 'Bin' } };
  const yLabel = chartOpts.density ? 'Probability' : 'Frequency';
  const yAxis = { title: { display: true, text: yLabel, suggestedMin: 0 } };

  baseCfg.options = { ...baseCfg.options };
  if (targets) {
    baseCfg.options.scales = {
      x: { ...xAxis, stacked: true },
      y: { ...yAxis, stacked: false, beginAtZero: true },
    };
    baseCfg.data.datasets = targets.map((targetData, idx) => ({
      label: targetData.target,
      data: targetData.data,
      stacked: true,
      categoryPercentage: 1.0,
      barPercentage: 1.0,
      backgroundColor: targetColor(idx),
    }));
  } else {
    baseCfg.data.datasets = [
      { label: yLabel, type: 'bar', data: data, backgroundColor: 'rgb(42, 145, 209)', yAxisID: 'y' },
    ];
    baseCfg.options.scales = { x: xAxis, y: yAxis };
    if (kde) {
      baseCfg.options.scales = {
        x: xAxis,
        y: { ...yAxis, position: 'left' },
        'y-2': {
          title: { display: true, text: 'KDE' },
          position: 'right',
          min: 0,
          max: Math.max(...kde),
        },
      };
      baseCfg.data.datasets.push({
        label: 'KDE',
        type: 'line',
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.4,
        borderWidth: 2,
        data: kde,
        backgroundColor: 'rgb(255, 99, 132)',
        pointRadius: 0,
        yAxisID: 'y-2',
      });
    }
  }
  baseCfg.options.plugins = {
    ...baseCfg.options.plugins,
    legend: { display: true },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (tooltipItems: Array<TooltipItem<'bar' | 'line'>>): string =>
          `${chartOpts.selectedCol} ${tooltipItems[0].label}`,
        beforeBody: (): string => chartOpts?.target?.value ?? '',
      },
      itemSort: (a: TooltipItem<'bar' | 'line'>, b: TooltipItem<'bar' | 'line'>) =>
        (b.raw as number) - (a.raw as number),
    },
  };
};

/**
 * Builds a new chart.js chart instance.
 *
 * @param ctx reference to the element holding the chart.js chart
 * @param fetchedData data fetched to populate the chart
 * @param chartOpts parameters to the chart
 * @return chart.js chart instance
 */
export function createChart(
  ctx: HTMLCanvasElement,
  fetchedData: ChartJSAnalysisCharts,
  chartOpts: AnalysisParams,
): chartUtils.ChartObj {
  const { labels } = fetchedData;
  const describeDiv = document.getElementById('describe');
  if (describeDiv) {
    if (fetchedData.chart_type === AnalysisType.HISTOGRAM && fetchedData.desc) {
      const descHTML = DESC_PROPS.map((p) => {
        let markup = `${p === 'kurt' ? 'Kurtosis' : capitalize(p)}: <b>${fetchedData.desc?.[p]}</b>`;
        if (p === 'skew') {
          markup += calcInfoMsg('skew', skewMsgText(fetchedData.desc?.[p]));
        }
        if (p === 'kurt') {
          markup += calcInfoMsg('kurt', kurtMsgText(fetchedData.desc?.[p]));
        }
        return markup;
      }).join(', ');
      describeDiv.innerHTML = `<small>${descHTML}</small>`;
    } else {
      describeDiv.innerHTML = '';
    }
  }
  const chartCfg: ChartConfiguration<'bar' | 'line', number[], string> = {
    type: 'bar',
    data: { labels, datasets: [] },
    options: {
      plugins: { legend: { display: false } },
    },
  };
  switch (chartOpts.type) {
    case AnalysisType.HISTOGRAM:
      buildHistogramAxes(chartCfg, fetchedData as HistogramChartData, chartOpts);
      break;
    case AnalysisType.VALUE_COUNTS:
      buildValueCountsAxes(chartCfg, fetchedData as ValueCountChartData, chartOpts);
      break;
    case AnalysisType.WORD_VALUE_COUNTS:
      buildValueCountsAxes(chartCfg, fetchedData as WordValueCountChartData, chartOpts);
      break;
    case AnalysisType.CATEGORIES:
      buildCategoryAxes(chartCfg, fetchedData as CategoryChartData, chartOpts);
      break;
    default:
      break;
  }
  return chartUtils.createChart(ctx, chartCfg);
}

const emptyVal = (val: string): JSX.Element => (
  <div style={{ height: 400 }} className="missing-category">
    {`Please select a ${val}.`}
  </div>
);

export const isPlotly = (type: AnalysisType): boolean => ['geolocation', 'qq'].includes(type);

/**
 * Chart loader for column analysis
 *
 * @param props component properties
 * @param state component state
 * @param propagateState state updater
 * @param chartRef reference to the chart.js object
 * @param chartUpdater update the reference to the chart.js object
 * @param chartParams unpersisted component state
 */
export async function dataLoader(
  props: AnalysisProps,
  state: AnalysisState,
  propagateState: (state: Partial<AnalysisState>) => void,
  chartRef?: React.RefObject<chartUtils.ChartObj | undefined>,
  chartUpdater?: (chart?: chartUtils.ChartObj) => void,
  chartParams?: AnalysisParams,
): Promise<void> {
  const { chartData, height, dataId } = props;
  const finalParams: AnalysisParams = chartParams ?? state.chartParams ?? { type: AnalysisType.HISTOGRAM };
  const { selectedCol } = chartData;
  const params: Record<string, any> = {
    selectedCol: chartData.selectedCol,
    query: chartData.query ?? '',
    bins: finalParams.bins,
    top: finalParams.top,
    density: finalParams.density,
  };
  params.type = finalParams.type;
  params.filtered = props.filtered ?? true;
  if (isPlotly(params.type) || finalParams?.target) {
    chartRef?.current?.destroy?.();
    propagateState({ chart: <Bouncer /> });
  }
  if (params.type === AnalysisType.CATEGORIES && !finalParams.categoryCol) {
    propagateState({ chart: emptyVal('category'), code: undefined });
    return;
  }
  if (params.type === AnalysisType.GEOLOCATION) {
    if (!finalParams.latCol || !finalParams.lonCol) {
      propagateState({
        chart: emptyVal(finalParams.latCol ? 'latitude' : 'longitude'),
        code: undefined,
      });
      return;
    } else {
      params.latCol = finalParams.latCol?.value ?? '';
      params.lonCol = finalParams.lonCol?.value ?? '';
    }
  } else if ([AnalysisType.VALUE_COUNTS, AnalysisType.WORD_VALUE_COUNTS].includes(params.type)) {
    params.ordinalCol = finalParams.ordinalCol?.value ?? '';
    params.ordinalAgg = finalParams.ordinalAgg?.value ?? '';
  } else if (params.type === AnalysisType.HISTOGRAM) {
    params.density = finalParams.density ?? false;
    params.target = finalParams.target?.value ?? '';
  } else if (params.type === AnalysisType.CATEGORIES) {
    params.categoryCol = finalParams.categoryCol?.value ?? '';
    params.categoryAgg = finalParams.categoryAgg?.value ?? '';
  } else if (params.type === AnalysisType.FREQUENCY) {
    params.splits = finalParams.splits?.map((cleaner) => cleaner.value).join(',');
  }
  if (finalParams?.cleaners && finalParams?.cleaners?.length) {
    params.cleaners = finalParams.cleaners?.map((cleaner) => cleaner.value).join(',');
  }
  const response = await ColumnAnalysisRepository.loadAnalysis(dataId, params);
  if (response?.error) {
    propagateState({ error: <RemovableError {...response} /> });
    return;
  }
  if (response) {
    const newState: AnalysisState = {
      error: undefined,
      chartParams: finalParams,
      code: response?.code ?? '',
      dtype: response?.dtype ?? '',
      type: response?.chart_type ?? AnalysisType.HISTOGRAM,
      query: response?.query,
      cols: response?.cols ?? [],
      top: response?.top,
    };
    let wordValues;
    if (response?.chart_type === AnalysisType.WORD_VALUE_COUNTS) {
      wordValues = response.labels.map((label: string, index: number) => ({
        value: label,
        count: response.data[index],
      }));
    }
    if (response?.chart_type === AnalysisType.FREQUENCY) {
      newState.chart = (
        <FrequencyGrid finalParams={{ ...finalParams, selectedCol, type: newState.type }} fetchedChartData={response} />
      );
    } else {
      newState.chart = (
        <ColumnAnalysisChart
          chartRef={chartUpdater}
          finalParams={{ ...finalParams, selectedCol, type: newState.type }}
          fetchedChartData={response}
          height={height}
        />
      );
    }
    propagateState({ ...newState, wordValues });
  }
}
